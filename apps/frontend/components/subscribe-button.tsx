"use client";

import { Button } from "./ui/button";
import { Activity, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAtomValue } from "jotai";
import { isSSEConnectedActiveAtom, isSSESupportedAtom } from "@/hooks/sse-push";
import {
  isWebPushSupportedAtom,
  pushSubscriptionAtom,
  useSubscribeWebPush,
  useUnsubscribeWebPush,
} from "@/hooks/web-push";

export default function NotificationButton() {
  const isSSESupported = useAtomValue(isSSESupportedAtom);
  const isWebPushSupported = useAtomValue(isWebPushSupportedAtom);

  if (isWebPushSupported) {
    return <WebPushButton />;
  }
  if (isSSESupported) {
    return <SSEButton />;
  }

  return (
    <Button disabled={true}>
      <Loader2 className={cn("size-4 animate-spin")} />
      Live updates not supported
    </Button>
  );
}

function SSEButton() {
  const isSSEConnectedActive = useAtomValue(isSSEConnectedActiveAtom);
  if (isSSEConnectedActive) {
    return (
      <Button disabled>
        <Activity className="size-4" /> Live updates enabled
      </Button>
    );
  }
  return (
    <Button disabled>
      <Activity className="size-4" />
      Connecting...
    </Button>
  );
}

function WebPushButton() {
  const pushSubscription = useAtomValue(pushSubscriptionAtom);
  if (pushSubscription.state === "loading") {
    return <WebPushSubscribeLoading />;
  }
  if (pushSubscription.state === "hasData") {
    const { status, subscription } = pushSubscription.data;
    if (status === "granted") {
      if (subscription) {
        return <WebPushUnsubscribeButton />;
      }
      return <WebPushSubscribeButton />;
    }
    if (status === "prompt") {
      return <WebPushSubscribeButton />;
    }
    if (status === "denied") {
      return (
        <Button disabled>
          <Activity className="size-4" /> Notifications blocked
        </Button>
      );
    }
    if (status === "not-supported") {
      return (
        <Button disabled>
          <Activity className="size-4" /> Push not supported
        </Button>
      );
    }
  }
  return <WebPushSubscribeButton />;
}

function WebPushSubscribeButton() {
  const subscribe = useSubscribeWebPush();
  return (
    <Button onClick={subscribe}>
      <Activity className="size-4" /> Subscribe
    </Button>
  );
}

function WebPushUnsubscribeButton() {
  const unsubscribe = useUnsubscribeWebPush();
  return (
    <Button variant="destructive" onClick={unsubscribe}>
      <Activity className="size-4" /> Unsubscribe
    </Button>
  );
}

function WebPushSubscribeLoading() {
  return (
    <Button disabled>
      <Loader2 className={cn("size-4 animate-spin")} />
    </Button>
  );
}
