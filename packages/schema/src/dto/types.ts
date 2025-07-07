// Common execution status type (matches Prisma enum)
export type ExecutionStatus = "PENDING" | "FETCHING" | "ANALYZING" | "COMPLETED" | "FAILED";

// Task-related DTO interfaces
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

export interface RefreshTaskResponseDto {
  taskId: string;
  message: string;
}

export interface CreateTaskResponseDto {
  taskId: string;
  message: string;
}

export interface ListTasksResponseDto {
  tasks: TaskSummary[];
  limit: number;
  offset: number;
}

export interface TaskSummary {
  id: string;
  country?: string;
  category?: string;
  query?: string;
  /** ISO 8601 */
  createdAt: string;
  lastExecutionStatus?: ExecutionStatus;
}

export interface ListTaskExecutionsResponseDto {
  executions: TaskExecution[];
  limit: number;
  offset: number;
}

export interface TaskExecution {
  id: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  errorMessage?: string;
}

// WebPush related types
export interface PushNotificationDto {
  taskId: string;
  message: string;
  type: "success" | "error";
}

// API Error Response
export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
}
