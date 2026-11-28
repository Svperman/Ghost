// Mode hors connexion : enregistrement du service worker et bandeau d'état de la connexion.
// Le service worker (sw.js, généré par vite.config.js) garde une copie de tout le site dans le
// navigateur : une fois Ghost ouvert une première fois, il fonctionne sans Internet.

const el = document.getElementById('net-status');
let hideTimer = 0;
let ready = false; // vrai quand tout le site est enregistré pour le hors connexion

function show(html, { tone = 'info', ms = 0, action = null } = {}) {
  if (!el) return;
  clearTimeout(hideTimer);
  el.className = `net-${tone}`;
  el.innerHTML = html;
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = action.label;
    b.onclick = action.run;
    el.appendChild(b);
  }
  el.hidden = false;
  if (ms) hideTimer = setTimeout(() => { el.hidden = true; }, ms);
}

function offlineMessage() {
  // Le message complet s'affiche quelques secondes, puis une pastille discrète reste tant qu'on est hors ligne
  show(`<b>📴 Hors connexion</b><span>${ready
    ? 'Ghost fonctionne sans Internet : tous les véhicules, moteurs et le crash test restent disponibles.'
    : 'Ce qui est déjà chargé reste utilisable. Ouvrez Ghost une fois avec Internet pour l\'avoir en entier hors connexion.'}</span>`, { tone: 'off' });
  hideTimer = setTimeout(() => { if (!navigator.onLine) show('<b>📴 Hors connexion</b>', { tone: 'off compact' }); }, 6000);
}

window.addEventListener('offline', offlineMessage);
window.addEventListener('online', () => show('<b>📶 Connexion rétablie</b>', { tone: 'on', ms: 3000 }));

async function register() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const hadController = !!navigator.serviceWorker.controller;
  ready = hadController;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Première installation : rien à recharger. Mise à jour demandée : on recharge une seule fois.
    if (hadController && !reloading) { reloading = true; location.reload(); }
  });
  let reg;
  try {
    reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
  } catch (err) {
    console.warn('Mode hors connexion indisponible :', err);
    return;
  }
  const offerUpdate = (worker) => show('<b>✨ Nouvelle version de Ghost</b><span>Elle est déjà téléchargée.</span>', {
    tone: 'info',
    action: { label: 'Mettre à jour', run: () => worker.postMessage('skipWaiting') },
  });
  const track = (worker) => {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state !== 'installed' && worker.state !== 'activated') return;
      if (hadController && worker.state === 'installed') offerUpdate(worker);
      if (!hadController && worker.state === 'activated') {
        ready = true;
        if (navigator.onLine) show('<b>✅ Ghost est prêt hors connexion</b><span>Vous pourrez l\'utiliser même sans Internet.</span>', { tone: 'on', ms: 5000 });
      }
    });
  };
  if (reg.waiting && hadController) offerUpdate(reg.waiting);
  track(reg.installing);
  reg.addEventListener('updatefound', () => track(reg.installing));
  if (reg.active && !hadController) ready = true;
}

register();
if (!navigator.onLine) offlineMessage();
