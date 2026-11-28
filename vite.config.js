import { defineConfig, loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { offlineWorker } from './src/offline/sw-template.js';

// Pages HTML du site (application + pages légales + page d'erreur 404)
const PAGES = ['index', 'mentions-legales', 'confidentialite', 'cgu', '404'];
// Pages publiées dans le plan du site (la 404 n'y figure pas)
const SITEMAP = [
  { path: '/', priority: '1.0' },
  { path: '/mentions-legales', priority: '0.3' },
  { path: '/confidentialite', priority: '0.3' },
  { path: '/cgu', priority: '0.3' },
];

/** Génère robots.txt et sitemap.xml à partir de l'adresse du site (VITE_SITE_URL dans .env) */
function seoFiles(site) {
  return {
    name: 'ghost-seo-files',
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n` });
      this.emitFile({
        type: 'asset', fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SITEMAP.map((p) => `  <url>\n    <loc>${site}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`,
      });
    },
  };
}

/**
 * Mode hors connexion : génère sw.js (service worker) avec la liste de TOUS les fichiers du site.
 * À la première visite, le navigateur les enregistre ; ensuite Ghost fonctionne sans Internet.
 * Le numéro de version change dès qu'un fichier change, ce qui déclenche la mise à jour.
 */
function offlineFiles() {
  return {
    name: 'ghost-offline',
    enforce: 'post',
    generateBundle(_, bundle) {
      const hash = createHash('sha256');
      const files = [];
      for (const [name, item] of Object.entries(bundle)) {
        if (name.endsWith('.map') || name === 'robots.txt' || name === 'sitemap.xml') continue;
        files.push(name);
        hash.update(name).update(item.type === 'chunk' ? item.code : item.source);
      }
      for (const name of readdirSync('public')) {
        if (name === 'og-image.jpg') continue; // ne sert qu'aux aperçus sur les réseaux sociaux
        files.push(name);
        hash.update(name).update(readFileSync(`public/${name}`));
      }
      files.sort();
      const version = hash.digest('hex').slice(0, 12);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: offlineWorker(version, files) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const site = (env.VITE_SITE_URL || 'https://ghost-explorateur.vercel.app').replace(/\/$/, '');
  return {
    // '/' sur Vercel ; '/Ghost/' sur GitHub Pages (défini par le workflow de publication)
    base: env.VITE_BASE || '/',
    server: { host: true, port: 5173, open: false },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: { input: Object.fromEntries(PAGES.map((p) => [p, `${p}.html`])) },
    },
    plugins: [seoFiles(site), offlineFiles()],
  };
});
