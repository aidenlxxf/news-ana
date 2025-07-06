import { Processor, WorkerHost, InjectQueue } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { Prisma } from "@prisma/client";
import { generateJobId, generateSchedulerId } from "@/utils/bullmq-id.util";
import { type NewsFetchQueue } from "./news-fetch.worker";
import { TaskExecutionService } from "@/task-execution/task-execution.service";

export interface TaskSchedulerJobData {
  taskId: string;
}

export interface TaskSchedulerResult {
  executionId: string;
}

export type TaskSchedulerQueue = Queue<
  TaskSchedulerJobData,
  TaskSchedulerResult
>;

@Processor("task-scheduler", {
  concurrency: 5,
})
export class TaskSchedulerWorker extends WorkerHost {
  private readonly logger = new Logger(TaskSchedulerWorker.name);

  constructor(
    private readonly taskExecutionService: TaskExecutionService,
    @InjectQueue("task-scheduler")
    private readonly taskSchedulerQueue: TaskSchedulerQueue,
    @InjectQueue("news-fetch")
    private readonly newsFetchQueue: NewsFetchQueue,
  ) {
    super();
  }

  async process(job: Job<TaskSchedulerJobData>): Promise<TaskSchedulerResult> {
    const { taskId } = job.data;

    this.logger.log(`Processing task scheduler job for task: ${taskId}`);

    try {
      const execution = await this.taskExecutionService.createExecution(taskId);

      // Trigger news fetch job
      await this.triggerNewsFetch(taskId, execution.id);
      this.logger.log(`Task scheduler completed for task: ${taskId}`);

      return { executionId: execution.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          this.logger.warn(`Task not found: ${taskId}, cancelling scheduler`);
          await this.cancelOrphanedScheduler(taskId);
          throw new Error(`Task not found: ${taskId}`);
        }
      }
      this.logger.error(
        `Failed to create execution for task: ${taskId}`,
        error,
      );
      throw error;
    }
  }

  private async triggerNewsFetch(
    taskId: string,
    executionId: string,
  ): Promise<void> {
    try {
      await this.newsFetchQueue.add(
        `news-fetch:${taskId}`,
        { taskId, executionId },
        { jobId: generateJobId(executionId, "fetch") },
      );
      this.logger.log(`Triggered news fetch job for task: ${taskId}`);
    } catch (error) {
      this.logger.error(
        `Failed to trigger news fetch job for task: ${taskId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Cancel orphaned scheduler
   * @param taskId Task ID
   */
  private async cancelOrphanedScheduler(taskId: string): Promise<void> {
    try {
      const schedulerId = generateSchedulerId(taskId);
      const result =
        await this.taskSchedulerQueue.removeJobScheduler(schedulerId);
      if (result) {
        this.logger.log(
          `Successfully cancelled orphaned scheduler: ${schedulerId}`,
        );
      } else {
        this.logger.warn(
          `Scheduler not found or already removed: ${schedulerId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to cancel orphaned scheduler for task: ${taskId}`,
        error,
      );
    }
  }
}
