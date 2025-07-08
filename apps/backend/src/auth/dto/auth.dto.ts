import {
  LoginDtoSchema,
  RegisterDtoSchema,
  AuthResponseDto,
  UserProfileDto,
  JwtPayload,
} from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { AuthResponseDto, UserProfileDto, JwtPayload };

export class LoginDto extends ValibotDto(LoginDtoSchema) {}

export class RegisterDto extends ValibotDto(RegisterDtoSchema) {}
