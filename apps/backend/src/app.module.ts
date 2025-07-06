import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BullModule } from "@nestjs/bullmq";
import { PrismaService } from "./prisma.service";
import { AllExceptionsFilter } from "./filters/http-exception.filter";
import { AuthModule } from "./auth/auth.module";
import { TaskExecutionModule } from "./task-execution/task-execution.module";
import { WebPushModule } from "./webpush/webpush.module";
import { NewsAnalysisModule } from "./news-analysis/news-analysis.module";

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
    AuthModule,
    TaskExecutionModule,
    WebPushModule,
    NewsAnalysisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
