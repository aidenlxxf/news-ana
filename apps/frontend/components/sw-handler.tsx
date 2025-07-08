"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useServiceWorker } from "@/hooks/web-push";
import { useSSEConnection } from "@/hooks/sse-push";
import type { NewsUpdateEvent } from "@/types/frontend";
import { toast } from "sonner";

export default function ServiceWorkerHandler() {
  const router = useRouter();

  useServiceWorker();
  useSSEConnection();

  useEffect(() => {
    function handler(event: NewsUpdateEvent) {
      router.refresh();
      router.prefetch(`/tasks/${event.detail.taskId}`);
      router.prefetch("/");
      toast.success(event.detail.message);
    }
    window.addEventListener("news-update", handler);
    return () => window.removeEventListener("news-update", handler);
  }, [router]);

  // This component doesn't render anything
  return null;
}
