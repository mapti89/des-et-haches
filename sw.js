// Service worker de Dés & Haches : rend le jeu installable et jouable hors ligne.
// Réseau d'abord pour nos fichiers (les mises à jour arrivent tout de suite), cache en secours.
// Polices Google : cache d'abord. Change V pour purger les anciens caches.
const V = 'dh-v3';
const CORE = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const keep = (req, res) => { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)); return res; };

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Musiques : lues par morceaux (requêtes Range, réponses 206 que le cache refuse) : le navigateur s'en charge
  if (u.pathname.includes('/music/')) return;
  if (u.origin === location.origin) {
    e.respondWith(fetch(r)
      .then(res => res.ok ? keep(r, res) : res)
      .catch(() => caches.match(r, { ignoreSearch: true })
        .then(m => m || (r.mode === 'navigate' ? caches.match('./') : Response.error()))));
  } else if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => keep(r, res))));
  }
});
