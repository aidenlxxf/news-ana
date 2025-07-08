"use server";

import {
  type CreatePushSubscriptionDtoType,
  CreateTaskSchema,
} from "@na/schema";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import {
  createTask,
  deleteTask,
  refreshTask,
  subscribeWebPush,
  unsubscribeWebPush,
} from "@/lib/api";
import type { CreateTaskActionState } from "@/types/frontend";

// Server Action for creating a new task
export async function createTaskAction(
  _prevState: CreateTaskActionState | null,
  formData: FormData,
): Promise<CreateTaskActionState> {
  try {
    const taskData = v.parse(CreateTaskSchema, {
      country: formData.get("country"),
      category: formData.get("category"),
      query: formData.get("query"),
    });

    const response = await createTask(taskData);

    // Revalidate the page to show the new task
    revalidatePath("/");
    revalidatePath(`/tasks/${response.taskId}`);

    return {
      success: true,
      data: {
        taskId: response.taskId,
        message: response.message,
        type: "success",
      },
    };
  } catch (error) {
    console.error("Failed to create task:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create task";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Server Action for deleting a task
export async function deleteTaskAction(taskId: string) {
  try {
    await deleteTask(taskId);

    // Revalidate the page to remove the deleted task
    revalidatePath("/");
    revalidatePath(`/tasks/${taskId}`);
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
}

// Server Action for refreshing a task
export async function refreshTaskAction(taskId: string) {
  try {
    await refreshTask(taskId);

    // Revalidate the page to show updated task status
    revalidatePath("/");
    revalidatePath(`/tasks/${taskId}`);
  } catch (error) {
    console.error("Failed to refresh task:", error);
  }
}

// Server Action for subscribing to web push notifications
export async function subscribeUserAction(
  subscription: CreatePushSubscriptionDtoType,
) {
  try {
    await subscribeWebPush(subscription);
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    throw error;
  }
}

// Server Action for unsubscribing from web push notifications
export async function unsubscribeUserAction({
  endpointHash,
}: {
  endpointHash: string;
}) {
  try {
    await unsubscribeWebPush({ endpointHash });
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    throw error;
  }
}
