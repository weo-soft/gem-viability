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
  normalSupport: true,
  awakened: true,
  trarthus: true,
  exceptional: true,
  legacy: true,
  recipeOnly: true,
});
let variantFilters = defaultVariantFilters();
let searchQuery = '';
let searchFilteredGems = [];

const ACTIVE_COUNTS_FILTER_KEYS = ['normalSupport', 'awakened', 'exceptional', 'legacy', 'recipeOnly'];
const SUPPORT_COUNTS_FILTER_KEYS = ['normal', 'transfigured', 'vaal', 'trarthus'];
function makeCountsKey(filters, keys) {
  return keys.map((k) => (filters?.[k] === false ? '0' : '1')).join('');
}

const SEARCH_DEBOUNCE_MS = 150;
let searchDebounceTimer = null;
let searchRunId = 0;

function nextFrame() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

function scheduleIdle(cb) {
  if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(cb, { timeout: 150 });
  else setTimeout(cb, 0);
}

async function filterGemsBySearchAsync(all, query, runId) {
  const q = query.trim().toLowerCase();
  if (!q) return all;

  const result = [];
  const CHUNK = 750;
  for (let i = 0; i < all.length; i += CHUNK) {
    if (runId !== searchRunId) return null;
    const end = Math.min(i + CHUNK, all.length);
    for (let j = i; j < end; j++) {
      const g = all[j];
      const nameLower = g.nameLower ?? g.name?.toLowerCase?.() ?? '';
      if (nameLower.includes(q)) result.push(g);
    }
    await nextFrame();
  }
  return result;
}

function showError(message, canRetry = true) {
  app.replaceChildren();
  const err = document.createElement('div');
  err.className = 'error-state';
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = 'Error';
  p.appendChild(strong);
  p.appendChild(document.createTextNode(`: ${message}`));
  err.appendChild(p);
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
  if (selectedGem && selectedGem.id === id && selectedGem.kind === kind) {
    selectedGem = null;
  } else {
    selectedGem = { id, kind };
  }
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

  // Precompute lowercase names so filtering never allocates on each keystroke.
  for (const g of gems) {
    if (typeof g.name === 'string' && typeof g.nameLower !== 'string') g.nameLower = g.name.toLowerCase();
  }
  searchFilteredGems = gems;

  // Cache chip counters so searching never recomputes them.
  const countsCache = {
    activeKey: makeCountsKey(variantFilters, ACTIVE_COUNTS_FILTER_KEYS),
    supportKey: makeCountsKey(variantFilters, SUPPORT_COUNTS_FILTER_KEYS),
    active: new Map(),
    support: new Map(),
  };

  app.replaceChildren();

  const layout = document.createElement('div');
  layout.className = 'layout';

  function renderClustersSection(opts = {}) {
    const filteredGems = opts.filteredGems ?? searchFilteredGems ?? gems;
    const clustersEl = renderClusters(
      filteredGems,
      onSelectGem,
      variantFilters,
      onVariantFilterChange,
      gems,
      {
        usePlaceholderForActiveCounts: opts.usePlaceholderForActiveCounts === true,
        usePlaceholderForSupportCounts: opts.usePlaceholderForSupportCounts === true,
        countsCache,
        useCachedCountsOnly: opts.useCachedCountsOnly === true,
        skipVariantFilters: true,
      }
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
        countsCache,
        updateOnlyKind: opts.changedVariant
          ? (isActiveVariant(opts.changedVariant) ? 'support' : 'active')
          : undefined,
      };
      scheduleIdle(() => {
        const el = layout.querySelector('.gem-clusters');
        if (el) updateClusterCountsInPlace(el, ctx);
      });
    }
  }

  function onVariantFilterChange(variant, checked) {
    variantFilters[variant] = checked;
    if (isActiveVariant(variant)) {
      const nextSupportKey = makeCountsKey(variantFilters, SUPPORT_COUNTS_FILTER_KEYS);
      if (nextSupportKey !== countsCache.supportKey) {
        countsCache.supportKey = nextSupportKey;
        countsCache.support.clear();
      }
    } else {
      const nextActiveKey = makeCountsKey(variantFilters, ACTIVE_COUNTS_FILTER_KEYS);
      if (nextActiveKey !== countsCache.activeKey) {
        countsCache.activeKey = nextActiveKey;
        countsCache.active.clear();
      }
    }
    const opts = isActiveVariant(variant)
      ? { usePlaceholderForSupportCounts: true, changedVariant: variant, useCachedCountsOnly: true }
      : { usePlaceholderForActiveCounts: true, changedVariant: variant, useCachedCountsOnly: true };
    renderClustersSection(opts);
  }

  const stickyHeader = document.createElement('div');
  stickyHeader.className = 'sticky-header';

  const searchBar = document.createElement('div');
  searchBar.className = 'search-filter-bar';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'search-input';
  searchInput.setAttribute('aria-label', 'Filter gems by name');
  searchInput.placeholder = 'Search gem name...';
  searchInput.value = searchQuery;
  searchInput.autocomplete = 'off';
  searchInput.addEventListener('input', () => {
    const raw = searchInput.value;
    if (searchDebounceTimer) globalThis.clearTimeout(searchDebounceTimer);
    searchInput.classList.add('is-filtering');
    const runId = ++searchRunId;
    searchDebounceTimer = setTimeout(async () => {
      // If a newer keystroke happened, drop this run.
      if (runId !== searchRunId) return;
      searchQuery = raw;

      const filtered = await filterGemsBySearchAsync(gems, searchQuery, runId);
      if (runId !== searchRunId || filtered === null) return;
      searchFilteredGems = filtered;

      renderClustersSection({
        filteredGems: searchFilteredGems,
        // Searching should never recompute chip counts; reuse cache only.
        useCachedCountsOnly: true,
      });

      // Remove busy state once the DOM update is committed.
      await nextFrame();
      if (runId === searchRunId) searchInput.classList.remove('is-filtering');
    }, SEARCH_DEBOUNCE_MS);
  });
  searchBar.appendChild(searchInput);
  stickyHeader.appendChild(searchBar);

  const variantFiltersEl = renderGlobalVariantCheckboxes(variantFilters, onVariantFilterChange);
  stickyHeader.appendChild(variantFiltersEl);

  layout.insertBefore(stickyHeader, layout.firstChild);

  renderClustersSection({ filteredGems: searchFilteredGems });

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
