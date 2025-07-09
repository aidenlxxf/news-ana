import type {
  ExecutionStatus as ExecutionStatusType,
  GetLatestResultResponseDto,
  GetTaskResponseDto,
} from "@na/schema";
import { assertNever } from "@std/assert/unstable-never";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusColor, getStatusText } from "@/lib/task-utils";

interface ExecutionStatusProps {
  lastExecution?: GetTaskResponseDto["lastExecution"];
  latestResult: GetLatestResultResponseDto;
}

function getStatusIcon(status: ExecutionStatusType) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "FAILED":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "PENDING":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "FETCHING":
    case "ANALYZING":
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    default:
      assertNever(status);
  }
}

export default function ExecutionStatus({
  lastExecution,
  latestResult,
}: ExecutionStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Execution Status</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {lastExecution ? (
          <>
            {/* Current status */}
            <div className="flex items-center gap-3">
              {getStatusIcon(lastExecution.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    Current Status
                  </span>
                  <Badge className={getStatusColor(lastExecution.status)}>
                    {getStatusText(lastExecution.status)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Start time */}
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Start Time</p>
                <p className="text-sm text-gray-600">
                  {new Date(
                    lastExecution.startedAt ?? lastExecution.createdAt,
                  ).toLocaleString("en-US", {
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

            {/* Completion time */}
            {lastExecution.completedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Completion Time
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(lastExecution.completedAt).toLocaleString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      },
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Execution duration */}
            {lastExecution.completedAt && (
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Execution Duration
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.round(
                      (new Date(lastExecution.completedAt).getTime() -
                        new Date(lastExecution.createdAt).getTime()) /
                        1000,
                    )}{" "}
                    seconds
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No execution records</p>
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-gray-200" />

        {/* Result status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
            {latestResult.hasResult ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Analysis Result</p>
            <p className="text-sm text-gray-600">
              {latestResult.hasResult ? "Available" : "Not Available"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
