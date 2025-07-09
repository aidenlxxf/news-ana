import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { AuthModule } from "./auth/auth.module";
import { AllExceptionsFilter } from "./filters/http-exception.filter";
import { NewsAnalysisModule } from "./news-analysis/news-analysis.module";
import { NotificationModule } from "./notification/notification.module";
import { PrismaService } from "./prisma.service";
import { TaskExecutionModule } from "./task-execution/task-execution.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env.local", ".env"],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get("REDIS_URL"),
        },
      }),
      inject: [ConfigService],
    }),
    BullBoardModule.forRoot({
      route: "/queue/ui",
      adapter: ExpressAdapter,
    }),
    AuthModule,
    TaskExecutionModule,
    NotificationModule,
    NewsAnalysisModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
