import {
  ApiErrorResponse,
  parseScheduleCron,
  ScheduleDto,
  ScheduleSchema,
  TaskExecution,
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
import { CreateTaskDto, CreateTaskResponseDto } from "./dto/create-task.dto";
import { GetLatestResultResponseDto } from "./dto/get-latest-result.dto";
import { GetTaskResponseDto } from "./dto/get-task.dto";
import { ListTasksResponseDto } from "./dto/list-task.dto";
import { ListTaskExecutionsResponseDto } from "./dto/list-task-executions.dto";
import { RefreshTaskResponseDto } from "./dto/refresh-task.dto";
import { UpdateTaskDto, UpdateTaskResponseDto } from "./dto/update-task.dto";
import { type TaskSchedulerQueue } from "./task-scheduler.worker";
import { getNextRunTime } from "@/utils/time.util";

export type ScheduleParsedType = v.InferOutput<typeof ScheduleSchema>;

@Injectable()
export class NewsAnalysisTaskService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("task-scheduler")
    private readonly taskSchedulerQueue: TaskSchedulerQueue,
  ) {}

  private async scheduleTask(
    taskId: string,
    schedule: ScheduleDto,
    { immediately = true }: { immediately?: boolean } = {},
  ) {
    const cronExpression = parseScheduleCron(schedule);
    const schedulerId = generateSchedulerId(taskId);
    const jobName = `task-scheduler:${taskId}`;

    const job = await this.taskSchedulerQueue.getJobScheduler(schedulerId);
    if (job && immediately) {
      // when inserting the first job, we need to manually trigger it
      // @see https://github.com/taskforcesh/bullmq/issues/3095
      // await this.taskSchedulerQueue.add(jobName, { taskId });
      // PS: it's seem to have issue only with every: ..., not pattern: <CRON>
      // so we need to manually trigger it
    }

    return await this.taskSchedulerQueue.upsertJobScheduler(
      schedulerId,
      { pattern: cronExpression, immediately },
      { name: jobName, data: { taskId } },
    );
  }

  async createTask(
    dto: CreateTaskDto,
    userId: string,
  ): Promise<CreateTaskResponseDto> {
    const parameters = dto.data;

    const paramsHash = generateParamsHash(parameters);

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
          parameters: { ...parameters, version: "news-fetch:v1" },
          paramsHash,
        },
      });
      await this.scheduleTask(task.id, parameters.schedule, {
        immediately: true,
      });

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
      schedule: params.schedule,
      nextRunAt: getNextRunTime(params.schedule).toISOString(),
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
      tasks: tasks.map(({ id, parameters, createdAt, executions }) => {
        const lastExecution = executions.at(0) ?? null;
        return {
          id,
          country: parameters.country,
          category: parameters.category,
          query: parameters.query,
          schedule: parameters.schedule,
          nextRunAt: getNextRunTime(parameters.schedule).toISOString(),
          createdAt: createdAt.toISOString(),
          lastExecution: lastExecution && {
            status: lastExecution.status,
            createdAt: lastExecution.createdAt.toISOString(),
            startedAt: lastExecution.startedAt?.toISOString() ?? null,
            completedAt: lastExecution.completedAt?.toISOString() ?? null,
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

    await this.scheduleTask(taskId, task.parameters.schedule, {
      immediately: true,
    });

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
    dto: UpdateTaskDto,
    userId: string,
  ): Promise<UpdateTaskResponseDto> {
    const parameters = dto.data;
    const { immediately = true } = dto.data;

    const paramsHash = generateParamsHash(parameters);

    // Update the task
    const updatedTask = await this.prisma.$transaction(async (tx) => {
      // First verify the task belongs to the user
      const existingTask = await this.prisma.task.findFirst({
        where: { id: taskId, userId },
      });

      if (!existingTask) {
        throw new NotFoundException("Task not found");
      }

      // Check if the new parameters would conflict with another task
      const conflictingTask = await this.prisma.task.findUnique({
        where: { userId_paramsHash: { userId, paramsHash } },
        select: { id: true },
      });

      if (conflictingTask && conflictingTask.id !== taskId) {
        throw new ConflictException({
          message: "Task with same parameters already exists",
          statusCode: 409,
          data: { taskId: conflictingTask.id },
        } satisfies ApiErrorResponse<{ taskId: string }>);
      }

      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          parameters: {
            ...parameters,
            version: "news-fetch:v1",
          },
          paramsHash,
          updatedAt: new Date(),
          executions:
            paramsHash !== existingTask.paramsHash
              ? { deleteMany: {} } // clear all previous execution results
              : {},
        },
      });

      return task;
    });
    await this.scheduleTask(taskId, parameters.schedule, { immediately });

    return {
      taskId: updatedTask.id,
      message: "Task updated successfully",
    };
  }
}
