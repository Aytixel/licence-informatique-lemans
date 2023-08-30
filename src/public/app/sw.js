const cache_name = "licence-info-v2";

addEventListener("install", (event) => {
  event.waitUntil((async () => {
    return (await caches.open(cache_name)).addAll([
      "/",
      "/index.htm",
      "/css/font.css",
      "/css/palette.css",
      "/css/index.css",
      "/js/component.js",
      "/js/index.js",
      "/js/izly.js",
      "/js/scroll.js",
      "/js/scroll-snap.js",
      "/site.webmanifest",
      "/android-chrome-192x192.png",
      "/android-chrome-512x512.png",
      "/maskable-android-chrome-192x192.png",
      "/maskable-android-chrome-512x512.png",
      "/apple-touch-icon.png",
      "/favicon-16x16.png",
      "/favicon-32x32.png",
      "/favicon.ico",
      "/resource/font/edosz.woff",
      "/resource/font/edosz.woff2",
      "/resource/font/Marianne-Bold.woff",
      "/resource/font/Marianne-Bold.woff2",
      "/resource/font/Marianne-Regular.woff",
      "/resource/font/Marianne-Regular.woff2",
      "https://api.licence-informatique-lemans.tk/v2/planning-resources-name.json",
      "https://api.licence-informatique-lemans.tk/v2/planning-resources-type.json",
      "https://unpkg.com/mol_time_all/web.js",
      "https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js",
      "https://cdn.jsdelivr.net/npm/@alpinejs/mask@3.13.0/dist/cdn.min.js",
      "https://cdn.jsdelivr.net/npm/@alpinejs/persist@3.13.0/dist/cdn.min.js",
    ]);
  })());
});

addEventListener("fetch", (event) => {
  event.respondWith((async () => {
    const cache = await caches.open(cache_name);

    try {
      const response = await fetch(event.request);

      if (await cache.delete(event.request)) {
        await cache.put(event.request, response.clone());
      }

      return response;
    } catch {
      return await cache.match(
        event.request,
        { ignoreSearch: true },
      ) || new Response(null, { status: 404 });
    }
  })());
});
