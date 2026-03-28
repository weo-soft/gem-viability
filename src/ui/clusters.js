import { setGemIconSrc } from './icons.js';
import { getSupportsForActive, getActivesForSupport } from '../compatibility.js';
import { createWikiLink } from '../utils/wiki.js';
import {
  isActiveVariant,
  defaultVariantFilters as defaultFilters,
  ACTIVE_VARIANTS,
  filterIdsByVariantForActives,
  filterIdsByVariantForSupports,
} from './variant-filter-helpers.js';

export { isActiveVariant };

/** Render gem clusters by Int/Str/Dex with global variant filter checkboxes (normal, transfigured, vaal, awakened, trarthus, exceptional, legacy, recipeOnly). */
const STAT_ORDER = ['int', 'str', 'dex', 'white'];
const STAT_LABELS = { int: 'Intelligence', str: 'Strength', dex: 'Dexterity', white: 'White' };
export const STAT_COLORS = { int: '#3366cc', str: '#cc3333', dex: '#33cc33', white: '#999999' };
/** Order of stat counts on active gem chips (dex/int/str only). */
export const STAT_ORDER_COUNTS = ['dex', 'int', 'str'];
/** Order of stat counts on support gem chips (includes white active gems supportable). */
export const STAT_ORDER_COUNTS_SUPPORT = ['dex', 'int', 'str', 'white'];
const VARIANT_GROUPS = [
  {
    label: 'Active',
    options: [
      { key: 'normal', label: 'Normal' },
      { key: 'transfigured', label: 'Transfigured' },
      { key: 'vaal', label: 'Vaal' },
      { key: 'trarthus', label: 'Trarthus' },
    ],
  },
  {
    label: 'Support',
    options: [
      { key: 'normalSupport', label: 'Normal' },
      { key: 'awakened', label: 'Awakened' },
      { key: 'exceptional', label: 'Exceptional' },
    ],
  },
  {
    label: 'Others',
    options: [
      { key: 'legacy', label: 'Legacy' },
      { key: 'recipeOnly', label: 'Recipe-Only' },
    ],
  },
];

function noopVariantFilter() {}

export function renderGlobalVariantCheckboxes(variantFilters, onVariantFilterChange) {
  const wrap = document.createElement('div');
  wrap.className = 'variant-filters variant-filters-global';
  const filters = variantFilters || defaultFilters;
  for (const group of VARIANT_GROUPS) {
    const groupEl = document.createElement('div');
    groupEl.className = 'variant-filter-group';
    const groupLabel = document.createElement('span');
    groupLabel.className = 'variant-filter-group-label';
    groupLabel.textContent = group.label;
    groupEl.appendChild(groupLabel);
    const groupOptions = document.createElement('div');
    groupOptions.className = 'variant-filter-group-options';
    for (const { key, label } of group.options) {
      const labelEl = document.createElement('label');
      labelEl.className = 'variant-filter-label';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'variant-filter-cb';
      cb.dataset.variant = key;
      cb.checked = filters[key] !== false;
      cb.addEventListener('change', () => onVariantFilterChange(key, cb.checked));
      labelEl.appendChild(cb);
      labelEl.appendChild(document.createTextNode(` ${label}`));
      groupOptions.appendChild(labelEl);
    }
    groupEl.appendChild(groupOptions);
    wrap.appendChild(groupEl);
  }
  return wrap;
}

/** Filter active gems by active variant filters only (normal, transfigured, vaal, trarthus). */
function filterByVariantForActive(list, variantFilters) {
  const filters = variantFilters || defaultFilters;
  return list.filter((g) => {
    const v = g.variant || 'normal';
    if (!ACTIVE_VARIANTS.includes(v)) return true; // e.g. actives never have awakened
    if (filters[v] === false) return false;
    return true;
  });
}

/** Filter support gems by support variant filters only (normalSupport, awakened, exceptional, etc.). */
function filterByVariantForSupport(list, variantFilters) {
  const filters = variantFilters || defaultFilters;
  return list.filter((g) => {
    const v = g.variant || 'normal';
    if (g.exceptional && filters.exceptional === true) return true;
    if (v === 'normal') {
      if (filters.normalSupport === false) return false;
    } else if (filters[v] === false) {
      return false;
    }
    if (g.exceptional && filters.exceptional === false) return false;
    return true;
  });
}

/** Count ids by primary stat (int/str/dex/white). White actives are candidates for support gems. Uses Map for O(1) lookups. */
export function countByStat(gemById, ids) {
  const counts = { int: 0, str: 0, dex: 0, white: 0 };
  for (const id of ids) {
    const g = gemById.get(id);
    if (g && g.primaryStat && counts[g.primaryStat] !== undefined) {
      counts[g.primaryStat]++;
    }
  }
  return counts;
}

