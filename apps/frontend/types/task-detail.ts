import type {
  GetLatestResultResponseDto,
  GetTaskResponseDto,
  ListTaskExecutionsResponseDto,
  NewsAnalysisResult,
  TaskExecution,
} from "@na/schema";

// Re-export types for task detail page
export type {
  GetTaskResponseDto,
  GetLatestResultResponseDto,
  ListTaskExecutionsResponseDto,
  TaskExecution,
  NewsAnalysisResult,
};

// Additional frontend-specific types can be added here
export interface TaskDetailPageProps {
  taskId: string;
}
