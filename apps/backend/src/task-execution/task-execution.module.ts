import { Module, forwardRef } from "@nestjs/common";
import { TaskExecutionService } from "./task-execution.service";
import { PrismaService } from "../prisma.service";
import { WebPushModule } from "../webpush/webpush.module";

@Module({
  imports: [forwardRef(() => WebPushModule)],
  providers: [TaskExecutionService, PrismaService],
  exports: [TaskExecutionService],
})
export class TaskExecutionModule {}
