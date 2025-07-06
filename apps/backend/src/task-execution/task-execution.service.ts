import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  TaskExecution,
  ExecutionStatus,
  Task,
  User,
  PushSubscription,
  type Prisma,
} from "@prisma/client";
import { isAnalyzedResult } from "../schema/news-analysis.schema";
import { PushNotificationDto } from "../webpush/dto/push-subscription.dto";
import { WebPushService } from "../webpush/webpush.service";

@Injectable()
export class TaskExecutionService {
  private readonly logger = new Logger(TaskExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WebPushService))
    private readonly webPushService?: WebPushService,
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
        task: { include: { user: { include: { pushSubscriptions: true } } } },
      },
    });

    this.logger.log(
      `Updated execution ${executionId} status to ${status}`,
    );

    if (
      status === ExecutionStatus.COMPLETED ||
      status === ExecutionStatus.FAILED
    ) {
      await this.sendPushNotification(execution, status);
    }

    return execution;
  }

  private async sendPushNotification(
    execution: TaskExecution & {
      task: Task & {
        user: User & {
          pushSubscriptions: PushSubscription[];
        };
      };
    },
    status: ExecutionStatus,
  ): Promise<void> {
    const message = this.buildNotificationMessage(execution, status);

    this.logger.log(
      `Sending push notification for execution ${execution.id}: ${message}`,
    );

    if (this.webPushService) {
      const notification: PushNotificationDto = {
        taskId: execution.taskId,
        message,
        type: status === ExecutionStatus.COMPLETED ? "success" : "error",
      };

      for (const subscription of execution.task.user.pushSubscriptions) {
        await this.webPushService.sendNotification(subscription, notification);
      }
    } else {
      this.logger.warn(
        "WebPushService not available, skipping push notifications",
      );
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
