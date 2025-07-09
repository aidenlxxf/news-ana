"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useServiceWorker } from "@/hooks/web-push";
import { useSSEConnection } from "@/hooks/sse-push";
import type { TaskNotificationEvent } from "@/types/frontend";
import { toast } from "sonner";
import { assertNever } from "@std/assert/unstable-never";

export default function ServiceWorkerHandler() {
  const router = useRouter();

  useServiceWorker();
  useSSEConnection();

  useEffect(() => {
    function handler(event: TaskNotificationEvent) {
      const pathname = window.location.pathname;
      const handleTaskNotification = () => {
        if (
          pathname === "/" ||
          pathname.startsWith(`/tasks/${event.detail.taskId}`)
        ) {
          router.refresh();
        }
        router.prefetch(`/tasks/${event.detail.taskId}`);
        router.prefetch("/");
      };
      if (event.detail.pushType === "refresh") {
        handleTaskNotification();
      } else if (event.detail.pushType === "notification") {
        handleTaskNotification();
        toast.success(event.detail.message, {
          action: {
            label: "View Details",
            onClick: () => router.push(`/tasks/${event.detail.taskId}`),
          },
        });
      } else {
        assertNever(event.detail.pushType);
      }
    }
    window.addEventListener("task-notification", handler);
    return () => window.removeEventListener("task-notification", handler);
  }, [router]);

  // This component doesn't render anything
  return null;
}
