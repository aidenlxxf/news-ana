import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "@/auth/auth.module";
import { PrismaService } from "@/prisma.service";
import { WebPushController } from "./webpush.controller";
import { WebPushService } from "./webpush.service";

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [WebPushController],
  providers: [WebPushService, PrismaService],
  exports: [WebPushService],
})
export class WebPushModule {}
