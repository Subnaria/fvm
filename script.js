// ─── CONSTANTES ──────────────────────────────────────
const TENUE_PRIX = 6400;
const IMPOTS_TAUX = 0.5;

// ─── ÉTAT ─────────────────────────────────────────────
const state = {
  argentBrut: 0,
  tenues: 0,
  produit: 0,
  pot: 0,
  autre: 0,
};

// ─── ÉLÉMENTS DOM ─────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
  argentBrut:        $('argentBrut'),
  impots:            $('impots'),
  argentNet:         $('argentNet'),
  benefMontant:      $('benefMontant'),
  detailRevenu:      $('detailRevenu'),
  detailDepenses:    $('detailDepenses'),
  grandTotalDepenses:$('grandTotalDepenses'),
  inputProduit:      $('input-produit'),
  inputPot:          $('input-pot'),
  inputAutre:        $('input-autre'),
  inputTenue:        $('input-tenue'),
  totalProduit:      $('total-produit'),
  totalTenue:        $('total-tenue'),
  totalPot:          $('total-pot'),
  totalAutre:        $('total-autre'),
  tenueplus:         $('tenueplus'),
  tenueMoins:        $('tenueMoins'),
  footerDate:        $('footerDate'),
};

// ─── FORMAT ───────────────────────────────────────────
function fmt(n) {
  if (isNaN(n) || n === null) return '— €';
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (n < 0 ? '−' : '') + formatted + ' €';
}

// ─── CALCUL PRINCIPAL ─────────────────────────────────
function recalculate() {
  // Revenus
  const brut    = state.argentBrut;
  const impots  = brut * IMPOTS_TAUX;
  const net     = brut * IMPOTS_TAUX;

  // Dépenses
  const depTenue  = state.tenues * TENUE_PRIX;
  const depProduit= state.produit;
  const depPot    = state.pot;
  const depAutre  = state.autre;
  const totalDep  = depTenue + depProduit + depPot + depAutre;

  // Bénéfice
  const benef = net - totalDep;

  // ─── Affichage revenus
  els.impots.textContent    = fmt(impots);
  els.argentNet.textContent = fmt(net);

  // ─── Affichage dépenses
  els.totalProduit.textContent = fmt(depProduit);
  els.totalTenue.textContent   = fmt(depTenue);
  els.totalPot.textContent     = fmt(depPot);
  els.totalAutre.textContent   = fmt(depAutre);
  els.grandTotalDepenses.textContent = fmt(totalDep);

  // ─── Affichage bénéfice
  els.benefMontant.textContent  = fmt(benef);
  els.detailRevenu.textContent  = fmt(net);
  els.detailDepenses.textContent= fmt(totalDep);

  // Couleur bénéfice
  if (brut === 0 && totalDep === 0) {
    els.benefMontant.style.color = 'var(--text-muted)';
  } else if (benef >= 0) {
    els.benefMontant.style.color = 'var(--green)';
  } else {
    els.benefMontant.style.color = 'var(--red)';
  }
}

// ─── EVENTS REVENUS ───────────────────────────────────
els.argentBrut.addEventListener('input', () => {
  state.argentBrut = parseFloat(els.argentBrut.value) || 0;
  recalculate();
});

// ─── EVENTS DÉPENSES ──────────────────────────────────
els.inputProduit.addEventListener('input', () => {
  state.produit = parseFloat(els.inputProduit.value) || 0;
  recalculate();
});

els.inputPot.addEventListener('input', () => {
  state.pot = parseFloat(els.inputPot.value) || 0;
  recalculate();
});

els.inputAutre.addEventListener('input', () => {
  state.autre = parseFloat(els.inputAutre.value) || 0;
  recalculate();
});

// ─── EVENTS TENUES ────────────────────────────────────
els.tenueplus.addEventListener('click', (e) => {
  e.stopPropagation();
  state.tenues++;
  els.inputTenue.value = state.tenues;
  recalculate();
});

