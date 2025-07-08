import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";
import { BasicAuthGuard } from "@/auth/basic-auth.guard";
import { User } from "@/auth/user.decorator";
import { CreatePushSubscriptionDto } from "./dto/push-subscription.dto";
import { WebPushService } from "./webpush.service";

@Controller("webpush")
@UseGuards(BasicAuthGuard)
export class WebPushController {
  constructor(private readonly webPushService: WebPushService) {}

  @Post("/subscriptions")
  async subscribe(
    @User() user: UserEntity,
    @Body() subscription: CreatePushSubscriptionDto,
  ): Promise<{ success: boolean }> {
    await this.webPushService.subscribeUser(user.id, subscription);
    return { success: true };
  }

  @Delete("/subscriptions/:endpointHash")
  async unsubscribe(
    @User() user: UserEntity,
    @Param("endpointHash") endpointHash: string,
  ): Promise<{ success: boolean }> {
    await this.webPushService.unsubscribeUser(user.id, endpointHash);
    return { success: true };
  }
}
