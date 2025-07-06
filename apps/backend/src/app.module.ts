import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BullModule } from "@nestjs/bullmq";

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
      name: "news-ana",
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
