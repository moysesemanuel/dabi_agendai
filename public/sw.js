self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload;

  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Novo agendamento", body: event.data.text(), url: "/admin/agenda" };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Novo agendamento", {
      body: payload.body ?? "",
      icon: "/logo-icon.svg",
      badge: "/logo-icon.svg",
      data: { url: payload.url ?? "/admin/agenda" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/admin/agenda";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
