import { loadGems } from './data/loader.js';
import { renderClusters, renderGlobalVariantCheckboxes, updateClusterCountsInPlace, isActiveVariant } from './ui/clusters.js';
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
let searchQuery = '';

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

  function getGemsFilteredBySearch() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return gems;
    return gems.filter((g) => g.name.toLowerCase().includes(q));
  }

  function renderClustersSection(opts = {}) {
    const filteredGems = getGemsFilteredBySearch();
    const clustersEl = renderClusters(
      filteredGems,
      onSelectGem,
      variantFilters,
      onVariantFilterChange,
      gems,
      { ...opts, skipVariantFilters: true }
    );
    const existing = layout.querySelector('.gem-clusters');
    if (existing) layout.replaceChild(clustersEl, existing);
    else layout.appendChild(clustersEl);
    if (selectedGem) setSelectionVisual(clustersEl, selectedGem);
    const panelEl = document.getElementById('compat-panel');
    if (panelEl) updateCompatibilityPanel(selectedGem, gems, panelEl, variantFilters);

    if (opts.changedVariant) {
      const ctx = {
        filteredGems,
        fullGems: gems,
        variantFilters,
        updateOnlyKind: isActiveVariant(opts.changedVariant) ? 'support' : 'active',
      };
      const schedule = typeof requestIdleCallback !== 'undefined'
        ? (cb) => requestIdleCallback(cb, { timeout: 100 })
        : (cb) => setTimeout(cb, 0);
      schedule(() => {
        const el = layout.querySelector('.gem-clusters');
        if (el) updateClusterCountsInPlace(el, ctx);
      });
    }
  }

  function onVariantFilterChange(variant, checked) {
    variantFilters[variant] = checked;
    const opts = isActiveVariant(variant)
      ? { usePlaceholderForSupportCounts: true, changedVariant: variant }
      : { usePlaceholderForActiveCounts: true, changedVariant: variant };
    renderClustersSection(opts);
  }

  const stickyHeader = document.createElement('div');
  stickyHeader.className = 'sticky-header';

  const searchBar = document.createElement('div');
  searchBar.className = 'search-filter-bar';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'search-input';
  searchInput.placeholder = 'Search gem name...';
  searchInput.value = searchQuery;
  searchInput.autocomplete = 'off';
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderClustersSection();
  });
  searchBar.appendChild(searchInput);
  stickyHeader.appendChild(searchBar);

  const variantFiltersEl = renderGlobalVariantCheckboxes(variantFilters, onVariantFilterChange);
  stickyHeader.appendChild(variantFiltersEl);

  layout.insertBefore(stickyHeader, layout.firstChild);

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
