import { ExecutionStatus } from "@prisma/client";
import { ValibotDto } from "../validators/valibot.dto";
import * as v from "valibot";

export class ListTasksQueryDto extends ValibotDto(
  v.strictObject({
    limit: v.optional(v.number(), 20),
    offset: v.optional(v.number(), 0),
  }),
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