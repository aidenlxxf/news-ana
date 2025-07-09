import {
  ApiErrorResponse,
  TaskExecution,
  TaskParametersV1,
  TaskParametersV1Schema,
} from "@na/schema";
import { InjectQueue } from "@nestjs/bullmq";
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as v from "valibot";
import { PrismaService } from "@/prisma.service";
import { generateSchedulerId } from "@/utils/bullmq-id.util";
import { generateParamsHash } from "@/utils/hash.util";
import { CreateTaskResponseDto } from "./dto/create-task.dto";
import { GetLatestResultResponseDto } from "./dto/get-latest-result.dto";
import { GetTaskResponseDto } from "./dto/get-task.dto";
import { ListTasksResponseDto } from "./dto/list-task.dto";
import { ListTaskExecutionsResponseDto } from "./dto/list-task-executions.dto";
import { RefreshTaskResponseDto } from "./dto/refresh-task.dto";
import { UpdateTaskResponseDto } from "./dto/update-task.dto";
import { type TaskSchedulerQueue } from "./task-scheduler.worker";

@Injectable()
export class NewsAnalysisTaskService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("task-scheduler")
    private readonly taskSchedulerQueue: TaskSchedulerQueue,
  ) {}

  private async scheduleTask(taskId: string) {
    const schedulerId = generateSchedulerId(taskId);
    const existing = await this.taskSchedulerQueue.getJobScheduler(schedulerId);
    if (existing) {
      // ask scheduler to run immediately
      await this.taskSchedulerQueue.add(`task-scheduler:${taskId}`, { taskId });
      return;
    }
    return await this.taskSchedulerQueue.upsertJobScheduler(
      schedulerId,
      { pattern: "0 0 * * *", immediately: true },
      { name: `task-scheduler:${taskId}`, data: { taskId } },
    );
  }

  async createTask(
    {
      country,
      category,
      query,
    }: Pick<TaskParametersV1, "country" | "category" | "query">,
    userId: string,
  ): Promise<CreateTaskResponseDto> {
    const parameters = v.parse(TaskParametersV1Schema, {
      country,
      category,
      query,
      version: "news-fetch:v1",
    });

    const paramsHash = generateParamsHash(country, category, query);
    const task = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.task.findUnique({
        where: { userId_paramsHash: { userId, paramsHash } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException({
          message: "Task with same parameters already exists",
          statusCode: 409,
          data: { taskId: existing.id },
        } satisfies ApiErrorResponse<{ taskId: string }>);
      }
      const task = await tx.task.create({
        data: {
          userId,
          parameters,
          paramsHash: generateParamsHash(country, category, query),
        },
      });
      await this.scheduleTask(task.id);

      return task;
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
            createdAt: true,
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
            createdAt: lastExecution.createdAt.toISOString(),
            startedAt: lastExecution.startedAt?.toISOString(),
            completedAt: lastExecution.completedAt?.toISOString(),
          }
        : undefined,
    };
  }

  async cancelTask(
    taskId: string,
    userId: string,
  ): Promise<{ message: string }> {
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

  async listTasks(
    query: {
      limit?: number;
      offset?: number;
    },
    userId: string,
  ): Promise<ListTasksResponseDto> {
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
            startedAt: true,
            completedAt: true,
            createdAt: true,
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
          country: params.country ?? undefined,
          category: params.category ?? undefined,
          query: params.query ?? undefined,
          createdAt: createdAt.toISOString(),
          lastExecution: executions[0] && {
            status: executions[0].status,
            createdAt: executions[0].createdAt.toISOString(),
            startedAt: executions[0].startedAt?.toISOString(),
            completedAt: executions[0].completedAt?.toISOString(),
          },
        };
      }),
      limit,
      offset,
    };
  }

  async refreshTask(
    taskId: string,
    userId: string,
  ): Promise<RefreshTaskResponseDto> {
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

  async getLatestResult(
    taskId: string,
    userId: string,
  ): Promise<GetLatestResultResponseDto> {
    // First verify the task belongs to the user
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    // Find the latest completed execution with result
    const latestExecution = await this.prisma.taskExecution.findFirst({
      where: {
        taskId,
        status: "COMPLETED",
        result: {
          not: Prisma.JsonNull,
        },
      },
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        result: true,
      },
    });

    return {
      taskId,
      execution: latestExecution
        ? {
            id: latestExecution.id,
            status: latestExecution.status,
            startedAt: latestExecution.startedAt?.toISOString() || "",
            completedAt: latestExecution.completedAt?.toISOString(),
            result: latestExecution.result,
          }
        : undefined,
      hasResult: !!latestExecution,
    };
  }

  async getExecution(
    executionId: string,
    userId: string,
  ): Promise<TaskExecution> {
    const execution = await this.prisma.taskExecution.findFirst({
      where: {
        id: executionId,
        task: { userId },
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        result: true,
        errorMessage: true,
      },
    });

    if (!execution) {
      throw new NotFoundException("Execution not found");
    }

    return {
      id: execution.id,
      status: execution.status,
      startedAt: execution.startedAt?.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      result: execution.result,
      errorMessage: execution.errorMessage ?? undefined,
    };
  }

  async updateTask(
    taskId: string,
    {
      country,
      category,
      query,
    }: Pick<TaskParametersV1, "country" | "category" | "query">,
    userId: string,
  ): Promise<UpdateTaskResponseDto> {
    // First verify the task belongs to the user
    const existingTask = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existingTask) {
      throw new NotFoundException("Task not found");
    }

    const parameters = v.parse(TaskParametersV1Schema, {
      country,
      category,
      query,
      version: "news-fetch:v1",
    });

    const newParamsHash = generateParamsHash(country, category, query);

    if (newParamsHash === existingTask.paramsHash) {
      return {
        taskId,
        message: "Task not changed",
      };
    }

    // Update the task
    const updatedTask = await this.prisma.$transaction(async (tx) => {
      // Check if the new parameters would conflict with another task
      const conflictingTask = await this.prisma.task.findUnique({
        where: { userId_paramsHash: { userId, paramsHash: newParamsHash } },
        select: { id: true },
      });

      if (conflictingTask) {
        throw new ConflictException({
          message: "Task with same parameters already exists",
          statusCode: 409,
          data: { taskId: conflictingTask.id },
        } satisfies ApiErrorResponse<{ taskId: string }>);
      }

      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          parameters,
          paramsHash: newParamsHash,
          updatedAt: new Date(),
          executions: {
            // clear all previous execution results
            deleteMany: {},
          },
        },
      });

      return task;
    });
    await this.scheduleTask(taskId);

    return {
      taskId: updatedTask.id,
      message: "Task updated successfully",
    };
  }
}
