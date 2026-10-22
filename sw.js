// Offline support: network first, cache as fallback, so updates show up right away.
const CACHE = 'bgmc-v4';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/app.js',
  'js/util.js',
  'js/settings.js',
  'js/i18n.js',
  'js/t2s-map.js',
  'js/speech.js',
  'js/sound.js',
  'js/runner.js',
  'js/fx.js',
  'js/content.js',
  'js/games/index.js',
  'js/games/words.js',
  'js/games/avalon.js',
  'js/games/cheese-thief.js',
  'js/games/werewolf.js',
  'js/games/one-night.js',
  'js/games/undercover.js',
  'js/games/secret-hitler.js',
  'js/games/insider.js',
  'js/games/spyfall.js',
  'js/games/werewords.js',
  'js/games/chameleon.js',
  'js/games/deception.js',
  'js/games/codenames.js',
  'js/games/fake-artist.js',
  'js/games/charades.js',
  'js/games/timer.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./'))),
  );
});
