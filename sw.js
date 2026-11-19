"use strict";

/* Cada versión de la estructura local debe cambiar este identificador. */
const CACHE_NAME = "chanar-a-mano-shell-v17";
const CORE_FILES = [
  "./index.html",
  "./styles.css",
  "./datos.js",
  "./app.js",
  "./manifest.webmanifest",
  "./marca-chanar.svg"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // La instalación es completa o falla: no activamos una caché incompleta.
    const responses = await Promise.all(CORE_FILES.map(async path => {
      const response = await fetch(path, { cache: "reload" });
      if (!response.ok) throw new Error("No se pudo actualizar el recurso: " + path);
      return [path, response];
    }));
    await Promise.all(responses.map(([path, response]) => cache.put(path, response)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(name => name.startsWith("chanar-a-mano-shell-") && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );
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
          await cache.put("./index.html", response.clone());
        }
        return response;
      } catch (_) {
        const cached = await caches.match("./index.html");
        return cached || new Response(
          "Chañar a Mano todavía no está disponible sin conexión. Conectate y abrí la guía una vez.",
          { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      }
    })());
    return;
  }

  // Los archivos de la aplicación se sirven desde la caché versionada.
  // El service worker nuevo instala todos los recursos antes de activarse.
  const isCoreAsset = CORE_FILES.some(path => new URL(path, self.registration.scope).href === requestUrl.href);
  if (isCoreAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        return await fetch(request);
      } catch (_) {
        return new Response("", { status: 503, statusText: "Offline" });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch (_) {
      const cached = await caches.match(request);
      return cached || new Response("", { status: 503, statusText: "Offline" });
    }
  })());
});
