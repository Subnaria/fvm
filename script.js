// ─── CONSTANTES ──────────────────────────────────────
const TENUE_PRIX  = 6400;
const IMPOTS_TAUX = 0.40; // 40%

// ─── ÉTAT ─────────────────────────────────────────────
const state = {
  argentBrut: 0,
  tenues: 0,
  // Chaque catégorie a un total cumulé + un historique d'ajouts
  produit: { total: 0, history: [] },
  pot:     { total: 0, history: [] },
  autre:   { total: 0, history: [] },
};

// ─── ÉLÉMENTS DOM ─────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── FORMAT ───────────────────────────────────────────
function fmt(n) {
  if (isNaN(n) || n === null) return '— €';
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (n < 0 ? '−' : '') + formatted + ' €';
}

// ─── CALCUL PRINCIPAL ─────────────────────────────────
function recalculate() {
  const brut   = state.argentBrut;
  const impots = brut * IMPOTS_TAUX;
  const net    = brut - impots; // 60% récupéré

  const depTenue   = state.tenues * TENUE_PRIX;
  const depProduit = state.produit.total;
  const depPot     = state.pot.total;
  const depAutre   = state.autre.total;
  const totalDep   = depTenue + depProduit + depPot + depAutre;

  const benef = net - totalDep;

  // Revenus
  $('impots').textContent    = fmt(impots);
  $('argentNet').textContent = fmt(net);

  // Dépenses totaux
  $('total-produit').textContent = fmt(depProduit);
  $('total-tenue').textContent   = fmt(depTenue);
  $('total-pot').textContent     = fmt(depPot);
  $('total-autre').textContent   = fmt(depAutre);
  $('grandTotalDepenses').textContent = fmt(totalDep);

  // Bénéfice
  const benefEl = $('benefMontant');
  const badgeEl = $('benefBadge');
  benefEl.textContent = fmt(benef);

  if (brut === 0 && totalDep === 0) {
    benefEl.className = 'benef-amount';
    badgeEl.textContent = '—';
    badgeEl.className = 'benef-badge';
  } else if (benef >= 0) {
    benefEl.className = 'benef-amount positive';
    badgeEl.textContent = '✓ Rentable';
    badgeEl.className = 'benef-badge badge-pos';
  } else {
    benefEl.className = 'benef-amount negative';
    badgeEl.textContent = '✗ Déficitaire';
    badgeEl.className = 'benef-badge badge-neg';
  }

  $('detailRevenu').textContent    = fmt(net);
  $('detailDepenses').textContent  = fmt(totalDep);

  // Barre de profit
  if (net > 0) {
    const ratio = Math.max(0, Math.min(1, benef / net));
    $('profitBar').style.width = (ratio * 100) + '%';
  } else {
    $('profitBar').style.width = '0%';
  }
}

// ─── MISE À JOUR AFFICHAGE CATÉGORIE ──────────────────
function updateCategoryDisplay(key) {
  const data = state[key];
  if (!data) return;

  $(`total-${key}`).textContent = fmt(data.total);

  const countEl = $(`count-${key}`);
  if (countEl) {
    countEl.textContent = data.history.length > 0
      ? `${data.history.length} ajout${data.history.length > 1 ? 's' : ''}`
      : '0 ajout(s)';
  }

  renderHistory(key);
}

// ─── HISTORIQUE ───────────────────────────────────────
function renderHistory(key) {
  const histEl = $(`history-${key}`);
  if (!histEl) return;
  const data = state[key];

  histEl.innerHTML = '';
  data.history.forEach((entry, index) => {
    const div = document.createElement('div');
    div.className = 'history-entry';
    div.innerHTML = `
      <span class="history-entry-label">${entry.label}</span>
      <span class="history-entry-val">${fmt(entry.amount)}</span>
      <button class="history-entry-del" data-key="${key}" data-index="${index}" title="Supprimer">×</button>
    `;
    histEl.appendChild(div);
  });

  // Écouter les suppressions
  histEl.querySelectorAll('.history-entry-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = btn.dataset.key;
      const i = parseInt(btn.dataset.index);
      const removed = state[k].history.splice(i, 1)[0];
      state[k].total = Math.max(0, state[k].total - removed.amount);
      updateCategoryDisplay(k);
      recalculate();
      triggerAutoSave();
      showToast(`↩ ${fmt(removed.amount)} supprimé`, 'red');
    });
  });
}

