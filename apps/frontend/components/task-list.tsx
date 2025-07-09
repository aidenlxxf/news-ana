import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 pl-4">
          News Analysis Tasks
        </h2>
        <Card className="w-full">
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              No tasks found. Create your first news analysis task below.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pl-4">
        <h2 className="text-2xl font-bold text-gray-900">
          News Analysis Tasks
        </h2>
        <Badge
          variant="outline"
          className="text-sm bg-blue-50 text-blue-700 border-blue-200"
        >
          {tasks.length}
        </Badge>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
