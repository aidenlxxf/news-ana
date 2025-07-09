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
export interface TaskWebPushMessage {
  type: typeof TASK_WEB_PUSH_MESSAGE_TYPE;
  payload: TaskNotificationDto;
}

const TASK_WEB_PUSH_MESSAGE_TYPE = "task-web-push";

export function isTaskWebPushMessage(
  message: unknown,
): message is TaskWebPushMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === TASK_WEB_PUSH_MESSAGE_TYPE
  );
}

export class TaskNotificationEvent extends CustomEvent<TaskNotificationDto> {
  constructor(data: TaskNotificationDto) {
    super("task-notification", { detail: data });
  }
}

declare global {
  interface WindowEventMap {
    "task-notification": TaskNotificationEvent;
  }
}
