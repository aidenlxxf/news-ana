"use server";

import { CreateTaskSchema } from "@na/schema";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { createTask, deleteTask, refreshTask } from "@/lib/api";

// Server Action for creating a new task
export async function createTaskAction(formData: FormData) {
  try {
    const taskData = v.parse(CreateTaskSchema, {
      country: formData.get("country"),
      category: formData.get("category"),
      query: formData.get("query"),
    });

    await createTask(taskData);

    // Revalidate the page to show the new task
    revalidatePath("/");
  } catch (error) {
    console.error("Failed to create task:", error);
  }
}

// Server Action for deleting a task
export async function deleteTaskAction(taskId: string) {
  try {
    await deleteTask(taskId);

    // Revalidate the page to remove the deleted task
    revalidatePath("/");
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
  } catch (error) {
    console.error("Failed to refresh task:", error);
  }
}
