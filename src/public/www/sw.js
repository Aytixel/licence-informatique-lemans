importScripts("https://arc.io/arc-sw-core.js");

const cacheName = "licence-info";
const filesToCache = [
  "/",
  "/index.htm",
  "/socials.htm",
  "/css/fonts.css",
  "/css/global.css",
  "/css/index.css",
  "/css/socials.css",
  "/js/index.js",
  "/js/cookie.js",
  "/js/js.cookie.min.js",
  "/js/analytics.js",
  "/resource/font/edosz.woff",
  "/resource/font/edosz.woff2",
  "/resource/font/louis_george_cafe.woff",
  "/resource/font/louis_george_cafe.woff2",
  "/resource/img/banner.jpg",
  "/resource/img/cookies.png",
  "/resource/img/logo.svg",
  "/resource/img/wave.svg",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache);
    }),
  );
});

self.addEventListener("fetch", function (e) {
  e.respondWith(
    caches.match(e.request).then(function (response) {
      return response || fetch(e.request);
    }),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (cacheName.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    }),
  );
});
