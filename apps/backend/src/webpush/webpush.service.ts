import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma.service";
import { PushSubscription } from "@prisma/client";
import * as webpush from "web-push";
import {
  PushSubscriptionDto,
  PushNotificationDto,
} from "./dto/push-subscription.dto";

@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const vapidPublicKey = this.configService.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = this.configService.get("VAPID_PRIVATE_KEY");
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set");
    }

    webpush.setVapidDetails(
      "mailto:your-email@example.com",
      vapidPublicKey,
      vapidPrivateKey,
    );
  }

  async subscribeUser(
    userId: string,
    subscription: PushSubscriptionDto,
  ): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.data.endpoint,
        },
      },
      update: {
        p256dh: subscription.data.keys.p256dh,
        auth: subscription.data.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.data.endpoint,
        p256dh: subscription.data.keys.p256dh,
        auth: subscription.data.keys.auth,
      },
    });

    this.logger.log(`Subscribed user ${userId} to push notifications`);
  }

  async unsubscribeUser(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });

    this.logger.log(`Unsubscribed user ${userId} from endpoint ${endpoint}`);
  }

  async sendNotification(
    subscription: PushSubscription,
    notification: PushNotificationDto,
  ): Promise<void> {
    const payload = JSON.stringify({
      title:
        notification.type === "success"
          ? "Analysis Complete"
          : "Analysis Failed",
      body: notification.message,
      data: { taskId: notification.taskId },
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
      );

      this.logger.log(
        `Push notification sent successfully to ${subscription.endpoint}`,
      );
    } catch (error) {
      this.logger.error(
        `Push notification failed for ${subscription.endpoint}:`,
        error,
      );
      // 可以考虑删除无效的订阅
      if (error.statusCode === 410) {
        await this.prisma.pushSubscription.delete({
          where: { id: subscription.id },
        });
        this.logger.log(`Removed invalid subscription ${subscription.id}`);
      }
    }
  }
}
