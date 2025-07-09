import {
  UpdateTaskDtoType,
  UpdateTaskResponseDto,
  UpdateTaskSchema,
} from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { UpdateTaskDtoType, UpdateTaskResponseDto };

export class UpdateTaskDto extends ValibotDto(UpdateTaskSchema) {}
