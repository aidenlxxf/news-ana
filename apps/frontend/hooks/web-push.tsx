import {
  subscribeUserAction,
  unsubscribeUserAction,
} from "@/actions/live-update";
import { sha256Hash, urlBase64ToUint8Array } from "@/lib/encoding";
import { atom, useAtom, useStore } from "jotai";
import { atomWithRefresh, loadable } from "jotai/utils";
import { useCallback } from "react";
import { toast } from "sonner";
import { atomEffect } from "jotai-effect";
import { isTaskWebPushMessage, TaskNotificationEvent } from "@/types/frontend";

export const isWebPushSupportedAtom = atom(
  (get) =>
    get(isServiceWorkerSupportedAtom) &&
    "PushManager" in window &&
    window.location.protocol === "https:",
);
export const isServiceWorkerSupportedAtom = atom(
  () => typeof window !== "undefined" && "serviceWorker" in navigator,
);

export const pushMessageProxyAtom = atomEffect((get) => {
  if (!get(isWebPushSupportedAtom)) return;
  function proxyPushMessage(event: MessageEvent) {
    if (isTaskWebPushMessage(event.data)) {
      window.dispatchEvent(new TaskNotificationEvent(event.data.payload));
    }
  }
  navigator.serviceWorker.addEventListener("message", proxyPushMessage);
  return () => {
    navigator.serviceWorker.removeEventListener("message", proxyPushMessage);
  };
});

const pushSubscriptionAtom = atomWithRefresh(
  async (
    get,
  ): Promise<
    | {
        status: "denied" | "prompt" | "not-supported";
        subscription: null;
      }
    | { status: "granted"; subscription: PushSubscription | null }
  > => {
    const registration = await get(serviceWorkerRegistrationAtom);
    if (!registration) return { status: "not-supported", subscription: null };

    const permission = await navigator.permissions.query({
      name: "notifications",
    });
    if (permission.state === "denied" || permission.state === "prompt") {
      return { status: permission.state, subscription: null };
    }
    return {
      status: "granted",
      subscription: await registration.pushManager.getSubscription(),
    };
  },
);

export const serviceWorkerRegistrationAtom = atom(async (get) => {
  if (!get(isWebPushSupportedAtom)) {
    return null;
  }
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  return registration;
});

export function useServiceWorker() {
  useAtom(serviceWorkerRegistrationAtom);
  useAtom(pushMessageProxyAtom);
}

const pushSubscriptionLoadableAtom = loadable(pushSubscriptionAtom);

export { pushSubscriptionLoadableAtom as pushSubscriptionAtom };

export function useSubscribeWebPush() {
  const store = useStore();
  return useCallback(async () => {
    const registration = await store.get(serviceWorkerRegistrationAtom);
    if (!registration) return;

    // this would implicitly request notification permission
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      ),
    });
    const subJson = subscription.toJSON();
    await subscribeUserAction({
      endpoint: subscription.endpoint,
      expirationTime: subJson.expirationTime
        ? new Date(subJson.expirationTime).toISOString()
        : null,
      keys: subJson.keys as { p256dh: string; auth: string },
    });
    // refresh the pushSubscriptionAtom with the new subscription
    store.set(pushSubscriptionAtom);
    return subscription;
  }, [store]);
}

/**
 * Gracefully inform user before prompting for notification permission
 */
export function useRequestWebPushSubscription() {
  const subscribeWebPush = useSubscribeWebPush();
  const store = useStore();
  return useCallback(async () => {
    const registration = await store.get(serviceWorkerRegistrationAtom);
    if (!registration) return;

    const permission = await navigator.permissions.query({
      name: "notifications",
    });
    if (permission.state === "denied") {
      toast.error(
        "Please enable push notifications in browser settings to get real-time updates about your news analysis tasks.",
      );
    }
    if (permission.state === "granted") {
      await subscribeWebPush();
      return;
    }
    // Permission is "prompt", show a friendly prompt
    toast.info(
      "Enable push notifications to get real-time updates about your news analysis tasks.",
      {
        action: {
          label: "Enable",
          onClick: async () => {
            await subscribeWebPush();
          },
        },
        duration: 10000,
      },
    );
  }, [store, subscribeWebPush]);
}

export function useUnsubscribeWebPush() {
  const store = useStore();
  return useCallback(async () => {
    const { subscription } = await store.get(pushSubscriptionAtom);
    if (!subscription) return;
    if (!(await subscription.unsubscribe())) {
      return false;
    }
    const endpointHash = await sha256Hash(subscription.endpoint);
    await unsubscribeUserAction({ endpointHash });
    return true;
  }, [store]);
}
