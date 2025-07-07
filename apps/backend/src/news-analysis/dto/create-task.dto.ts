import { CreateTaskSchema, CreateTaskDtoType, CreateTaskResponseDto } from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { CreateTaskDtoType, CreateTaskResponseDto };

export class CreateTaskDto extends ValibotDto(CreateTaskSchema) {}
