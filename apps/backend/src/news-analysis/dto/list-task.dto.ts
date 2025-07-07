import { ListTasksQuerySchema, ListTasksResponseDto, TaskSummary } from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { ListTasksResponseDto, TaskSummary };

export class ListTasksQueryDto extends ValibotDto(ListTasksQuerySchema) {}
