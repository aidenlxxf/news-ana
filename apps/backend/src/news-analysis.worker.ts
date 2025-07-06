import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "./prisma.service";
import { ExecutionStatus } from "@prisma/client";

interface NewsAnalysisJobData {
  taskId: string;
}

@Processor("news-analysis")
export class NewsAnalysisWorker extends WorkerHost {
  private readonly logger = new Logger(NewsAnalysisWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<NewsAnalysisJobData>): Promise<void> {
    const { taskId } = job.data;

    this.logger.log(`Processing news analysis job for task: ${taskId}`);

    // 获取任务详情
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      this.logger.error(`Task not found: ${taskId}`);
      throw new Error(`Task not found: ${taskId}`);
    }

    // 记录输入参数
    this.logger.log("Task parameters:", {
      taskId: task.id,
      country: task.country,
      category: task.category,
      query: task.query,
    });

    // 创建执行记录
    const execution = await this.prisma.taskExecution.create({
      data: {
        taskId: task.id,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      // 这里是占位符逻辑 - 仅记录参数
      this.logger.log("Analyzing news for:", {
        country: task.country,
        category: task.category,
        query: task.query,
      });

      // 模拟处理时间
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 更新执行状态为完成
      await this.prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.COMPLETED,
          completedAt: new Date(),
          result: {
            message: "Analysis completed (placeholder)",
            parameters: {
              country: task.country,
              category: task.category,
              query: task.query,
            },
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`News analysis completed for task: ${taskId}`);
    } catch (error) {
      this.logger.error(`News analysis failed for task: ${taskId}`, error);

      // 更新执行状态为失败
      await this.prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.FAILED,
          completedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }
}
