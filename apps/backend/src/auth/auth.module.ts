import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { AuthService } from "./auth.service";
import { BasicAuthGuard } from "./basic-auth.guard";

@Module({
  providers: [AuthService, BasicAuthGuard, PrismaService],
  exports: [AuthService, BasicAuthGuard],
})
export class AuthModule {}

// Export the User decorator for convenience
export { User } from "./user.decorator";
