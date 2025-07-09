"use client";

import type { ScheduleDto } from "@na/schema";
import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCHEDULE_FIELDS,
  type ScheduleType,
  scheduleTypeLabels,
} from "@/lib/schedule";

interface ScheduleSelectProps {
  defaultSchedule?: ScheduleDto;
}

function useFormatteTime(defaults: ScheduleDto | null | undefined) {
  const [time, setTime] = useState<string>(
    defaults?.type === "daily" ? defaults.runAt : "00:00",
  );
  const [timezone, setTimezone] = useState<string>(defaults?.timezone || "UTC");
  useEffect(() => {
    if (defaults) return;
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [defaults]);
  return {
    time,
    formattedTime: useMemo(
      () =>
        Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(new Date(`2000-01-01T${time}:00`)),
      [time],
    ),
    setTime,
    timezone,
  };
}

export default function ScheduleSelect({
  defaultSchedule,
}: ScheduleSelectProps) {
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    defaultSchedule?.type ?? "daily",
  );

  const {
    time: scheduleTime,
    formattedTime: formattedScheduleTime,
    setTime: setScheduleTime,
    timezone,
  } = useFormatteTime(defaultSchedule);

  return (
    <div className="space-y-4">
      {/* Schedule Configuration */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Schedule Frequency
        </Label>
        <input type="hidden" name={SCHEDULE_FIELDS.timezone} value={timezone} />
        <div className="flex flex-col items-start sm:flex-row gap-4">
          {/* Schedule Type Selection */}
          <Select
            name={SCHEDULE_FIELDS.type}
            value={scheduleType}
            onValueChange={(value: ScheduleType) => setScheduleType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select schedule frequency..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(scheduleTypeLabels).map(([type, label]) => (
                <SelectItem key={type} value={type}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Selection for Daily Schedule */}
          {scheduleType === "daily" && (
            <div className="flex items-center">
              <Label
                htmlFor="scheduleTime"
                className="text-sm whitespace-nowrap sr-only"
              >
                Run at
              </Label>
              <Input
                id="scheduleTime"
                name={SCHEDULE_FIELDS.runAt}
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-auto"
              />
            </div>
          )}
        </div>

        {/* Schedule Info */}
        {scheduleType === "daily" && (
          <p className="text-sm text-gray-600">
            Task will run daily at {formattedScheduleTime} ({timezone}).
          </p>
        )}
      </div>

      {/* Info for Hourly Schedule */}
      {scheduleType === "hourly" && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <p className="font-medium mb-1">Hourly Schedule:</p>
          <p>
            Task will run every hour at the top of the hour (00:00) in{" "}
            {timezone}.
          </p>
        </div>
      )}
    </div>
  );
}
