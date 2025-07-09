import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditTaskForm from "@/components/edit-task-form";
import { getTask } from "@/lib/api";

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

async function getTaskData(taskId: string) {
  try {
    const task = await getTask(taskId);
    return task;
  } catch (error) {
    console.error("Failed to fetch task data:", error);
    // If it's a 404 error, trigger not-found page
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
  }
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id: taskId } = await params;
  const task = await getTaskData(taskId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation bar */}
        <div className="mb-6">
          <Link
            href={`/tasks/${taskId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Task Details
          </Link>
        </div>

        {/* Edit Task Form */}
        <div className="max-w-2xl mx-auto">
          <EditTaskForm
            taskId={taskId}
            defaultValues={{
              country: task.country,
              category: task.category,
              query: task.query,
              schedule: task.schedule,
            }}
          />
        </div>
      </div>
    </div>
  );
}
