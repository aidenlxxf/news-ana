import * as v from "valibot";

const HourlyScheduleSchema = v.object({
  type: v.literal("hourly"),
  timezone: v.pipe(v.string(), v.nonEmpty()),
});

const DailyScheduleSchema = v.object({
  type: v.literal("daily"),
  // hh:mm
  runAt: v.pipe(v.string(), v.isoTime()),
  timezone: v.pipe(v.string(), v.nonEmpty()),
});

export const ScheduleSchema = v.union([
  HourlyScheduleSchema,
  DailyScheduleSchema,
]);

export function parseScheduleCron(schedule: ScheduleDto): string {
  if (schedule.type === "hourly") {
    return "0 * * * *";
  }
  const [hours, minutes] = schedule.runAt.split(":");
  return `${minutes} ${hours} * * *`;
}

export type DailyScheduleDto = v.InferInput<typeof DailyScheduleSchema>;
export type HourlyScheduleDto = v.InferInput<typeof HourlyScheduleSchema>;
export type ScheduleDto = v.InferInput<typeof ScheduleSchema>;
