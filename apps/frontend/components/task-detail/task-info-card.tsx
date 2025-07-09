import type { GetTaskResponseDto } from "@na/schema";
import { Calendar, Clock, Globe, Search, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatScheduleDisplay, formatNextRunTime } from "@/lib/task-utils";

interface TaskInfoCardProps {
  task: GetTaskResponseDto;
}

export default function TaskInfoCard({ task }: TaskInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Task Information</span>
          <Badge variant="outline" className="text-xs">
            #{task.id.slice(-8)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search parameters */}
        <div className="space-y-3">
          {task.country && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Country</p>
                <p className="text-sm text-gray-600">
                  {task.country.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          {task.category && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                <Tag className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Category</p>
                <p className="text-sm text-gray-600 capitalize">
                  {task.category}
                </p>
              </div>
            </div>
          )}

          {task.query && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                <Search className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Query</p>
                <p className="text-sm text-gray-600 break-words">
                  {task.query}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200" />

        {/* Schedule Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Schedule</p>
              <p className="text-sm text-gray-600">
                {formatScheduleDisplay(task.schedule)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Next Run</p>
              <p
                className={`text-sm ${
                  task.nextRunAt && new Date(task.nextRunAt) < new Date()
                    ? "text-red-600 font-medium"
                    : "text-gray-600"
                }`}
              >
                {formatNextRunTime(task.nextRunAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200" />

        {/* Creation time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
            <Calendar className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Created Time</p>
            <p className="text-sm text-gray-600">
              {new Date(task.createdAt).toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Task ID (full) */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700 mb-1">Task ID</p>
          <p className="text-xs text-gray-600 font-mono break-all">{task.id}</p>
        </div>
      </CardContent>
    </Card>
  );
}
