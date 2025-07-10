"use client";

import { use } from "react";
import { Globe, Tag, Calendar } from "lucide-react";
import type { TaskSummary, ListTasksResponseDto } from "@na/schema";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatScheduleDisplay } from "@/lib/task-utils";

interface TaskSelectorProps {
  onTaskSelect: (task: TaskSummary) => void;
  selectedTask?: TaskSummary | null;
  tasksPromise: Promise<ListTasksResponseDto>;
}

export default function TaskSelector({
  onTaskSelect,
  selectedTask,
  tasksPromise,
}: TaskSelectorProps) {
  const response = use(tasksPromise);
  const tasks = response.tasks;

  const handleValueChange = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      onTaskSelect(task);
    }
  };

  const formatTaskLabel = (task: TaskSummary) => {
    const parts = [];

    if (task.query) {
      parts.push(`"${task.query}"`);
    }

    if (task.country) {
      parts.push(task.country.toUpperCase());
    }

    if (task.category) {
      parts.push(task.category);
    }

    return parts.join(" • ") || "General News";
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="task-select" className="text-sm font-medium">
          Select Task to Modify
        </Label>
        <p className="text-xs text-gray-600">
          Choose from your existing tasks to modify their configuration
        </p>
      </div>

      <Select value={selectedTask?.id || ""} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a task to modify...">
            {selectedTask && (
              <div className="flex items-center gap-2 text-sm">
                {selectedTask.query && (
                  <span className="font-medium">"{selectedTask.query}"</span>
                )}
                {selectedTask.country && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span>{selectedTask.country.toUpperCase()}</span>
                  </div>
                )}
                {selectedTask.category && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span className="capitalize">{selectedTask.category}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatScheduleDisplay(selectedTask.schedule)}</span>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tasks.length === 0 ? (
            <SelectItem value="" disabled>
              No tasks available
            </SelectItem>
          ) : (
            tasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                <div className="w-full">
                  <div className="font-medium text-sm truncate">
                    {formatTaskLabel(task)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    {task.country && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>{task.country.toUpperCase()}</span>
                      </div>
                    )}
                    {task.category && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span className="capitalize">{task.category}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatScheduleDisplay(task.schedule)}</span>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
