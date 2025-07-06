import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BullModule } from "@nestjs/bullmq";
import { PrismaService } from "./prisma.service";
import { NewsAnalysisService } from "./news-analysis.service";
import { NewsAnalysisController } from "./news-analysis.controller";
import { NewsAnalysisWorker } from "./news-analysis.worker";
import { AllExceptionsFilter } from "./filters/http-exception.filter";

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
    BullModule.registerQueue({
      name: "news-analysis",
    }),
  ],
  controllers: [AppController, NewsAnalysisController],
  providers: [
    AppService,
    PrismaService,
    NewsAnalysisService,
    NewsAnalysisWorker,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
