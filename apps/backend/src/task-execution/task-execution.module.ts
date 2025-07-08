import { forwardRef, Module } from "@nestjs/common";
import { NotificationModule } from "@/notification/notification.module";
import { PrismaService } from "@/prisma.service";
import { TaskExecutionService } from "./task-execution.service";

@Module({
  imports: [forwardRef(() => NotificationModule)],
  providers: [TaskExecutionService, PrismaService],
  exports: [TaskExecutionService],
})
export class TaskExecutionModule {}
