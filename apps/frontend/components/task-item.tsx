import type { TaskSummary } from "@na/schema";
import { Clock, Eye, Globe, Search, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteTaskAction } from "@/actions/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatScheduleDisplay,
  formatNextRunTime,
  getStatusColor,
  getStatusText,
} from "@/lib/task-utils";
import TaskResultSummary from "./task-result-summary";
import Form from "next/form";

interface TaskItemProps {
  task: TaskSummary;
}

export default function TaskItem({ task }: TaskItemProps) {
  return (
    <Card className="w-full gap-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Task #{task.id.slice(-8)}
          </CardTitle>
          {task.lastExecution?.status && (
            <Badge
              variant="secondary"
              className={getStatusColor(task.lastExecution.status)}
            >
              {getStatusText(task.lastExecution.status)}
            </Badge>
          )}
        </div>
        <CardDescription>
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

            {/* Schedule Information */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Schedule:</span>
              <span>{formatScheduleDisplay(task.schedule)}</span>
            </div>

            {/* Next Run Time */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Next run:</span>
              <span
                className={
                  task.nextRunAt && new Date(task.nextRunAt) < new Date()
                    ? "text-red-600 font-medium"
                    : ""
                }
              >
                {formatNextRunTime(task.nextRunAt)}
              </span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Last Execution Result */}
        <div className="border-t pt-3">
          <TaskResultSummary taskId={task.id} />
        </div>

        {/* Created Date */}
        {task.lastExecution && (
          <div className="text-xs text-gray-500">
            Last updated:{" "}
            {new Date(
              task.lastExecution.completedAt ??
                task.lastExecution.startedAt ??
                task.lastExecution.createdAt,
            ).toLocaleString()}
          </div>
        )}

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

          <Form action={deleteTaskAction}>
            <input type="hidden" name="task-id" value={task.id} />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
