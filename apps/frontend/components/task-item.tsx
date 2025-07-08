import type { ExecutionStatus, TaskSummary } from "@na/schema";
import { assertNever } from "@std/assert/unstable-never";
import { Eye, Globe, Search, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteTaskAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskItemProps {
  task: TaskSummary;
}

function getStatusColor(status?: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500";
    case "RUNNING":
      return "bg-blue-500";
    case "FAILED":
      return "bg-red-500";
    case "PENDING":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

function getStatusText(status?: ExecutionStatus): string {
  if (!status) {
    return "Unknown";
  }

  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "FETCHING":
      return "Fetching";
    case "FAILED":
      return "Failed";
    case "PENDING":
      return "Pending";
    case "ANALYZING":
      return "Analyzing";
    default:
      assertNever(status);
  }
}

export default function TaskItem({ task }: TaskItemProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Task #{task.id.slice(-8)}
          </CardTitle>
          {task.lastExecutionStatus && (
            <Badge
              variant="secondary"
              className={`${getStatusColor(task.lastExecutionStatus)} text-white`}
            >
              {getStatusText(task.lastExecutionStatus)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Task Parameters */}
        <div className="space-y-2">
          {task.country && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Country:</span>
              <span>{task.country.toUpperCase()}</span>
            </div>
          )}

          {task.category && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Tag className="h-4 w-4" />
              <span className="font-medium">Category:</span>
              <span className="capitalize">{task.category}</span>
            </div>
          )}

          {task.query && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Search className="h-4 w-4" />
              <span className="font-medium">Query:</span>
              <span className="truncate">{task.query}</span>
            </div>
          )}
        </div>

        {/* Created Date */}
        <div className="text-xs text-gray-500">
          Created: {new Date(task.createdAt).toLocaleString()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* View Details Button */}
          <Button asChild variant="default" size="sm">
            <Link
              href={`/tasks/${task.id}`}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View Details
            </Link>
          </Button>

          <form action={deleteTaskAction.bind(null, task.id)}>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
