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
  const response = await listTasks(limit, offset);
  const tasks = response.tasks;

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
