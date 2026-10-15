self.addEventListener("push", (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json() || {};
    } catch (error) {
      console.error("Unable to parse push notification payload:", error);
    }
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    payload = {};
  }

  const title =
    typeof payload.title === "string" && payload.title
      ? payload.title
      : "GitHub Analytics";
  const body =
    typeof payload.body === "string" && payload.body
      ? payload.body
      : "You have a new alert.";
  const url = typeof payload.url === "string" ? payload.url : "/";
  const tag =
    typeof payload.tag === "string" && payload.tag
      ? payload.tag
      : "github-analytics-alert";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: url || "/" },
      tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationUrl = event.notification.data?.url || "/";
  event.waitUntil(
    (async () => {
      let targetUrl;
      try {
        targetUrl = new URL(notificationUrl, self.location.origin);
      } catch (error) {
        console.error("Invalid notification destination:", error);
        targetUrl = new URL("/", self.location.origin);
      }
      if (targetUrl.origin !== self.location.origin) {
        targetUrl.href = self.location.origin + "/";
      }

      try {
        const windowClients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        for (const client of windowClients) {
          if (client.url === targetUrl.href) {
            return client.focus();
          }
          if (new URL(client.url).origin === self.location.origin) {
            try {
              await client.navigate(targetUrl.href);
              return client.focus();
            } catch (error) {
              console.error("Unable to navigate an open notification client:", error);
            }
          }
        }
      } catch (error) {
        console.error("Unable to find an open notification client:", error);
      }

      if (self.clients.openWindow) {
        try {
          return await self.clients.openWindow(targetUrl.href);
        } catch (error) {
          console.error("Unable to open notification destination:", error);
        }
      }
    })(),
  );
});
