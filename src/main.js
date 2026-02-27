import { loadGems } from './data/loader.js';
import { renderClusters } from './ui/clusters.js';
import { updateCompatibilityPanel, setSelectionVisual } from './ui/selection.js';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');

let gems = [];
let selectedGem = null;

const defaultVariantFilters = () => ({
  normal: true,
  transfigured: true,
  vaal: true,
  awakened: true,
  trarthus: true,
  exceptional: true,
});
let variantFilters = defaultVariantFilters();

function showError(message, canRetry = true) {
  app.innerHTML = '';
  const err = document.createElement('div');
  err.className = 'error-state';
  err.innerHTML = `<p><strong>Error</strong>: ${message}</p>`;
  if (canRetry) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => init());
    err.appendChild(retry);
  }
  app.appendChild(err);
}

function onSelectGem(id, kind) {
  selectedGem = { id, kind };
  const clustersEl = app.querySelector('.gem-clusters');
  const panelEl = document.getElementById('compat-panel');
  if (clustersEl) setSelectionVisual(clustersEl, selectedGem);
  if (panelEl) updateCompatibilityPanel(selectedGem, gems, panelEl, variantFilters);
}

async function init() {
  try {
    gems = await loadGems();
  } catch (e) {
    showError(e.message, true);
    return;
  }

  app.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'layout';

  function renderClustersSection() {
    const clustersEl = renderClusters(gems, onSelectGem, variantFilters, onVariantFilterChange);
    const existing = layout.querySelector('.gem-clusters');
    if (existing) layout.replaceChild(clustersEl, existing);
    else layout.insertBefore(clustersEl, layout.firstChild);
    if (selectedGem) setSelectionVisual(clustersEl, selectedGem);
    const panelEl = document.getElementById('compat-panel');
    if (panelEl) updateCompatibilityPanel(selectedGem, gems, panelEl, variantFilters);
  }

  function onVariantFilterChange(variant, checked) {
    variantFilters[variant] = checked;
    renderClustersSection();
  }

  renderClustersSection();

  const panel = document.createElement('aside');
  panel.className = 'compat-panel';
  panel.id = 'compat-panel';
  const panelPlaceholder = document.createElement('p');
  panelPlaceholder.className = 'panel-placeholder';
  panelPlaceholder.textContent = 'Select an active or support gem to see compatibility.';
  panel.appendChild(panelPlaceholder);
  layout.appendChild(panel);

  app.appendChild(layout);
}


init();
