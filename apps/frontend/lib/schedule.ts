import type { ScheduleSchema } from "@na/schema";
import type * as v from "valibot";

export const SCHEDULE_FIELDS = {
  type: "schedule.type",
  runAt: "schedule.run-at",
  timezone: "schedule.timezone",
};

export type ScheduleType = v.InferInput<typeof ScheduleSchema>["type"];
export const scheduleTypeLabels: Record<ScheduleType, string> = {
  hourly: "Every Hour",
  daily: "Daily",
};
