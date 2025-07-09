import { UpdateTaskSchema } from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { UpdateTaskResponseDto } from "@na/schema";

export class UpdateTaskDto extends ValibotDto(UpdateTaskSchema) {}