// ─── AJOUTER UNE DÉPENSE À UNE CATÉGORIE ─────────────
function addToCategory(key) {
  const inputEl = $(`input-${key}`);
  const amount = parseFloat(inputEl.value) || 0;
  if (amount <= 0) {
    showToast('Montant invalide', 'red');
    return;
  }

  const now = new Date();
  const label = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  state[key].history.push({ amount, label });
  state[key].total += amount;

  inputEl.value = '';
  updateCategoryDisplay(key);
  recalculate();
  triggerAutoSave();
  showToast(`+ ${fmt(amount)} ajouté`, 'blue');
}

// ─── DÉFINIR DIRECTEMENT LE TOTAL ─────────────────────
function setDirectTotal(key) {
  const editEl = $(`edit-${key}`);
  const amount = parseFloat(editEl.value);
  if (isNaN(amount) || amount < 0) {
    showToast('Montant invalide', 'red');
    return;
  }

  state[key].total = amount;
  state[key].history = [{ amount, label: 'Manuel' }];

  editEl.value = '';
  updateCategoryDisplay(key);
  recalculate();
  triggerAutoSave();
  showToast(`✓ Total défini à ${fmt(amount)}`, 'blue');
}

// ─── EVENTS REVENUS ───────────────────────────────────
$('argentBrut').addEventListener('input', () => {
  state.argentBrut = parseFloat($('argentBrut').value) || 0;
  recalculate();
  triggerAutoSave();
});

// ─── EVENTS BOUTONS AJOUTER ───────────────────────────
document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    addToCategory(btn.dataset.key);
  });
});

// Touche Entrée dans les inputs d'ajout
['produit', 'pot', 'autre'].forEach(key => {
  const inputEl = $(`input-${key}`);
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        addToCategory(key);
      }
    });
    inputEl.addEventListener('click', e => e.stopPropagation());
  }
});

// ─── EVENTS BOUTONS DÉFINIR ───────────────────────────
document.querySelectorAll('.btn-set').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setDirectTotal(btn.dataset.key);
  });
});

['produit', 'pot', 'autre'].forEach(key => {
  const editEl = $(`edit-${key}`);
  if (editEl) {
    editEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        setDirectTotal(key);
      }
    });
    editEl.addEventListener('click', e => e.stopPropagation());
    editEl.addEventListener('input', e => e.stopPropagation());
  }
});

// ─── EVENTS TENUES ────────────────────────────────────
$('tenueplus').addEventListener('click', (e) => {
  e.stopPropagation();
  state.tenues++;
  $('input-tenue').value = state.tenues;
  $('count-tenue').textContent = `${state.tenues} tenue${state.tenues > 1 ? 's' : ''}`;
  recalculate();
  triggerAutoSave();
});

$('tenueMoins').addEventListener('click', (e) => {
  e.stopPropagation();
  if (state.tenues > 0) {
    state.tenues--;
    $('input-tenue').value = state.tenues;
    $('count-tenue').textContent = `${state.tenues} tenue${state.tenues > 1 ? 's' : ''}`;
    recalculate();
    triggerAutoSave();
  }
});

$('input-tenue').addEventListener('input', (e) => {
  e.stopPropagation();
  const v = parseInt($('input-tenue').value) || 0;
  state.tenues = Math.max(0, v);
  $('input-tenue').value = state.tenues;
  $('count-tenue').textContent = `${state.tenues} tenue${state.tenues > 1 ? 's' : ''}`;
  recalculate();
  triggerAutoSave();
});

$('input-tenue').addEventListener('click', e => e.stopPropagation());

// Edit direct tenue
$('edit-tenue').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.stopPropagation();
    const amount = parseFloat($('edit-tenue').value);
    if (!isNaN(amount) && amount >= 0) {
      // Calculer le nombre de tenues équivalent
      state.tenues = Math.round(amount / TENUE_PRIX);
      $('input-tenue').value = state.tenues;
      $('count-tenue').textContent = `${state.tenues} tenue${state.tenues > 1 ? 's' : ''}`;
      $('edit-tenue').value = '';
      recalculate();
      triggerAutoSave();
      showToast(`✓ ${state.tenues} tenue(s) = ${fmt(state.tenues * TENUE_PRIX)}`, 'blue');
    }
  }
});
$('edit-tenue').addEventListener('click', e => e.stopPropagation());
$('edit-tenue').addEventListener('input', e => e.stopPropagation());

