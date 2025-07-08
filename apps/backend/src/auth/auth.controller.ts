import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  UserProfileDto,
} from "./dto/auth.dto";

import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { User } from "./user.decorator";
import { ValidationPipe } from "@/validators/valibot.pipe";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(@User() user: UserEntity): Promise<AuthResponseDto> {
    return this.authService.login(user);
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto.data);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@User() user: UserEntity): Promise<UserProfileDto> {
    return this.authService.getUserProfile(user);
  }
}