const PLACEHOLDER_COUNTS = { int: '—', str: '—', dex: '—', white: '—' };

function cacheSet(countsCache, kind, id, counts) {
  if (!countsCache) return;
  const map = kind === 'active' ? countsCache.active : countsCache.support;
  if (map && typeof map.set === 'function') map.set(id, counts);
}

function cacheGet(countsCache, kind, id) {
  if (!countsCache) return undefined;
  const map = kind === 'active' ? countsCache.active : countsCache.support;
  if (!map || typeof map.get !== 'function') return undefined;
  return map.get(id);
}

/**
 * @param {Object} counts
 * @param {HTMLElement} parent
 * @param {boolean} usePlaceholder
 * @param {string[]} [statOrder] - which stats to render; use STAT_ORDER_COUNTS_SUPPORT for support chips (includes white)
 */
function renderStatCountSpans(counts, parent, usePlaceholder = false, statOrder = STAT_ORDER_COUNTS) {
  const values = usePlaceholder ? PLACEHOLDER_COUNTS : counts;
  for (const stat of statOrder) {
    const n = values[stat] ?? (usePlaceholder ? '—' : 0);
    const span = document.createElement('span');
    span.className = 'gem-chip-count';
    span.dataset.stat = stat;
    span.textContent = String(n);
    span.style.color = STAT_COLORS[stat];
    parent.appendChild(span);
  }
}

/**
 * Update count spans in place. Used for async counter updates to avoid blocking the UI.
 * Only updates counts that actually changed (active or support, based on which variant was toggled).
 * @param {HTMLElement} clustersEl
 * @param {{ filteredGems: Array, fullGems: Array, variantFilters: Object, updateOnlyKind?: 'active'|'support' }} ctx
 */
export function updateClusterCountsInPlace(clustersEl, ctx) {
  const { filteredGems, fullGems, variantFilters, updateOnlyKind, countsCache } = ctx;
  const allGems = fullGems ?? filteredGems;
  const gemById = new Map(allGems.map((g) => [g.id, g]));
  const filters = variantFilters || defaultFilters;

  const supportsCache = new Map();
  const activesCache = new Map();

  const buttons = clustersEl.querySelectorAll('.gem-btn[data-gem-id][data-gem-kind]');
  for (const btn of buttons) {
    const kind = btn.dataset.gemKind;
    if (updateOnlyKind && kind !== updateOnlyKind) continue;

    const id = btn.dataset.gemId;
    const countWrap = btn.querySelector('.gem-chip-counts');
    if (!countWrap) continue;

    let counts;
    const statOrder = kind === 'support' ? STAT_ORDER_COUNTS_SUPPORT : STAT_ORDER_COUNTS;
    if (kind === 'active') {
      if (!supportsCache.has(id)) supportsCache.set(id, getSupportsForActive(id, allGems));
      const filteredIds = filterIdsByVariantForSupports(gemById, supportsCache.get(id), filters);
      counts = countByStat(gemById, filteredIds);
    } else {
      if (!activesCache.has(id)) activesCache.set(id, getActivesForSupport(id, allGems));
      const filteredIds = filterIdsByVariantForActives(gemById, activesCache.get(id), filters);
      counts = countByStat(gemById, filteredIds);
    }

    cacheSet(countsCache, kind, id, counts);

    for (const stat of statOrder) {
      const span = countWrap.querySelector(`[data-stat="${stat}"]`);
      if (span) span.textContent = String(counts[stat] ?? 0);
    }
  }
}

