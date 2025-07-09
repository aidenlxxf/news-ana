import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteTaskAction } from "@/actions/task";
import { Button } from "@/components/ui/button";
import Form from "next/form";

interface TaskActionsProps {
  taskId: string;
}

export default function TaskActions({ taskId }: TaskActionsProps) {
  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm">
        <Link
          href={`/tasks/${taskId}/edit`}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Task
        </Link>
      </Button>

      <Form action={deleteTaskAction}>
        <input type="hidden" name="task-id" value={taskId} />
        <input type="hidden" name="next" value="/" />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Task
        </Button>
      </Form>
    </div>
  );
}
