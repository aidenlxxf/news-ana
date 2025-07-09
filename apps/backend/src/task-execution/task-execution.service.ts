import { isAnalyzedResult, TaskNotificationDto } from "@na/schema";
import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import {
  ExecutionStatus,
  type Prisma,
  Task,
  TaskExecution,
  User,
} from "@prisma/client";
import { PrismaService } from "@/prisma.service";
import { NotificationService } from "@/notification/notification.service";

@Injectable()
export class TaskExecutionService {
  private readonly logger = new Logger(TaskExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService?: NotificationService,
  ) {}

  async createExecution(taskId: string): Promise<TaskExecution> {
    const execution = await this.prisma.taskExecution.create({
      data: {
        status: ExecutionStatus.PENDING,
        startedAt: new Date(),
        task: { connect: { id: taskId } },
      },
      include: { task: { include: { user: true } } },
    });

    this.logger.log(`Created execution ${execution.id} for task ${taskId}`);
    return execution;
  }

  async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    data?: Omit<Prisma.TaskExecutionUpdateInput, "status">,
  ): Promise<TaskExecution> {
    const execution = await this.prisma.taskExecution.update({
      where: { id: executionId },
      data: { status, ...data },
      include: {
        task: { include: { user: true } },
      },
    });

    this.logger.log(`Updated execution ${executionId} status to ${status}`);

    // Send notification for all status changes
    await this.sendNotification(execution, status);

    return execution;
  }

  private async sendNotification(
    execution: TaskExecution & {
      task: Task & {
        user: User;
      };
    },
    status: ExecutionStatus,
  ): Promise<void> {
    const message = this.buildNotificationMessage(execution, status);
    const pushType = this.getPushType(status);

    this.logger.log(
      `Sending notification for execution ${execution.id}: ${message} (pushType: ${pushType})`,
    );

    if (this.notificationService) {
      const notification: TaskNotificationDto = {
        taskId: execution.taskId,
        message,
        status: status === ExecutionStatus.COMPLETED ? "success" : "error",
        type: "task",
        pushType,
      };

      await this.notificationService.sendNotification(
        execution.task.user.id,
        notification,
      );
    } else {
      this.logger.warn(
        "NotificationService not available, skipping notifications",
      );
    }
  }

  private getPushType(status: ExecutionStatus): "refresh" | "notification" {
    // Only show notifications for final states (completed/failed)
    // Intermediate states (fetching/analyzing) only trigger page refresh
    switch (status) {
      case ExecutionStatus.COMPLETED:
      case ExecutionStatus.FAILED:
        return "notification";
      case ExecutionStatus.PENDING:
      case ExecutionStatus.FETCHING:
      case ExecutionStatus.ANALYZING:
        return "refresh";
      default:
        return "refresh";
    }
  }

  private buildNotificationMessage(
    execution: TaskExecution & { task: Task },
    status: ExecutionStatus,
  ): string {
    if (status === ExecutionStatus.FAILED) {
      return `Task analysis failed: ${execution.errorMessage || "Unknown error"}`;
    }

    if (execution.result && isAnalyzedResult(execution.result)) {
      return execution.result.analysis.briefSummary.text;
    }

    return "Task analysis completed successfully";
  }
}
