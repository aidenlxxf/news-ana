import type { TaskSummary } from "@na/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listTasks } from "@/lib/api";
import TaskItem from "./task-item";

interface TaskListProps {
  limit?: number;
  offset?: number;
}

export default async function TaskList({
  limit = 20,
  offset = 0,
}: TaskListProps) {
  let tasks: TaskSummary[] = [];
  let error: string | null = null;

  try {
    const response = await listTasks(limit, offset);
    tasks = response.tasks;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load tasks";
    console.error("Failed to fetch tasks:", err);
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>News Analysis Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No tasks found. Create your first news analysis task below.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>News Analysis Tasks ({tasks.length})</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
