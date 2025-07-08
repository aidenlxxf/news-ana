import { NewsUpdateEvent } from "@/types/frontend";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { TaskNotificationDto } from "@na/schema";
import { atom, useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { isWebPushSupportedAtom } from "./web-push";

// Backend API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_HOST || "http://localhost:3001";

// Test credentials, will replace this with real user auth solution
const AUTH_USERNAME = "test";
const AUTH_PASSWORD = "password";

// Create Basic Auth header
function createAuthHeader(): string {
  const credentials = Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString(
    "base64",
  );
  return `Basic ${credentials}`;
}

export const isSSESupportedAtom = atom(
  () =>
    typeof window !== "undefined" && // only enable in browser
    typeof EventSource !== "undefined" &&
    typeof TextDecoder !== "undefined" &&
    typeof fetch !== "undefined",
);

export const isSSEConnectedActiveAtom = atom(false);

export const sseConnectionAtom = atomEffect((get, set) => {
  if (!get(isSSESupportedAtom) || get(isWebPushSupportedAtom)) return;
  const ac = new AbortController();
  fetchEventSource(`${API_BASE_URL}/notifications/sse`, {
    signal: ac.signal,
    headers: {
      Authorization: createAuthHeader(),
    },
    onopen: async (response) => {
      if (!response.ok) return;
      set(isSSEConnectedActiveAtom, true);
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
