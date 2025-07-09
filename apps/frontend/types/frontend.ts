import type { TaskNotificationDto } from "@na/schema";

// Server Action State Types
export interface CreateTaskActionState {
  success: boolean;
  data?: TaskNotificationDto;
  error?: string;
}

export interface UpdateTaskActionState {
  success: boolean;
  data?: TaskNotificationDto;
  error?: string;
}

// Service Worker Message Types
export interface NewsUpdateMessage {
  type: "news-update";
  payload: TaskNotificationDto;
}

declare global {
  interface WindowEventMap {
    "news-update": NewsUpdateEvent;
  }
}

export function isNewsUpdateMessage(
  message: unknown,
): message is NewsUpdateMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "news-update"
  );
}

export class NewsUpdateEvent extends CustomEvent<TaskNotificationDto> {
  constructor(data: TaskNotificationDto) {
    super("news-update", { detail: data });
  }
}
