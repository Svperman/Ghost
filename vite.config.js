import { defineConfig, loadEnv } from 'vite';

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const site = (env.VITE_SITE_URL || 'https://ghost-explorateur.vercel.app').replace(/\/$/, '');
  return {
    base: '/',
    server: { host: true, port: 5173, open: false },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: { input: Object.fromEntries(PAGES.map((p) => [p, `${p}.html`])) },
    },
    plugins: [seoFiles(site)],
  };
});