export function renderClusters(gems, onSelectGem, variantFilters, onVariantFilterChange, fullGems, options = {}) {
  const usePlaceholderForActiveCounts = options.usePlaceholderForActiveCounts === true;
  const usePlaceholderForSupportCounts = options.usePlaceholderForSupportCounts === true;
  const skipVariantFilters = options.skipVariantFilters === true;
  const countsCache = options.countsCache;
  const useCachedCountsOnly = options.useCachedCountsOnly === true;
  const container = document.createElement('div');
  container.className = 'gem-clusters';
  const allGems = fullGems ?? gems;

  if (!skipVariantFilters) {
    container.appendChild(renderGlobalVariantCheckboxes(variantFilters || defaultFilters, onVariantFilterChange || noopVariantFilter));
  }

  const gemById = new Map(allGems.map((g) => [g.id, g]));

  const byStat = { int: [], str: [], dex: [], white: [] };
  for (const g of gems) {
    const s = g.primaryStat || 'str';
    if (byStat[s]) byStat[s].push(g);
  }

  const filters = variantFilters || defaultFilters;

  const supportsCache = new Map();
  const activesCache = new Map();

  for (const stat of STAT_ORDER) {
    const list = byStat[stat];
    if (!list.length) continue;

    const section = document.createElement('section');
    section.className = 'cluster';
    section.setAttribute('data-stat', stat);
    section.style.borderLeftColor = STAT_COLORS[stat];

    const actives = filterByVariantForActive(list.filter((g) => g.kind === 'active'), filters);
    const supports = filterByVariantForSupport(list.filter((g) => g.kind === 'support'), filters);

    const heading = document.createElement('h2');
    heading.textContent = STAT_LABELS[stat];
    heading.style.color = STAT_COLORS[stat];
    section.appendChild(heading);

    if (actives.length) {
      const sub = document.createElement('div');
      sub.className = 'cluster-sub';
      const label = document.createElement('h3');
      label.textContent = 'Active';
      sub.appendChild(label);
      const ul = document.createElement('ul');
      ul.className = 'gem-list active-list';
      for (const g of actives) {
        let counts;
        const cached = cacheGet(countsCache, 'active', g.id);
        if (cached) {
          counts = cached;
        } else if (usePlaceholderForActiveCounts || useCachedCountsOnly) {
          counts = PLACEHOLDER_COUNTS;
        } else {
          if (!supportsCache.has(g.id)) supportsCache.set(g.id, getSupportsForActive(g.id, allGems));
          const supportIds = supportsCache.get(g.id);
          const filteredSupportIds = filterIdsByVariantForSupports(gemById, supportIds, filters);
          counts = countByStat(gemById, filteredSupportIds);
          cacheSet(countsCache, 'active', g.id, counts);
        }

        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gem-btn';
        btn.dataset.gemId = g.id;
        btn.dataset.gemKind = g.kind;

        const img = document.createElement('img');
        img.className = 'gem-icon';
        setGemIconSrc(img, g);
        img.alt = `${g.name} icon`;

        const span = document.createElement('span');
        span.className = 'gem-label';
        span.textContent = g.name;

        const wikiLink = createWikiLink(g.name, g.kind);
        wikiLink.addEventListener('click', (e) => e.stopPropagation());

        const countWrap = document.createElement('span');
        countWrap.className = 'gem-chip-counts';
        renderStatCountSpans(counts, countWrap, usePlaceholderForActiveCounts);
        btn.appendChild(img);
        btn.appendChild(span);
        btn.appendChild(wikiLink);
        btn.appendChild(countWrap);

        btn.addEventListener('click', () => onSelectGem(g.id, g.kind));
        li.appendChild(btn);
        ul.appendChild(li);
      }
      sub.appendChild(ul);
      section.appendChild(sub);
    }

    if (supports.length) {
      const sub = document.createElement('div');
      sub.className = 'cluster-sub';
      const label = document.createElement('h3');
      label.textContent = 'Support';
      sub.appendChild(label);
      const ul = document.createElement('ul');
      ul.className = 'gem-list support-list';
      for (const g of supports) {
        let counts;
        const cached = cacheGet(countsCache, 'support', g.id);
        if (cached) {
          counts = cached;
        } else if (usePlaceholderForSupportCounts || useCachedCountsOnly) {
          counts = PLACEHOLDER_COUNTS;
        } else {
          if (!activesCache.has(g.id)) activesCache.set(g.id, getActivesForSupport(g.id, allGems));
          const activeIds = activesCache.get(g.id);
          const filteredActiveIds = filterIdsByVariantForActives(gemById, activeIds, filters);
          counts = countByStat(gemById, filteredActiveIds);
          cacheSet(countsCache, 'support', g.id, counts);
        }

        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gem-btn';
        btn.dataset.gemId = g.id;
        btn.dataset.gemKind = g.kind;

        const img = document.createElement('img');
        img.className = 'gem-icon';
        setGemIconSrc(img, g);
        img.alt = `${g.name} icon`;

        const span = document.createElement('span');
        span.className = 'gem-label';
        span.textContent = g.name;

        const wikiLink = createWikiLink(g.name, g.kind);
        wikiLink.addEventListener('click', (e) => e.stopPropagation());

        const countWrap = document.createElement('span');
        countWrap.className = 'gem-chip-counts';
        renderStatCountSpans(counts, countWrap, usePlaceholderForSupportCounts, STAT_ORDER_COUNTS_SUPPORT);
        btn.appendChild(img);
        btn.appendChild(span);
        btn.appendChild(wikiLink);
        btn.appendChild(countWrap);

        btn.addEventListener('click', () => onSelectGem(g.id, g.kind));
        li.appendChild(btn);
        ul.appendChild(li);
      }
      sub.appendChild(ul);
      section.appendChild(sub);
    }

    container.appendChild(section);
  }

  return container;
}
