"use server";

import { CreateTaskSchema, UpdateTaskSchema } from "@na/schema";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { createTask, deleteTask, refreshTask, updateTask } from "@/lib/api";
import type {
  CreateTaskActionState,
  UpdateTaskActionState,
} from "@/types/frontend";
import { handleNextRedirect } from "@/lib/next";
import { SCHEDULE_FIELDS } from "@/lib/schedule";

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
      schedule: {
        type: formData.get(SCHEDULE_FIELDS.type),
        runAt: formData.get(SCHEDULE_FIELDS.runAt),
        timezone: formData.get(SCHEDULE_FIELDS.timezone),
      },
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
        status: "success",
        pushType: "notification",
        type: "task",
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
export async function deleteTaskAction(formData: FormData): Promise<void> {
  try {
    const taskId = formData.get("task-id");
    if (typeof taskId !== "string") throw new Error("Task ID is required");
    await deleteTask(taskId);

    // Revalidate the page to remove the deleted task
    revalidatePath("/");
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/tasks/${taskId}/edit`);
  } catch (error) {
    console.error("Failed to delete task:", error);
    return;
  }
  handleNextRedirect(formData);
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

// Server Action for updating a task
export async function updateTaskAction(
  _prevState: UpdateTaskActionState | undefined,
  formData: FormData,
): Promise<UpdateTaskActionState | undefined> {
  try {
    const taskData = v.parse(UpdateTaskSchema, {
      country: formData.get("country"),
      category: formData.get("category"),
      query: formData.get("query"),
      schedule: {
        type: formData.get("schedule.type"),
        runAt: formData.get("schedule.run-at"),
        timezone: formData.get("schedule.timezone"),
      },
      immediately: formData.get("immediately") === "on",
    });
    const taskId = formData.get("task-id");
    if (typeof taskId !== "string" || !taskId)
      throw new Error("Task ID is required");

    await updateTask(taskId, taskData);

    // Revalidate the page to show the updated task
    revalidatePath("/");
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/tasks/${taskId}/edit`);
  } catch (error) {
    console.error("Failed to update task:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update task";

    return {
      success: false,
      error: errorMessage,
    };
  }
  handleNextRedirect(formData);
}

// AI-specific Server Actions (without redirect logic)

// AI Server Action for creating a new task
export async function createTaskForAI(
  taskData: v.InferInput<typeof CreateTaskSchema>,
) {
  const validatedData = v.parse(CreateTaskSchema, taskData);
  const result = await createTask(validatedData);

  // Revalidate the page to show the new task
  revalidatePath("/");
  revalidatePath(`/tasks/${result.taskId}`);

  return result;
}

// AI Server Action for updating a task
export async function updateTaskForAI(
  taskId: string,
  taskData: v.InferInput<typeof UpdateTaskSchema>,
) {
  const validatedData = v.parse(UpdateTaskSchema, taskData);
  const result = await updateTask(taskId, validatedData);

  // Revalidate the page to show the updated task
  revalidatePath("/");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/tasks/${taskId}/edit`);

  return result;
}
