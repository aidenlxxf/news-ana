import { NewsUpdateEvent } from "@/types/frontend";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { TaskNotificationDto } from "@na/schema";
import { atom, useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { isWebPushSupportedAtom } from "./web-push";

export const isSseSupportedAtom = atom(
  () =>
    typeof window !== "undefined" && // only enable in browser
    typeof EventSource !== "undefined" &&
    typeof TextDecoder !== "undefined" &&
    typeof fetch !== "undefined",
);

export const isSseConnectedActiveAtom = atom(false);

const connResetMarkerAtom = atom(false);
export const resetSseConnAtom = atom(null, (_, set) => {
  set(connResetMarkerAtom, (v) => !!v);
});

class FatalError extends Error {}

export const sseConnectionAtom = atomEffect((get, set) => {
  if (
    !get(isSseSupportedAtom) ||
    get(isWebPushSupportedAtom) ||
    get(connResetMarkerAtom)
  )
    return;
  const ac = new AbortController();
  fetchEventSource("/notifications/sse", {
    signal: ac.signal,
    credentials: "include", // Use cookies for JWT authentication
    headers: {
      "Content-Type": "application/json",
    },
    onopen: async (response) => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new FatalError("Unauthorized");
        }
      }
      set(isSseConnectedActiveAtom, true);
      console.debug("SSE connection opened");
    },
    onmessage: (event) => {
      try {
        if (event.event === "notification") {
          console.debug("SSE message received:", event.data);
          // need routing logic if support more notification types
          const notification: TaskNotificationDto = JSON.parse(event.data);
          window.dispatchEvent(new NewsUpdateEvent(notification));
        } else if (event.event === "heartbeat") {
          // Handle heartbeat - just log for debugging
          console.debug("SSE heartbeat received");
        } else if (event.event) {
          console.debug("SSE message received:", event);
        }
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    },
    onerror: (error) => {
      console.error("SSE connection error:", error);
      // stop retrying if fatal error
      if (error instanceof FatalError) {
        throw error;
      }
    },
    onclose: () => {
      console.log("SSE connection closed");
    },
  });
  return () => {
    ac.abort();
  };
});

export function useSSEConnection() {
  useAtom(sseConnectionAtom);
}
