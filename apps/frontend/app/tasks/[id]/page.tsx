import type {
  GetLatestResultResponseDto,
  GetTaskResponseDto,
} from "@na/schema";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalysisResult from "@/components/task-detail/analysis-result";
import ExecutionStatus from "@/components/task-detail/execution-status";
import TaskActions from "@/components/task-detail/task-actions";
import TaskInfoCard from "@/components/task-detail/task-info-card";
import { getLatestResult, getTask } from "@/lib/api";

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getTaskData(taskId: string): Promise<{
  task: GetTaskResponseDto;
  latestResult: GetLatestResultResponseDto;
}> {
  try {
    // Get task information and latest result in parallel
    const [task, latestResult] = await Promise.all([
      getTask(taskId),
      getLatestResult(taskId),
    ]);

    return { task, latestResult };
  } catch (error) {
    console.error("Failed to fetch task data:", error);
    // If it's a 404 error, trigger not-found page
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
  }
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id: taskId } = await params;
  const { task, latestResult } = await getTaskData(taskId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation bar */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Task List
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Task Details
              </h1>
              <p className="text-gray-600">
                View task configuration and latest analysis results
              </p>
            </div>

            <TaskActions taskId={taskId} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side: Task information */}
          <div className="lg:col-span-1 space-y-6">
            <TaskInfoCard task={task} />
            <ExecutionStatus
              lastExecution={task.lastExecution}
              latestResult={latestResult}
            />
          </div>

          {/* Right side: Analysis results */}
          <div className="lg:col-span-2">
            <AnalysisResult latestResult={latestResult} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate page metadata
export async function generateMetadata({ params }: TaskDetailPageProps) {
  const { id: taskId } = await params;
  try {
    const { task } = await getTaskData(taskId);

    const title = `Task #${task.id.slice(-8)}`;
    const description = [
      task.country && `Country: ${task.country.toUpperCase()}`,
      task.category && `Category: ${task.category}`,
      task.query && `Query: ${task.query}`,
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      title,
      description: description || "News analysis task details",
    };
  } catch {
    return {
      title: "Task Details",
      description: "News analysis task details",
    };
  }
}
