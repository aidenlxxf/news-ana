import { forwardRef, Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { WebPushModule } from "@/webpush/webpush.module";
import { TaskExecutionService } from "./task-execution.service";

@Module({
  imports: [forwardRef(() => WebPushModule)],
  providers: [TaskExecutionService, PrismaService],
  exports: [TaskExecutionService],
})
export class TaskExecutionModule {}
