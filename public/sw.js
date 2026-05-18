/* eslint-disable */
// Service worker for revers-mf (Weight Trend Tracker)
// Strategy:
//   - Precache the offline shell + PWA icons + manifest.
//   - Cache-first for immutable `/_next/static/*` build assets.
//   - Network-only for everything else (Server Actions, auth, Prisma reads must always go live).
//   - On a navigation failure (offline), fall back to /offline.html.

const VERSION = "v1";
const PRECACHE = `revers-mf-precache-${VERSION}`;
const RUNTIME = `revers-mf-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
  "/apple-icon.png",
  "/favicon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticBuildAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isSameOriginGet(request, url) {
  return (
    request.method === "GET" &&
    url.origin === self.location.origin &&
    !url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/_next/data/") &&
    !url.pathname.startsWith("/_next/image")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GETs. POSTs, Server Actions, auth, etc. pass through unmodified.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Cache-first for immutable build assets.
  if (isStaticBuildAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            if (response.ok) {
              caches.open(RUNTIME).then((c) => c.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Precached static files (icons, manifest, offline shell): cache-first.
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((c) => c || fetch(request)));
    return;
  }

  // Navigations: network-first, fall back to offline shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match("/offline.html");
        return (
          offline ||
          new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        );
      }),
    );
    return;
  }

  // Everything else (RSC payloads, dynamic data, etc.) passes through unaltered.
  if (isSameOriginGet(request, url)) {
    event.respondWith(fetch(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
