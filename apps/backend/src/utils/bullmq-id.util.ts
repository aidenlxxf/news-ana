/**
 * Scheduler ID utility functions
 * Used to uniformly manage BullMQ job scheduler ID formats
 */

export const SCHEDULER_ID_PREFIX = "news-analysis.scheduler";

/**
 * Generate scheduler ID
 * @param taskId Task ID
 * @returns Formatted scheduler ID
 */
export function generateSchedulerId(taskId: string): string {
  return `${SCHEDULER_ID_PREFIX}:${taskId}`;
}

export function generateJobId(
  executionId: string,
  prefix: "fetch" | "analysis",
): string {
  return `${prefix}:${executionId}`;
}

export function parseExecutionIdFromJobId(
  jobId: string,
  prefix: "fetch" | "analysis",
): string | null {
  const prefixFull = `${prefix}:`;
  if (!jobId.startsWith(prefixFull)) {
    return null;
  }
  return jobId.substring(prefixFull.length);
}
