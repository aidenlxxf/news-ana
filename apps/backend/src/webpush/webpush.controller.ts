import { Body, Controller, Delete, Post, UseGuards } from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";
import { BasicAuthGuard } from "@/auth/basic-auth.guard";
import { User } from "@/auth/user.decorator";
import { PushSubscriptionDto } from "./dto/push-subscription.dto";
import { WebPushService } from "./webpush.service";

@Controller("webpush")
@UseGuards(BasicAuthGuard)
export class WebPushController {
  constructor(private readonly webPushService: WebPushService) {}

  @Post("subscribe")
  async subscribe(
    @User() user: UserEntity,
    @Body() subscription: PushSubscriptionDto,
  ): Promise<{ success: boolean }> {
    await this.webPushService.subscribeUser(user.id, subscription);
    return { success: true };
  }

  @Delete("unsubscribe")
  async unsubscribe(
    @User() user: UserEntity,
    @Body() body: { endpoint: string },
  ): Promise<{ success: boolean }> {
    await this.webPushService.unsubscribeUser(user.id, body.endpoint);
    return { success: true };
  }
}
