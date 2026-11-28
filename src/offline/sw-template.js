// Modèle du service worker de Ghost (mode hors connexion).
// Ce fichier est lu au moment de la construction (vite build) : la fonction renvoie le texte de sw.js.

/** @param {string} version identifiant de version  @param {string[]} files fichiers du site (chemins relatifs) */
export function offlineWorker(version, files) {
  return `// Ghost – service worker (généré automatiquement, ne pas modifier)
// Enregistre tout le site dans le navigateur pour qu'il fonctionne sans Internet.
const VERSION = ${JSON.stringify(version)};
const FILES = ${JSON.stringify(files)};
const CACHE = 'ghost-' + VERSION;
const BASE = new URL('./', self.location).href;
const NET_TIMEOUT = 4000; // au-delà, une connexion trop lente est traitée comme absente

// Copie une réponse sans son marqueur de redirection (Vercel redirige « cgu.html » vers « cgu »)
const clean = (res) => (res.redirected ? new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers }) : res);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const results = await Promise.allSettled(FILES.map(async (f) => {
      const res = await fetch(BASE + f, { cache: 'reload' });
      if (!res.ok) throw new Error(f + ' : ' + res.status);
      await cache.put(BASE + f, clean(res));
    }));
    // La page principale et son code sont indispensables ; un fichier secondaire manquant n'empêche pas l'installation
    const failed = results.map((r, i) => (r.status === 'rejected' ? FILES[i] : null)).filter(Boolean);
    if (failed.includes('index.html') || failed.some((f) => /^assets\\/index-.*\\.js$/.test(f))) throw new Error('Mise en cache incomplète : ' + failed.join(', '));
    // Pas de remplacement automatique : une page déjà ouverte garde sa version jusqu'à ce que
    // l'utilisateur clique sur « Mettre à jour » (message 'skipWaiting')
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('ghost-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Page demandée → fichier HTML enregistré (« /cgu » → « cgu.html », « / » → « index.html »)
function pageFor(url) {
  const rel = decodeURIComponent(url.pathname.slice(new URL(BASE).pathname.length)).replace(/\\/$/, '');
  if (!rel) return 'index.html';
  return rel.endsWith('.html') ? rel : rel + '.html';
}

async function fromNetwork(request) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), NET_TIMEOUT);
  try { return await fetch(request, { signal: ctrl.signal }); } finally { clearTimeout(timer); }
}

async function page(request, url) {
  const cache = await caches.open(CACHE);
  try {
    // En ligne : la version la plus récente de la page (elle sert aussi à détecter les mises à jour)
    // (elle n'est pas enregistrée : la copie hors connexion doit rester assortie aux fichiers de CETTE version)
    return await fromNetwork(request);
  } catch {
    return (await cache.match(BASE + pageFor(url), { ignoreVary: true })) || (await cache.match(BASE + '404.html')) || (await cache.match(BASE + 'index.html')) || Response.error();
  }
}

async function file(request, url) {
  const cache = await caches.open(CACHE);
  // Recherche dans toutes les versions enregistrées (une page ouverte avant une mise à jour en a besoin)
  const hit = await caches.match(request, { ignoreSearch: true, ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(request);
  // Les fichiers « assets/ » portent une empreinte dans leur nom : on peut les garder sans limite
  if (res.ok && url.pathname.includes('/assets/')) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Seul le site lui-même est concerné (la mesure d'audience, elle, ne fonctionne qu'en ligne)
  if (url.origin !== self.location.origin || !url.href.startsWith(BASE) || url.pathname.includes('/_vercel/')) return;
  event.respondWith(request.mode === 'navigate' ? page(request, url) : file(request, url));
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
  if (event.data === 'version') event.source?.postMessage({ type: 'version', version: VERSION, files: FILES.length });
});
`;
}
