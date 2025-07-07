import { ListTaskExecutionsQuerySchema, ListTaskExecutionsResponseDto, TaskExecution } from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { ListTaskExecutionsResponseDto, TaskExecution };

export class ListTaskExecutionsQueryDto extends ValibotDto(ListTaskExecutionsQuerySchema) {}