// ─── TOGGLE DÉPENSES ──────────────────────────────────
document.querySelectorAll('.depense-item').forEach(item => {
  const header = item.querySelector('.depense-header');
  header.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.depense-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) {
      item.classList.add('open');
      const input = item.querySelector('.depense-add-row input, .tenue-counter input');
      if (input) setTimeout(() => input.focus(), 120);
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
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

// ─── SAUVEGARDE ───────────────────────────────────────
const SAVE_KEY = 'fivem_compta_v2';
let autoSaveTimer = null;

function saveState() {
  const data = {
    argentBrut: state.argentBrut,
    tenues:     state.tenues,
    produit:    state.produit,
    pot:        state.pot,
    autre:      state.autre,
    savedAt:    new Date().toISOString(),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));

  const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const saveEl = $('saveStatus');
  $('saveStatusText').textContent = `Sauvegardé à ${heure}`;
  saveEl.classList.add('saved');
  setTimeout(() => saveEl.classList.remove('saved'), 2000);
}

function loadState() {
  // Essayer d'abord la clé v2, puis v1 pour migration
  let raw = localStorage.getItem(SAVE_KEY);
  let isLegacy = false;

  if (!raw) {
    raw = localStorage.getItem('fivem_compta_v1');
    isLegacy = !!raw;
  }
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    state.argentBrut = data.argentBrut || 0;
    state.tenues     = data.tenues     || 0;

    if (isLegacy) {
      // Migration depuis v1 : les dépenses étaient des nombres simples
      state.produit = { total: data.produit || 0, history: data.produit ? [{ amount: data.produit, label: 'Migré' }] : [] };
      state.pot     = { total: data.pot     || 0, history: data.pot     ? [{ amount: data.pot,     label: 'Migré' }] : [] };
      state.autre   = { total: data.autre   || 0, history: data.autre   ? [{ amount: data.autre,   label: 'Migré' }] : [] };
    } else {
      state.produit = data.produit || { total: 0, history: [] };
      state.pot     = data.pot     || { total: 0, history: [] };
      state.autre   = data.autre   || { total: 0, history: [] };
    }

    // Remplir les inputs
    $('argentBrut').value  = state.argentBrut || '';
    $('input-tenue').value = state.tenues;
    $('count-tenue').textContent = `${state.tenues} tenue${state.tenues > 1 ? 's' : ''}`;

    // Mettre à jour les displays des catégories
    ['produit', 'pot', 'autre'].forEach(key => updateCategoryDisplay(key));

    const savedAt = new Date(data.savedAt);
    const heure = savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const jour  = savedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    $('saveStatusText').textContent = `Dernière sauvegarde : ${jour} à ${heure}`;

    return true;
  } catch(e) {
    return false;
  }
}

function resetState() {
  if (!confirm('Remettre toutes les valeurs à zéro ?')) return;
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem('fivem_compta_v1');

  state.argentBrut = 0;
  state.tenues     = 0;
  state.produit    = { total: 0, history: [] };
  state.pot        = { total: 0, history: [] };
  state.autre      = { total: 0, history: [] };

  $('argentBrut').value  = '';
  $('input-tenue').value = 0;
  $('count-tenue').textContent = '0 tenue(s)';

  ['produit', 'pot', 'autre'].forEach(key => updateCategoryDisplay(key));
  $('saveStatusText').textContent = '—';
  $('saveStatus').classList.remove('saved');
  recalculate();
  showToast('↺ Données réinitialisées', 'red');
}

function triggerAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveState, 1000);
}

$('btnReset').addEventListener('click', resetState);

// ─── DATE FOOTER ──────────────────────────────────────
const now = new Date();
$('footerDate').textContent = now.toLocaleDateString('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

// ─── INIT ─────────────────────────────────────────────
const loaded = loadState();
recalculate();
if (loaded) showToast('✓ Données restaurées', 'green');
