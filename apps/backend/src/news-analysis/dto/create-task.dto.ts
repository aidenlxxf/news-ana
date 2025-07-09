import { CreateTaskSchema } from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { CreateTaskResponseDto } from "@na/schema";

export class CreateTaskDto extends ValibotDto(CreateTaskSchema) {}
