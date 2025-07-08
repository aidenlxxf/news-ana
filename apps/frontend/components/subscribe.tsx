"use client";

import { usePushSubscription } from "@/hooks/use-push-subscription";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SubscribeButton() {
  const { isSupported, isLoading, isSubscribed, unsubscribe, subscribe } =
    usePushSubscription();

  if (isSubscribed) {
    return (
      <Button disabled={isLoading} variant="destructive" onClick={unsubscribe}>
        <Loader2 className={cn("size-4 animate-spin", isLoading || "hidden")} />
        {isLoading ? "Unsubscribing..." : "Unsubscribe"}
      </Button>
    );
  }

  return (
    <Button disabled={!isSupported || isLoading} onClick={subscribe}>
      <Loader2 className={cn("size-4 animate-spin", isLoading || "hidden")} />
      {isLoading ? "Subscribing..." : "Subscribe"}
    </Button>
  );
}
