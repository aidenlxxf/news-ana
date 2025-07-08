import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  UserProfileDto,
} from "./dto/auth.dto";

import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { User } from "./user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.authService.validateUser(
      loginDto.data.username,
      loginDto.data.password,
    );

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.authService.login(user);
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto.data);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@User() user: UserEntity): Promise<UserProfileDto> {
    return this.authService.getUserProfile(user);
  }
}
