import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "./prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import {
  CreateTaskResponseDto,
  TaskDetailResponseDto,
  TaskExecutionResponseDto,
  ListTasksQueryDto,
  ListTasksResponseDto,
  TaskSummaryDto,
} from "./dto/task-response.dto";
import { generateParamsHash } from "./utils/hash.util";
import { TaskStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Injectable()
export class NewsAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("news-analysis") private readonly newsAnalysisQueue: Queue,
  ) {}

  async createTask(
    createTaskDto: CreateTaskDto,
  ): Promise<CreateTaskResponseDto> {
    const { country, category, query } = createTaskDto;

    // 生成参数哈希用于去重
    const paramsHash = generateParamsHash(country, category, query);

    const task = await this.prisma.$transaction(async (tx) => {
      try {
        // 创建新任务
        const task = await tx.task.create({
          data: {
            country,
            category,
            query,
            paramsHash,
            status: TaskStatus.ACTIVE,
          },
        });
        // 创建重复任务调度（每小时执行）
        await this.newsAnalysisQueue.upsertJobScheduler(
          `news-analysis.scheduler:${task.id}`, // 使用任务ID作为调度器ID
          {
            every: 1000 * 60 * 60, // 每小时执行
            immediately: true,
          },
          {
            name: `news-analysis:${task.id}`,
            data: { taskId: task.id },
            opts: {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 2000,
              },
            },
          },
        );
        return task;
      } catch (err) {
        if (err instanceof PrismaClientKnownRequestError) {
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

  async getTask(taskId: string): Promise<TaskDetailResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        executions: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const lastExecution = task.executions[0];

    return {
      id: task.id,
      country: task.country,
      category: task.category,
      query: task.query,
      status: task.status,
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

  async cancelTask(taskId: string): Promise<{ message: string }> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    // 更新任务状态为已取消
    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.CANCELLED },
    });

    // 移除重复任务调度
    await this.newsAnalysisQueue.removeJobScheduler(taskId);

    return {
      message: "Task cancelled successfully",
    };
  }

  async getTaskExecutions(taskId: string): Promise<TaskExecutionResponseDto[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const executions = await this.prisma.taskExecution.findMany({
      where: { taskId },
      orderBy: { startedAt: "desc" },
    });

    return executions.map((execution) => ({
      id: execution.id,
      status: execution.status,
      startedAt: execution.startedAt?.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      result: execution.result,
      errorMessage: execution.errorMessage || undefined,
    }));
  }

  async listTasks(query: ListTasksQueryDto): Promise<ListTasksResponseDto> {
    const { limit = 10, offset = 0, status, country, category } = query;

    // 构建查询条件
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (country) {
      where.country = { contains: country, mode: "insensitive" };
    }
    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    // 获取总数
    const total = await this.prisma.task.count({ where });

    // 获取任务列表
    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        executions: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const taskSummaries: TaskSummaryDto[] = tasks.map((task) => ({
      id: task.id,
      country: task.country,
      category: task.category,
      query: task.query,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
      lastExecutionStatus: task.executions[0]?.status,
    }));

    return {
      tasks: taskSummaries,
      total,
      limit,
      offset,
    };
  }
}
