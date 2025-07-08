import { Trash2 } from "lucide-react";
import { deleteTaskAction } from "@/actions/task";
import { Button } from "@/components/ui/button";

interface TaskActionsProps {
  taskId: string;
}

export default function TaskActions({ taskId }: TaskActionsProps) {
  return (
    <div className="flex gap-2">
      <form action={deleteTaskAction.bind(null, taskId)}>
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Task
        </Button>
      </form>
    </div>
  );
}
