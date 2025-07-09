// @ts-check
/// <reference lib="webworker" />

((/** @type {ServiceWorkerGlobalScope} */ self) => {
  self.addEventListener("install", () => {
    self.skipWaiting();
  });
  self.addEventListener("push", async (event) => {
    if (!event.data) return;

    /** @type {import("@na/schema").TaskNotificationDto} */
    const data = event.data.json();

    event.waitUntil(handlePushMessage(data));
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then(async (clients) => {
        // Try to focus existing window first
        for (const client of clients) {
          if (client.url.includes("/tasks/") || client.url.endsWith("/")) {
            await client.focus();
            return;
          }
        }

        // Open new window if no suitable window found
        return await self.clients.openWindow("/");
      }),
    );
  });

  /**
   * @param {import("@na/schema").TaskNotificationDto} data
   */
  async function handlePushMessage(data) {
    const clients = await self.clients.matchAll({ type: "window" });

    const taskRelatedClients = clients.filter((client) => {
      const pathname = new URL(client.url).pathname;
      return pathname === "/" || pathname === `/tasks/${data.taskId}`;
    });

    // Always send message to clients for page refresh
    for (const client of taskRelatedClients) {
      /** @type {import("../types/frontend").TaskWebPushMessage} */
      const message = { type: "task-web-push", payload: data };
      client.postMessage(message);
    }

    // Only show notification if pushType is "notification" and no visible clients
    if (
      data.pushType === "notification" &&
      taskRelatedClients.every((client) => client.visibilityState !== "visible")
    ) {
      await self.registration.showNotification(
        data.status === "success" ? "Task Completed" : "Task Error",
        {
          body: data.message,
          tag: `task-${data.taskId}`,
          // chrome only
          data: {
            taskId: data.taskId,
          },
          // @ts-ignore chrome only
          actions: [
            {
              action: "view",
              title: "View Task",
            },
          ],
        },
      );
    }
  }
})(
  // @ts-ignore
  self,
);
