"use strict";
const CACHE_NAME = "chanar-a-mano-shell-v5";
const CORE_FILES = ["./","./index.html","./styles.css","./datos.js","./app.js","./manifest.webmanifest","./marca-chanar.svg"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_FILES.map(async path => {
      try {
        const response = await fetch(path, { cache: "reload" });
        if (response && response.ok) await cache.put(path, response);
      } catch (_) {
        // Un archivo ausente no debe impedir guardar el resto de la guía.
      }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("chanar-a-mano-shell-") && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(new URL("./index.html", self.registration.scope), response.clone());
        }
        return response;
      } catch (_) {
        const cached = await caches.match(new URL("./index.html", self.registration.scope));
        return cached || new Response("Chañar a Mano no está disponible sin conexión todavía. Volvé a conectarte y abrí la guía una vez.", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return new Response("", {status:503,statusText:"Offline"});
    }
  })());
});
