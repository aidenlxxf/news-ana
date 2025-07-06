import { TaskStatus, ExecutionStatus } from "@prisma/client";
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

export class CreateTaskResponseDto {
  taskId: string;
  message: string;
}

export class ListTasksQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number.parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number.parseInt(value))
  offset?: number = 0;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class TaskDetailResponseDto {
  id: string;
  country: string;
  category: string;
  query: string;
  status: TaskStatus;
  createdAt: string;
  lastExecution?: {
    status: ExecutionStatus;
    startedAt: string;
    completedAt?: string;
  };
}

export class TaskExecutionResponseDto {
  id: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  errorMessage?: string;
}

export class TaskSummaryDto {
  id: string;
  country: string;
  category: string;
  query: string;
  status: TaskStatus;
  createdAt: string;
  lastExecutionStatus?: ExecutionStatus;
}

export class ListTasksResponseDto {
  tasks: TaskSummaryDto[];
  total: number;
  limit: number;
  offset: number;
}
