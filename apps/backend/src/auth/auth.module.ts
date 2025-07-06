import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { BasicAuthGuard } from "./basic-auth.guard";
import { PrismaService } from "@/prisma.service";

@Module({
  providers: [AuthService, BasicAuthGuard, PrismaService],
  exports: [AuthService, BasicAuthGuard],
})
export class AuthModule {}

// Export the User decorator for convenience
export { User } from "./user.decorator";
