import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return request.user;
  },
);
