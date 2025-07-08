import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Sse,
  MessageEvent,
} from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";
import { BasicAuthGuard } from "@/auth/basic-auth.guard";
import { User } from "@/auth/user.decorator";
import { CreatePushSubscriptionDto } from "./dto/push-subscription.dto";
import { NotificationService } from "./notification.service";
import { Observable, map, interval, merge } from "rxjs";
import { TaskNotificationDto } from "./dto/push-subscription.dto";

@Controller("notifications")
@UseGuards(BasicAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post("subscriptions")
  async subscribe(
    @User() user: UserEntity,
    @Body() subscription: CreatePushSubscriptionDto,
  ): Promise<{ success: boolean }> {
    await this.notificationService.subscribeUser(user.id, subscription);
    return { success: true };
  }

  @Delete("subscriptions/:endpointHash")
  async unsubscribe(
    @User() user: UserEntity,
    @Param("endpointHash") endpointHash: string,
  ): Promise<{ success: boolean }> {
    await this.notificationService.unsubscribeUser(user.id, endpointHash);
    return { success: true };
  }

  @Sse("sse")
  streamNotifications(@User() user: UserEntity): Observable<MessageEvent> {
    // Create SSE connection for the user
    const notificationStream = this.notificationService.createSSEConnection(user.id);
    
    // Create heartbeat stream (every 30 seconds)
    const heartbeat = interval(30000).pipe(
      map(() => ({
        type: "heartbeat",
        data: { timestamp: new Date().toISOString() },
      } satisfies MessageEvent))
    );
    
    // Create notification stream
    const notifications = notificationStream.pipe(
      map((notification: TaskNotificationDto) => ({
        type: "notification",
        data: notification,
      } satisfies MessageEvent))
    );
    
    // Merge heartbeat and notifications
    return merge(heartbeat, notifications);
  }


  @Get("status")
  async getStatus(
    @User() user: UserEntity,
  ): Promise<{
    sseConnections: number;
    pushSubscriptions: number;
  }> {
    return this.notificationService.getConnectionStatus(user.id);
  }
}
