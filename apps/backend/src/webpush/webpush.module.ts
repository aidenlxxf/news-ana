import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WebPushService } from "./webpush.service";
import { WebPushController } from "./webpush.controller";
import { PrismaService } from "../prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [WebPushController],
  providers: [WebPushService, PrismaService],
  exports: [WebPushService],
})
export class WebPushModule {}
