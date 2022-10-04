const cache_name = "licence-info-v2";

addEventListener("install", (event) => {
  event.waitUntil((async () => {
    return (await caches.open(cache_name)).addAll([
      "/",
      "/index.htm",
      "/css/font.css",
      "/css/palette.css",
      "/css/index.css",
      "/js/index.js",
      "/site.webmanifest",
      "/android-chrome-192x192.png",
      "/android-chrome-512x512.png",
      "/maskable-android-chrome-192x192.png",
      "/maskable-android-chrome-512x512.png",
      "/apple-touch-icon.png",
      "/favicon-16x16.png",
      "/favicon-32x32.png",
      "/favicon.ico",
    ]);
  })());
});

addEventListener("fetch", (event) => {
  event.respondWith((async () => {
    const cache = await caches.open(cache_name);

    try {
      const response = await fetch(event.request);

      if (await cache.delete(event.request)) {
        await cache.add(event.request);
      }

      return response;
    } catch (_) {
      return await cache.match(
        event.request,
      ) || new Response(null, { status: 404 });
    }
  })());
});
