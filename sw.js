const CACHE_NAME = "als-facial-aac-v0.2.1-ios2";
const SCOPE_URL = new URL(self.registration.scope);
const INDEX_URL = new URL("index.html", SCOPE_URL).toString();
const ROOT_URL = SCOPE_URL.toString();

const CORE_ASSETS = [
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "mediapipe/models/face_landmarker.task",
  "mediapipe/wasm/vision_wasm_internal.js",
  "mediapipe/wasm/vision_wasm_internal.wasm",
  "mediapipe/wasm/vision_wasm_module_internal.js",
  "mediapipe/wasm/vision_wasm_module_internal.wasm",
  "mediapipe/wasm/vision_wasm_nosimd_internal.js",
  "mediapipe/wasm/vision_wasm_nosimd_internal.wasm",
];

function scopedUrl(path) {
  return new URL(path, SCOPE_URL).toString();
}

function unique(items) {
  return Array.from(new Set(items));
}

function assetsFromHtml(html) {
  const assetUrls = [];
  const pattern = /\b(?:href|src)="([^"]+)"/g;
  let match = pattern.exec(html);

  while (match) {
    const url = match[1];
    if (url.startsWith("assets/") || url.startsWith("./assets/") || url.startsWith("/assets/")) {
      assetUrls.push(scopedUrl(url.replace(/^\.\//, "").replace(/^\//, "")));
      match = pattern.exec(html);
      continue;
    }

    try {
      const assetUrl = new URL(url, SCOPE_URL);
      if (assetUrl.origin === SCOPE_URL.origin && assetUrl.pathname.includes("/assets/")) {
        assetUrls.push(assetUrl.toString());
      }
    } catch (error) {
      // Ignore malformed URLs in generated HTML.
    }
    match = pattern.exec(html);
  }

  return assetUrls;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const indexResponse = await fetch(INDEX_URL, { cache: "no-cache" });
        const indexHtml = await indexResponse.clone().text();
        await cache.put(INDEX_URL, indexResponse.clone());
        await cache.put(ROOT_URL, indexResponse);
        await cache.addAll(unique([...CORE_ASSETS.map(scopedUrl), ...assetsFromHtml(indexHtml)]));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(INDEX_URL, responseToCache));
          return networkResponse;
        })
        .catch(() => caches.match(INDEX_URL)),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return networkResponse;
      })
      .catch(() => caches.match(request)),
  );
});
