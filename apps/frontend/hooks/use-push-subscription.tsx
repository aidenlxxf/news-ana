"use client";

import { CreatePushSubscriptionSchema } from "@na/schema";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import * as v from "valibot";
import { subscribeUserAction, unsubscribeUserAction } from "@/app/actions";
import { sha256Hash, urlBase64ToUint8Array } from "@/lib/encoding";

async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  return registration;
}

export interface UsePushSubscriptionReturn {
  isSupported: boolean;
  isLoading: boolean;
  isSubscribed: boolean;
  subscribe: () => void;
  /** show a prompt if user not yet granted permission */
  requestSubscription: () => void;
  unsubscribe: () => void;
}

export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  return { isSupported };
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const [isSupported, setIsSupported] = useState(false);
  const subscriptionRef = useRef<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      startTransition(async () => {
        const registration = await registerServiceWorker();
        const subscription = await registration.pushManager.getSubscription();
        subscriptionRef.current = subscription;
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        ),
      });
      subscriptionRef.current = sub;
      const json = sub.toJSON();
      const parsed = v.parse(CreatePushSubscriptionSchema, {
        endpoint: sub.endpoint,
        expirationTime: json.expirationTime
          ? new Date(json.expirationTime).toISOString()
          : null,
        keys: json.keys,
      });
      await subscribeUserAction(parsed);
      toast.success("Push notifications enabled successfully!");
      setIsSubscribed(true);
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      toast.error("Failed to enable push notifications. Please try again.");
      setIsSubscribed(false);
    }
  }, []);

  const requestSubscription = useCallback(
    () =>
      startTransition(async (): Promise<void> => {
        if (!isSupported) {
          toast.error("Push notifications are not supported in this browser.");
          return;
        }

        if (subscriptionRef.current) {
          return;
        }

        // Check permission status
        const permission = await navigator.permissions.query({
          name: "notifications",
        });

        if (permission.state === "denied") {
          toast.error(
            "Push notifications are blocked. Please enable them in your browser settings.",
          );
          return;
        }

        if (permission.state === "granted") {
          await subscribe();
          return;
        }

        // Permission is "default", show a friendly prompt
        toast(
          "Enable push notifications to get real-time updates about your news analysis tasks.",
          {
            action: {
              label: "Enable",
              onClick: async () => {
                await subscribe();
              },
            },
            duration: 10000, // Show for 10 seconds
          },
        );

        return;
      }),
    [subscribe, isSupported],
  );

  const unsubscribe = useCallback(
    () =>
      startTransition(async () => {
        const subscription = subscriptionRef.current;
        if (!subscription) return;
        subscriptionRef.current = null;
        await Promise.all([
          sha256Hash(subscription.endpoint).then((endpointHash) =>
            unsubscribeUserAction({ endpointHash }),
          ),
          subscription.unsubscribe(),
        ]);
        setIsSubscribed(false);
      }),
    [],
  );

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe: useCallback(() => startTransition(subscribe), [subscribe]),
    requestSubscription,
    unsubscribe,
  };
}
