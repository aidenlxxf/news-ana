import { Injectable, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "@/prisma.service";
import { AuthResponseDto, UserProfileDto } from "./dto/auth.dto";
import { RegisterDto as RegisterDtoType } from "@na/schema";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async createUser(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
  }

  async login(user: User): Promise<AuthResponseDto> {
    const payload = { username: user.username, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async register(registerDto: RegisterDtoType): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException("Username already exists");
    }

    // Create new user
    const user = await this.createUser(
      registerDto.username,
      registerDto.password,
    );

    // Return login response
    return this.login(user);
  }

  getUserProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
