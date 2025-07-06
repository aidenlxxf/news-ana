import { ExecutionStatus } from "@prisma/client";

export interface GetTaskResponseDto {
  id: string;
  country?: string | null;
  category?: string | null;
  query?: string | null;
  createdAt: string;
  lastExecution?: {
    status: ExecutionStatus;
    startedAt: string;
    completedAt?: string;
  };
}
