import { createHash } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PushSubscription } from "@prisma/client";
import * as webpush from "web-push";
import { PrismaService } from "@/prisma.service";
import {
  CreatePushSubscriptionDto,
  TaskNotificationDto,
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
    const vapidSubject = this.configService.get("VAPID_SUBJECT");
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set");
    }
    if (
      !vapidSubject.startsWith("mailto:") &&
      !vapidSubject.startsWith("http:") &&
      !vapidSubject.startsWith("https:")
    ) {
      throw new Error(
        "VAPID_SUBJECT must start with mailto: or http: or https:",
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  }

  async subscribeUser(
    userId: string,
    subscription: CreatePushSubscriptionDto,
  ): Promise<void> {
    const endpointHash = createHash("sha256")
      .update(subscription.data.endpoint)
      .digest("hex");

    await this.prisma.pushSubscription.upsert({
      where: { endpointHash },
      update: {
        p256dh: subscription.data.keys.p256dh,
        auth: subscription.data.keys.auth,
        expirationTime: subscription.data.expirationTime,
      },
      create: {
        endpointHash,
        expirationTime: subscription.data.expirationTime,
        endpoint: subscription.data.endpoint,
        p256dh: subscription.data.keys.p256dh,
        auth: subscription.data.keys.auth,
        users: { connect: { id: userId } },
      },
    });

    this.logger.log(`Subscribed user ${userId} to push notifications`);
  }

  async unsubscribeUser(userId: string, endpointHash: string): Promise<void> {
    await this.prisma.pushSubscription.update({
      where: { endpointHash },
      data: { users: { disconnect: { id: userId } } },
    });

    this.logger.log(
      `Unsubscribed user ${userId} from endpoint ${endpointHash}`,
    );
  }

  async sendNotification(
    subscription: PushSubscription,
    notification: TaskNotificationDto,
  ): Promise<void> {
    if (
      subscription.expirationTime &&
      subscription.expirationTime < new Date()
    ) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpointHash: subscription.endpointHash },
      });
      this.logger.log(
        `Removed expired subscription ${subscription.endpointHash}`,
      );
      return;
    }

    const payload = JSON.stringify(notification);

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
          where: { endpointHash: subscription.endpointHash },
        });
        this.logger.log(
          `Removed invalid subscription ${subscription.endpointHash}`,
        );
      }
    }
  }
}
