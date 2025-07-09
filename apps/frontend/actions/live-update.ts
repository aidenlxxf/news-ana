"use server";
import { subscribeWebPush, unsubscribeWebPush } from "@/lib/api";
import type { CreatePushSubscriptionSchema } from "@na/schema";
import type * as v from "valibot";

type CreatePushSubscriptionDtoType = v.InferInput<
  typeof CreatePushSubscriptionSchema
>;

// Server Action for subscribing to web push notifications

export async function subscribeUserAction(
  subscription: CreatePushSubscriptionDtoType,
) {
  try {
    await subscribeWebPush(subscription);
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    throw error;
  }
}
// Server Action for unsubscribing from web push notifications

export async function unsubscribeUserAction({
  endpointHash,
}: {
  endpointHash: string;
}) {
  try {
    await unsubscribeWebPush({ endpointHash });
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    throw error;
  }
}
