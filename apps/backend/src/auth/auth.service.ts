import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ 
      where: { username } 
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
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
}