els.tenueMoins.addEventListener('click', (e) => {
  e.stopPropagation();
  if (state.tenues > 0) {
    state.tenues--;
    els.inputTenue.value = state.tenues;
    recalculate();
  }
});

els.inputTenue.addEventListener('input', (e) => {
  e.stopPropagation();
  const v = parseInt(els.inputTenue.value) || 0;
  state.tenues = Math.max(0, v);
  els.inputTenue.value = state.tenues;
  recalculate();
});

els.inputTenue.addEventListener('click', (e) => {
  e.stopPropagation();
});

// ─── TOGGLE DÉPENSES (click sur header) ───────────────
document.querySelectorAll('.depense-item').forEach(item => {
  const header = item.querySelector('.depense-header');
  header.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // Fermer tous
    document.querySelectorAll('.depense-item').forEach(i => i.classList.remove('open'));
    // Ouvrir si c'était fermé
    if (!isOpen) {
      item.classList.add('open');
      // Focus sur le premier input
      const input = item.querySelector('input');
      if (input) setTimeout(() => input.focus(), 100);
    }
  });
});

// ─── TOAST ────────────────────────────────────────────
const toastEl = $('toast');
let toastTimer = null;

function showToast(msg, type = 'green') {
  toastEl.textContent = msg;
  toastEl.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}

// ─── SAUVEGARDE ───────────────────────────────────────
const SAVE_KEY = 'fivem_compta_v1';
const saveStatusEl = $('saveStatus');
let autoSaveTimer = null;

function saveState() {
  const data = {
    ...state,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));

  // Affichage status
  const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  saveStatusEl.textContent = `Sauvegardé à ${heure}`;
  saveStatusEl.classList.add('saved');
  setTimeout(() => saveStatusEl.classList.remove('saved'), 2000);

  showToast('✓ Sauvegarde automatique', 'green');
}

function loadState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    state.argentBrut = data.argentBrut || 0;
    state.tenues     = data.tenues     || 0;
    state.produit    = data.produit    || 0;
    state.pot        = data.pot        || 0;
    state.autre      = data.autre      || 0;

    // Remplir les inputs
    els.argentBrut.value  = state.argentBrut || '';
    els.inputProduit.value = state.produit   || '';
    els.inputPot.value     = state.pot       || '';
    els.inputAutre.value   = state.autre     || '';
    els.inputTenue.value   = state.tenues;

    // Status
    const savedAt = new Date(data.savedAt);
    const heure = savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const jour  = savedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    saveStatusEl.textContent = `Dernière sauvegarde : ${jour} à ${heure}`;

    return true;
  } catch(e) {
    return false;
  }
}

function resetState() {
  if (!confirm('Remettre toutes les valeurs à zéro ?')) return;
  localStorage.removeItem(SAVE_KEY);
  state.argentBrut = 0;
  state.tenues     = 0;
  state.produit    = 0;
  state.pot        = 0;
  state.autre      = 0;
  els.argentBrut.value   = '';
  els.inputProduit.value = '';
  els.inputPot.value     = '';
  els.inputAutre.value   = '';
  els.inputTenue.value   = 0;
  saveStatusEl.textContent = '—';
  recalculate();
  showToast('↺ Données réinitialisées', 'red');
}

// Auto-save 1s après chaque modification
function triggerAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveState, 1000);
}

// Brancher l'auto-save sur tous les inputs
[els.argentBrut, els.inputProduit, els.inputPot, els.inputAutre, els.inputTenue].forEach(input => {
  input.addEventListener('input', triggerAutoSave);
});
els.tenueplus.addEventListener('click',  triggerAutoSave);
els.tenueMoins.addEventListener('click', triggerAutoSave);

// Bouton reset
$('btnReset').addEventListener('click', resetState);

// ─── DATE FOOTER ──────────────────────────────────────
const now = new Date();
els.footerDate.textContent = now.toLocaleDateString('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

// ─── INIT ─────────────────────────────────────────────
const loaded = loadState();
recalculate();
if (loaded) showToast('✓ Données restaurées', 'green');
