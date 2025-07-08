"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useServiceWorker } from "@/hooks/use-push-subscription";
import type { NewsUpdateMessage } from "@/types/frontend";
import { toast } from "sonner";

export default function ServiceWorkerHandler() {
  const router = useRouter();

  useServiceWorker();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent<NewsUpdateMessage>) => {
      console.log("handle service worker message", event.data);
      if (event.data?.type === "news-update") {
        toast.info("You got news analysis updated!");
        // Refresh the current page data
        router.refresh();
      }
    };

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [router]);

  // This component doesn't render anything
  return null;
}
