import type { TaskNotificationDto } from "@na/schema";

// Server Action State Types
export interface CreateTaskActionState {
  success: boolean;
  data?: TaskNotificationDto;
  error?: string;
}

// Service Worker Message Types
export interface NewsUpdateMessage {
  type: "news-update";
  taskId?: string;
}
