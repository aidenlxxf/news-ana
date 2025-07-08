import { createHash } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PushSubscription } from "@prisma/client";
import * as webpush from "web-push";
import { Subject } from "rxjs";
import { PrismaService } from "@/prisma.service";
import {
  CreatePushSubscriptionDto,
  TaskNotificationDto,
} from "./dto/push-subscription.dto";

export interface SSEConnection {
  userId: string;
  subject: Subject<TaskNotificationDto>;
  lastActivity: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly sseConnections = new Map<string, SSEConnection>();

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
    
    // Clean up inactive SSE connections every 5 minutes
    setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
  }

  // Web Push Methods
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

  // SSE Methods
  createSSEConnection(userId: string): Subject<TaskNotificationDto> {
    const connectionId = `${userId}-${Date.now()}`;
    const subject = new Subject<TaskNotificationDto>();
    
    const connection: SSEConnection = {
      userId,
      subject,
      lastActivity: new Date(),
    };
    
    this.sseConnections.set(connectionId, connection);
    
    this.logger.log(`Created SSE connection for user ${userId}: ${connectionId}`);
    
    // Handle connection cleanup when client disconnects
    subject.subscribe({
      complete: () => {
        this.sseConnections.delete(connectionId);
        this.logger.log(`SSE connection closed for user ${userId}: ${connectionId}`);
      },
      error: () => {
        this.sseConnections.delete(connectionId);
        this.logger.log(`SSE connection error for user ${userId}: ${connectionId}`);
      },
    });
    
    return subject;
  }

  // Unified Notification Method
  async sendNotification(
    userId: string,
    notification: TaskNotificationDto,
  ): Promise<void> {
    this.logger.log(`Sending notification to user ${userId}: ${notification.message}`);
    
    // Send via SSE
    this.sendSSENotification(userId, notification);
    
    // Send via Web Push
    await this.sendWebPushNotification(userId, notification);
    
  }

  private async sendWebPushNotification(
    userId: string,
    notification: TaskNotificationDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { pushSubscriptions: true },
    });

    if (!user || user.pushSubscriptions.length === 0) {
      this.logger.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    for (const subscription of user.pushSubscriptions) {
      await this.sendPushToSubscription(subscription, notification);
    }
  }

  private async sendPushToSubscription(
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

  private sendSSENotification(
    userId: string,
    notification: TaskNotificationDto,
  ): void {
    const userConnections = Array.from(this.sseConnections.values())
      .filter(conn => conn.userId === userId);
    
    if (userConnections.length === 0) {
      this.logger.log(`No SSE connections found for user ${userId}`);
      return;
    }

    for (const connection of userConnections) {
      try {
        connection.subject.next(notification);
        connection.lastActivity = new Date();
        this.logger.log(`SSE notification sent to user ${userId}`);
      } catch (error) {
        this.logger.error(`Failed to send SSE notification to user ${userId}:`, error);
      }
    }
  }

  private cleanupInactiveConnections(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const connectionsToRemove: string[] = [];
    
    for (const [connectionId, connection] of this.sseConnections.entries()) {
      if (connection.lastActivity < fiveMinutesAgo) {
        connectionsToRemove.push(connectionId);
      } 
    }
    
    for (const connectionId of connectionsToRemove) {
      const connection = this.sseConnections.get(connectionId);
      if (connection) {
        connection.subject.complete();
      }
      this.sseConnections.delete(connectionId);
      this.logger.log(`Cleaned up inactive SSE connection: ${connectionId}`);
    }
  }

  // Health check method
  getConnectionStatus(userId: string): {
    sseConnections: number;
    pushSubscriptions: number;
  } {
    const sseConnections = Array.from(this.sseConnections.values())
      .filter(conn => conn.userId === userId).length;
    
    // Note: pushSubscriptions count would need to be fetched from database
    return {
      sseConnections,
      pushSubscriptions: 0, // Will be implemented when needed
    };
  }
}
