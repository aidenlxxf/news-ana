import { ExecutionStatus } from "@prisma/client";
import { ValibotDto } from "../validators/valibot.dto";
import * as v from "valibot";

export class ListTaskExecutionsQueryDto extends ValibotDto(
  v.strictObject({
    limit: v.optional(v.number(), 20),
    offset: v.optional(v.number(), 0),
  }),
) {}

export interface ListTaskExecutionsResponseDto {
  executions: TaskExecution[];
  limit: number;
  offset: number;
}

interface TaskExecution {
  id: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  errorMessage?: string;
}
