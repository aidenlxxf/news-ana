import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "../prisma.service";
import { TaskExecutionModule } from "../task-execution/task-execution.module";
import { NewsAnalysisController } from "./news-analysis.controller";
import { NewsAnalysisService } from "./news-analysis.service";
import { NewsAnalysisWorker } from "./news-analysis.worker";
import { NewsAnalysisTaskService } from "./news-analysis-task.service";
import { NewsFetchService } from "./news-fetch.service";
import { NewsFetchWorker } from "./news-fetch.worker";
import { TaskSchedulerWorker } from "./task-scheduler.worker";

@Module({
  imports: [
    ConfigModule,
    TaskExecutionModule,
    AuthModule,
    BullModule.registerQueue({
      name: "news-fetch",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    }),
    BullModule.registerQueue({
      name: "news-analysis",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    }),
    BullModule.registerQueue({
      name: "task-scheduler",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 500,
        },
      },
    }),
  ],
  controllers: [NewsAnalysisController],
  providers: [
    PrismaService,
    NewsAnalysisTaskService,
    NewsFetchService,
    NewsAnalysisService,
    NewsFetchWorker,
    NewsAnalysisWorker,
    TaskSchedulerWorker,
  ],
  exports: [NewsAnalysisTaskService],
})
export class NewsAnalysisModule {}
