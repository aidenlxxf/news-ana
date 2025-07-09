import type { ExecutionStatus, ScheduleDto } from "@na/schema";
import { assertNever } from "@std/assert/unstable-never";
import { formatDistanceToNow } from "date-fns";

/**
 * Formats a schedule object into a human-readable string
 */
export function formatScheduleDisplay(schedule: ScheduleDto): string {
  if (schedule.type === "hourly") {
    return "Every hour";
  }
  return `Daily at ${schedule.runAt || "00:00"}`;
}

/**
 * Formats the next run time into a human-readable string
 */
export function formatNextRunTime(nextRunAt?: string | null): string {
  if (!nextRunAt) return "Not scheduled";

  const nextRun = new Date(nextRunAt);
  const now = new Date();

  if (nextRun.getTime() < now.getTime()) return "Overdue";

  return `in ${formatDistanceToNow(nextRun)}`;
}

/**
 * Gets the appropriate color class for a task execution status
 */
export function getStatusColor(status?: ExecutionStatus | string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "RUNNING":
    case "FETCHING":
    case "ANALYZING":
      return "bg-blue-100 text-blue-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Gets the human-readable text for a task execution status
 */
export function getStatusText(status?: ExecutionStatus): string {
  if (!status) {
    return "Unknown";
  }

  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "FETCHING":
      return "Fetching News";
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
