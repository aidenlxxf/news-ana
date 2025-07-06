import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { PrismaService } from "@/prisma.service";
import { generateParamsHash } from "@/utils/hash.util";
import { generateSchedulerId } from "@/utils/bullmq-id.util";
import { Prisma } from "@prisma/client";
import { CreateTaskResponseDto } from "./dto/create-task.dto";
import { GetTaskResponseDto } from "./dto/get-task.dto";
import { ListTaskExecutionsResponseDto } from "./dto/list-task-executions.dto";
import { ListTasksResponseDto } from "./dto/list-task.dto";
import { RefreshTaskResponseDto } from "./dto/refresh-task.dto";
import {
  TaskParametersV1,
  TaskParametersV1Schema,
} from "./schema/task-parameters.schema";
import * as v from "valibot";
import { type TaskSchedulerQueue } from "./task-scheduler.worker";

@Injectable()
export class NewsAnalysisTaskService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("task-scheduler")
    private readonly taskSchedulerQueue: TaskSchedulerQueue,
  ) {}

  private async scheduleTask(taskId: string) {
    return await this.taskSchedulerQueue.upsertJobScheduler(
      generateSchedulerId(taskId),
      {
        every: 1000 * 60 * 60,
      },
      {
        name: `task-scheduler:${taskId}`,
        data: { taskId },
      },
    );
  }

  async createTask({
    country,
    category,
    query,
  }: Pick<
    TaskParametersV1,
    "country" | "category" | "query"
  >, userId: string): Promise<CreateTaskResponseDto> {
    const parameters = v.parse(TaskParametersV1Schema, {
      country,
      category,
      query,
      version: "news-fetch:v1",
    });

    const task = await this.prisma.$transaction(async (tx) => {
      try {
        const task = await tx.task.create({
          data: {
            userId,
            parameters,
            paramsHash: generateParamsHash(country, category, query),
          },
        });
        await this.scheduleTask(task.id);

        return task;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === "P2002") {
            throw new ConflictException(
              "Task with same parameters already exists",
            );
          }
        }
        throw err;
      }
    });
    return {
      taskId: task.id,
      message: "News analysis task created successfully",
    };
  }

  async getTask(taskId: string, userId: string): Promise<GetTaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
      include: {
        executions: {
          select: {
            status: true,
            startedAt: true,
            completedAt: true,
          },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const lastExecution = task.executions[0];
    const params = task.parameters;

    return {
      id: task.id,
      country: params.country,
      category: params.category,
      query: params.query,
      createdAt: task.createdAt.toISOString(),
      lastExecution: lastExecution
        ? {
            status: lastExecution.status,
            startedAt: lastExecution.startedAt?.toISOString() || "",
            completedAt: lastExecution.completedAt?.toISOString(),
          }
        : undefined,
    };
  }

  async cancelTask(taskId: string, userId: string): Promise<{ message: string }> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });
    await this.taskSchedulerQueue.removeJobScheduler(
      generateSchedulerId(taskId),
    );
    return {
      message: "Task cancelled successfully",
    };
  }

  async getTaskExecutions(
    taskId: string,
    query: {
      limit?: number;
      offset?: number;
    },
    userId: string,
  ): Promise<ListTaskExecutionsResponseDto> {
    const { limit = 10, offset = 0 } = query;

    // First verify the task belongs to the user
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const executions = await this.prisma.taskExecution.findMany({
      where: { taskId },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true,
        result: true,
      },
      skip: offset,
      take: limit,
    });

    return {
      executions: executions.map((execution) => ({
        id: execution.id,
        status: execution.status,
        startedAt: execution.startedAt?.toISOString(),
        completedAt: execution.completedAt?.toISOString(),
        result: execution.result,
        errorMessage: execution.errorMessage || undefined,
      })),
      limit,
      offset,
    };
  }

  async listTasks(query: {
    limit?: number;
    offset?: number;
  }, userId: string): Promise<ListTasksResponseDto> {
    const { limit = 10, offset = 0 } = query;

    const tasks = await this.prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        parameters: true,
        createdAt: true,
        executions: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    return {
      tasks: tasks.map(({ id, parameters: params, createdAt, executions }) => {
        return {
          id,
          country: params.country,
          category: params.category,
          query: params.query,
          createdAt: createdAt.toISOString(),
          lastExecutionStatus: executions[0]?.status,
        };
      }),
      limit,
      offset,
    };
  }

  async refreshTask(taskId: string, userId: string): Promise<RefreshTaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    await this.scheduleTask(taskId);

    return {
      taskId,
      message: "Task refresh triggered successfully",
    };
  }
}
