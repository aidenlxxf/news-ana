import * as v from "valibot";

// Login DTO Schema
export const LoginDtoSchema = v.object({
  username: v.pipe(v.string(), v.minLength(1, "Username is required")),
  password: v.pipe(v.string(), v.minLength(1, "Password is required")),
});

export type LoginDto = v.InferInput<typeof LoginDtoSchema>;

// Register DTO Schema
export const RegisterDtoSchema = v.object({
  username: v.pipe(
    v.string(),
    v.minLength(3, "Username must be at least 3 characters long"),
    v.maxLength(50, "Username must be at most 50 characters long"),
  ),
  password: v.pipe(
    v.string(),
    v.minLength(6, "Password must be at least 6 characters long"),
  ),
});

export type RegisterDto = v.InferInput<typeof RegisterDtoSchema>;

// Auth Response DTO Types
export interface AuthResponseDto {
  access_token: string;
  user: UserProfileDto;
}

export interface UserProfileDto {
  id: string;
  username: string;
  createdAt: Date;
}

// JWT Payload Interface
export interface JwtPayload {
  sub: string;
  username: string;
}
