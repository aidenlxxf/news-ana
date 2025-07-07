import { ExecutionStatus } from "@prisma/client";
import { ValibotDto } from "@/validators/valibot.dto";
import { formInteger } from "@/validators/valibot.schema";

import * as v from "valibot";

export class ListTaskExecutionsQueryDto extends ValibotDto(
  v.pick(
    v.object({
      limit: v.pipe(formInteger(20), v.minValue(1)),
      offset: v.pipe(formInteger(0), v.minValue(0)),
    }),
    ["limit", "offset"],
  ),
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
