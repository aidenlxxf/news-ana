import {
  Processor,
  WorkerHost,
  InjectQueue,
  OnWorkerEvent,
} from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { PrismaService } from "../prisma.service";
import { NewsFetchService } from "./news-fetch.service";
import { ExecutionStatus } from "@prisma/client";
import { generateJobId } from "../utils/bullmq-id.util";
import { type NewsAnalysisQueue } from "./news-analysis.worker";

export interface NewsFetchJobData {
  taskId: string;
  executionId: string;
}

export type NewsFetchResult = undefined;

export type NewsFetchQueue = Queue<NewsFetchJobData, NewsFetchResult>;

@Processor("news-fetch", {
  concurrency: 5,
})
export class NewsFetchWorker extends WorkerHost {
  private readonly logger = new Logger(NewsFetchWorker.name);

  @OnWorkerEvent("failed")
  async onFailed(job: Job) {
    if (!job.finishedOn) return;
    this.logger.error(`news-fetch Job ${job.id} failed`, job.failedReason);
    await this.prisma.taskExecution.update({
      where: { id: job.data.executionId },
      data: {
        status: ExecutionStatus.FAILED,
        completedAt: new Date(),
        errorMessage: job.failedReason,
      },
    });
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly newsFetchService: NewsFetchService,
    @InjectQueue("news-analysis") private readonly newsAnalysisQueue: NewsAnalysisQueue,
  ) {
    super();
  }

  async process(job: Job<NewsFetchJobData>): Promise<NewsFetchResult> {
    const { taskId, executionId } = job.data;

    this.logger.log(
      `Processing news fetch job for task: ${taskId}, execution: ${executionId}`,
    );

    try {
      // Get execution and task parameters
      const execution = await this.prisma.taskExecution.findUnique({
        where: { id: executionId },
        include: { task: { select: { parameters: true } } },
      });

      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      const parameters = execution.task.parameters;

      // Update status to FETCHING
      await this.prisma.taskExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.FETCHING,
        },
      });

      this.logger.log("Starting news fetch:", {
        country: parameters.country,
        category: parameters.category,
        query: parameters.query,
      });

      const fetchedResult = await this.newsFetchService.fetchNews(parameters);

      if (fetchedResult.articles.length > 0) {
        await this.prisma.taskExecution.update({
          where: { id: executionId },
          data: {
            status: ExecutionStatus.ANALYZING,
            completedAt: new Date(),
            result: fetchedResult,
          },
        });

        this.logger.log(`News fetch completed for task: ${taskId}`);

        // Trigger news analysis job
        await this.triggerAnalysisJob(taskId, executionId);
      } else {
        this.logger.log(`No articles found for task: ${taskId}`);
        await this.prisma.taskExecution.update({
          where: { id: executionId },
          data: {
            status: ExecutionStatus.COMPLETED,
            completedAt: new Date(),
            result: fetchedResult,
          },
        });
      }
    } catch (error) {
      this.logger.error(`News fetch failed for task: ${taskId}`, error);

      throw error;
    }
  }

  private async triggerAnalysisJob(
    taskId: string,
    executionId: string,
  ): Promise<void> {
    try {
      await this.newsAnalysisQueue.add(
        `news-analysis:${taskId}`,
        { taskId, executionId },
        { jobId: generateJobId(executionId, "analysis") },
      );
      this.logger.log(`Triggered analysis job for task: ${taskId}`);
    } catch (error) {
      this.logger.error(
        `Failed to trigger analysis job for task: ${taskId}`,
        error,
      );
      throw error;
    }
  }
}
