#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

// VAPID Configuration
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
  console.error(
    "❌ VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT must be set",
  );
  process.exit(1);
}

if (
  !vapidSubject.startsWith("mailto:") &&
  !vapidSubject.startsWith("http:") &&
  !vapidSubject.startsWith("https:")
) {
  console.error("❌ VAPID_SUBJECT must start with mailto:, http:, or https:");
  process.exit(1);
}

// Configure web-push
webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

/**
 * Send a push notification to a specific subscription
 * @param {Object} subscription - Push subscription object
 * @param {Object} notification - Notification payload
 */
async function sendNotification(subscription, notification) {
  // Check if subscription is expired
  if (subscription.expirationTime && subscription.expirationTime < new Date()) {
    await prisma.pushSubscription.deleteMany({
      where: { endpointHash: subscription.endpointHash },
    });
    console.log(`🗑️  Removed expired subscription ${subscription.endpointHash}`);
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

    console.log(
      `✅ Push notification sent successfully to ${subscription.endpoint}`,
    );
  } catch (error) {
    console.error(
      `❌ Push notification failed for ${subscription.endpoint}:`,
      error.message,
    );

    // Remove invalid subscriptions (HTTP 410 Gone)
    if (error.statusCode === 410) {
      await prisma.pushSubscription.delete({
        where: { endpointHash: subscription.endpointHash },
      });
      console.log(
        `🗑️  Removed invalid subscription ${subscription.endpointHash}`,
      );
    }
  }
}

/**
 * Send notification to all subscriptions for a specific user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification payload
 */
async function sendNotificationToUser(userId, notification) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pushSubscriptions: true },
  });

  if (!user) {
    console.error(`❌ User not found: ${userId}`);
    return;
  }

  if (user.pushSubscriptions.length === 0) {
    console.log(`ℹ️  No push subscriptions found for user: ${user.username}`);
    return;
  }

  console.log(
    `📤 Sending notification to ${user.pushSubscriptions.length} subscription(s) for user: ${user.username}`,
  );

  for (const subscription of user.pushSubscriptions) {
    await sendNotification(subscription, notification);
  }
}

/**
 * Send notification to all users
 * @param {Object} notification - Notification payload
 */
async function sendNotificationToAllUsers(notification) {
  const users = await prisma.user.findMany({
    include: { pushSubscriptions: true },
  });

  console.log(`📤 Sending notification to ${users.length} user(s)`);

  for (const user of users) {
    if (user.pushSubscriptions.length > 0) {
      console.log(
        `📤 Sending to user: ${user.username} (${user.pushSubscriptions.length} subscription(s))`,
      );
      for (const subscription of user.pushSubscriptions) {
        await sendNotification(subscription, notification);
      }
    }
  }
}

/**
 * Send notification to a specific task's owner
 * @param {string} taskId - Task ID
 * @param {Object} notification - Notification payload
 */
async function sendNotificationToTaskOwner(taskId, notification) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      user: { include: { pushSubscriptions: true } },
    },
  });

  if (!task) {
    console.error(`❌ Task not found: ${taskId}`);
    return;
  }

  console.log(
    `📤 Sending notification for task ${taskId} to user: ${task.user.username}`,
  );
  await sendNotificationToUser(task.user.id, notification);
}

/**
 * List all users and their push subscriptions
 */
async function listUsers() {
  const users = await prisma.user.findMany({
    include: { pushSubscriptions: true },
  });

  console.log("\n👥 Users and Push Subscriptions:");
  console.log("================================");

  for (const user of users) {
    console.log(`\n📱 User: ${user.username} (${user.id})`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);
    console.log(`   Push Subscriptions: ${user.pushSubscriptions.length}`);

    for (const sub of user.pushSubscriptions) {
      console.log(`   - Endpoint: ${sub.endpoint.substring(0, 50)}...`);
      console.log(`     Hash: ${sub.endpointHash}`);
      console.log(
        `     Expires: ${sub.expirationTime?.toISOString() || "Never"}`,
      );
    }
  }
}

/**
 * List all tasks
 */
async function listTasks() {
  const tasks = await prisma.task.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n📋 Tasks:");
  console.log("=========");

  for (const task of tasks) {
    console.log(`\n📝 Task: ${task.id}`);
    console.log(`   Owner: ${task.user.username}`);
    console.log(`   Created: ${task.createdAt.toISOString()}`);
    console.log(`   Parameters: ${JSON.stringify(task.parameters, null, 2)}`);
  }
}

/**
 * Main function to handle command line arguments
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔔 Manual Push Notification Script
==================================

Usage:
  node manual-push-notification.js <command> [options]

Commands:
  list-users                          List all users and their push subscriptions
  list-tasks                          List all tasks
  
  send-to-user <userId> <message> [type]
    Send notification to a specific user
    type: success|error (default: success)
  
  send-to-all <message> [type]
    Send notification to all users
    type: success|error (default: success)
  
  send-to-task-owner <taskId> <message> [type]
    Send notification to the owner of a specific task
    type: success|error (default: success)

Examples:
  node manual-push-notification.js list-users
  node manual-push-notification.js send-to-user 123e4567-e89b-12d3-a456-426614174000 "Your analysis is complete!"
  node manual-push-notification.js send-to-all "System maintenance completed" success
  node manual-push-notification.js send-to-task-owner abc123 "Task analysis failed" error
`);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case "list-users":
        await listUsers();
        break;

      case "list-tasks":
        await listTasks();
        break;

      case "send-to-user": {
        const [, userId, message, type = "success"] = args;
        if (!userId || !message) {
          console.error("❌ Usage: send-to-user <userId> <message> [type]");
          process.exit(1);
        }
        await sendNotificationToUser(userId, {
          taskId: "manual-notification",
          message,
          type,
        });
        break;
      }

      case "send-to-all": {
        const [, message, type = "success"] = args;
        if (!message) {
          console.error("❌ Usage: send-to-all <message> [type]");
          process.exit(1);
        }
        await sendNotificationToAllUsers({
          taskId: "manual-notification",
          message,
          type,
        });
        break;
      }

      case "send-to-task-owner": {
        const [, taskId, message, type = "success"] = args;
        if (!taskId || !message) {
          console.error(
            "❌ Usage: send-to-task-owner <taskId> <message> [type]",
          );
          process.exit(1);
        }
        await sendNotificationToTaskOwner(taskId, {
          taskId,
          message,
          type,
        });
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
