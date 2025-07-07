import { ExecutionStatus } from "@prisma/client";
import { ValibotDto } from "@/validators/valibot.dto";
import { formInteger } from "@/validators/valibot.schema";

import * as v from "valibot";

export class ListTasksQueryDto extends ValibotDto(
  v.pick(
    v.object({
      limit: v.pipe(formInteger(20), v.minValue(1)),
      offset: v.pipe(formInteger(0), v.minValue(0)),
    }),
    ["limit", "offset"],
  ),
) {}

export interface ListTasksResponseDto {
  tasks: TaskSummary[];
  limit: number;
  offset: number;
}

interface TaskSummary {
  id: string;
  country?: string;
  category?: string;
  query?: string;
  /** ISO 8601 */
  createdAt: string;
  lastExecutionStatus?: ExecutionStatus;
}
