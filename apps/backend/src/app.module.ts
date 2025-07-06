import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BullModule } from "@nestjs/bullmq";
import { PrismaService } from "./prisma.service";
import { NewsAnalysisTaskService } from "./news-analysis/news-analysis-task.service";
import { NewsAnalysisWorker } from "./news-analysis/news-analysis.worker";
import { NewsFetchWorker } from "./news-analysis/news-fetch.worker";
import { TaskSchedulerWorker } from "./news-analysis/task-scheduler.worker";
import { AllExceptionsFilter } from "./filters/http-exception.filter";
import { NewsAnalysisController } from "./news-analysis/news-analysis.controller";
import { NewsFetchService } from "./news-analysis/news-fetch.service";
import { NewsAnalysisService } from "./news-analysis/news-analysis.service";
import { AuthModule } from "./auth/auth.module";
import { TaskExecutionModule } from "./task-execution/task-execution.module";
import { WebPushModule } from "./webpush/webpush.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env.local", ".env"],
    }),
    AuthModule,
    TaskExecutionModule,
    WebPushModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get("REDIS_URL"),
        },
      }),
      inject: [ConfigService],
    }),
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
  controllers: [AppController, NewsAnalysisController],
  providers: [
    AppService,
    PrismaService,
    NewsAnalysisTaskService,
    NewsFetchService,
    NewsAnalysisService,
    NewsFetchWorker,
    NewsAnalysisWorker,
    TaskSchedulerWorker,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
