import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ExecutionStatus } from "@prisma/client";
import { Job, Queue, UnrecoverableError } from "bullmq";
import * as v from "valibot";
import { PrismaService } from "@/prisma.service";
import { TaskExecutionService } from "@/task-execution/task-execution.service";
import { generateJobId } from "@/utils/bullmq-id.util";
import { type NewsAnalysisQueue } from "./news-analysis.worker";
import { NewsFetchService } from "./news-fetch.service";

const NewsFetchJobDataSchema = v.strictObject({
  taskId: v.string(),
  executionId: v.string(),
});

export type NewsFetchJobData = v.InferOutput<typeof NewsFetchJobDataSchema>;

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
    await this.taskExecutionService.updateExecutionStatus(
      job.data.executionId,
      ExecutionStatus.FAILED,
      {
        completedAt: new Date(),
        errorMessage: job.failedReason,
      },
    );
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly newsFetchService: NewsFetchService,
    private readonly taskExecutionService: TaskExecutionService,
    @InjectQueue("news-analysis")
    private readonly newsAnalysisQueue: NewsAnalysisQueue,
  ) {
    super();
  }

  async process(job: Job<NewsFetchJobData>): Promise<NewsFetchResult> {
    try {
      const { taskId, executionId } = v.parse(NewsFetchJobDataSchema, job.data);

      this.logger.log(
        `Processing news fetch job for task: ${taskId}, execution: ${executionId}`,
      );

      // Get execution and task parameters
      const execution = await this.prisma.taskExecution.findUnique({
        where: { id: executionId, taskId },
        include: { task: { select: { parameters: true } } },
      });

      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      const parameters = execution.task.parameters;

      // Update status to FETCHING
      await this.taskExecutionService.updateExecutionStatus(
        executionId,
        ExecutionStatus.FETCHING,
      );

      this.logger.log("Starting news fetch:", {
        country: parameters.country,
        category: parameters.category,
        query: parameters.query,
      });

      const fetchedResult = await this.newsFetchService.fetchNews(parameters);

      if (fetchedResult.articles.length > 0) {
        await this.taskExecutionService.updateExecutionStatus(
          executionId,
          ExecutionStatus.ANALYZING,
          {
            completedAt: new Date(),
            result: fetchedResult,
          },
        );

        this.logger.log(`News fetch completed for task: ${taskId}`);

        // Trigger news analysis job
        await this.triggerAnalysisJob(taskId, executionId);
      } else {
        this.logger.log(`No articles found for task: ${taskId}`);
        await this.taskExecutionService.updateExecutionStatus(
          executionId,
          ExecutionStatus.COMPLETED,
          {
            completedAt: new Date(),
            result: fetchedResult,
          },
        );
      }
    } catch (error) {
      if (error instanceof v.ValiError) {
        this.logger.error(
          "News fetch failed for task: ",
          error.message,
          job.data,
        );
        throw new UnrecoverableError(error.message);
      }
      this.logger.error("News fetch failed for task: ", error, job.data);
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
