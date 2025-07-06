import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { PrismaService } from "../prisma.service";
import { NewsAnalysisService } from "./news-analysis.service";
import { ExecutionStatus } from "@prisma/client";
import { TaskExecutionService } from "../task-execution/task-execution.service";

import { isFetchedResult } from "../schema/news-analysis.schema";

export interface NewsAnalysisJobData {
  taskId: string;
  executionId: string;
}

export type NewsAnalysisResult = undefined;

export type NewsAnalysisQueue = Queue<NewsAnalysisJobData, NewsAnalysisResult>;

@Processor("news-analysis", {
  concurrency: 5,
})
export class NewsAnalysisWorker extends WorkerHost {
  private readonly logger = new Logger(NewsAnalysisWorker.name);

  @OnWorkerEvent("failed")
  async onFailed(job: Job) {
    if (!job.finishedOn) return;
    this.logger.error(`news-analysis Job ${job.id} failed`, job.failedReason);
    await this.taskExecutionService.updateExecutionStatus(
      job.data.executionId,
      ExecutionStatus.FAILED,
      {
        completedAt: new Date(),
        errorMessage: job.failedReason,
      }
    );
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly newsAnalysisService: NewsAnalysisService,
    private readonly taskExecutionService: TaskExecutionService,
  ) {
    super();
  }

  async process(job: Job<NewsAnalysisJobData>): Promise<NewsAnalysisResult> {
    const { taskId, executionId } = job.data;

    this.logger.log(`Processing news analysis job for task: ${taskId}`);

    try {
      // Get the fetched result from the previous execution
      const fetchExecution = await this.prisma.taskExecution.findUnique({
        where: {
          id: executionId,
          taskId,
          status: { in: [ExecutionStatus.FETCHING, ExecutionStatus.ANALYZING] },
        },
        include: { task: { select: { parameters: true } } },
      });

      if (!fetchExecution) {
        this.logger.warn(`Fetch execution not found: ${executionId}`);
        throw new Error(`Fetch execution not found: ${executionId}`);
      }

      if (!fetchExecution.result) {
        throw new Error(
          `No fetched result found for execution: ${executionId}`,
        );
      }

      if (!isFetchedResult(fetchExecution.result)) {
        throw new Error(
          `Invalid fetched result format for execution: ${executionId}`,
        );
      }

      this.logger.log("Starting News analysis:", {
        articleCount: fetchExecution.result.articles.length,
        sources: fetchExecution.result.sources,
      });

      const analyzedResult = await this.newsAnalysisService.analyzeNews(
        fetchExecution.result,
        fetchExecution.task.parameters,
      );

      // Update the same execution record with analyzed result
      await this.taskExecutionService.updateExecutionStatus(
        executionId,
        ExecutionStatus.COMPLETED,
        {
          completedAt: new Date(),
          result: analyzedResult,
        }
      );

      this.logger.log(`News analysis completed for task: ${taskId}`);
    } catch (error) {
      this.logger.error(`News analysis failed for task: ${taskId}`, error);
      // let the scheduler retry
      throw error;
    }
  }
}
