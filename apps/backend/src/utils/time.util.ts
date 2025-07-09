import { parseScheduleCron, ScheduleDto } from "@na/schema";
import { CronExpressionParser } from "cron-parser";

/**
 * Get the next run time for a cron expression
 * @param cronExpression - The cron expression (e.g., '0 9 * * *' for 9 AM daily)
 * @param currentTime - Optional current time to calculate from (defaults to now)
 * @returns The next run time as a Date object
 * @throws Error if the cron expression is invalid
 */
export function getNextRunTime(
  schedule: ScheduleDto,
  currentTime = new Date(),
): Date {
  const cronExpression = parseScheduleCron(schedule);
  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: currentTime,
      tz: schedule.timezone,
    });

    return interval.next().toDate();
  } catch (error) {
    throw new Error(
      `Invalid cron expression: ${cronExpression}. ${error.message}`,
    );
  }
}
