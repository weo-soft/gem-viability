import { getGemIconUrl } from './icons.js';
import { getSupportsForActive, getActivesForSupport } from '../compatibility.js';
import { createWikiLink } from '../utils/wiki.js';

/** Render gem clusters by Int/Str/Dex with global variant filter checkboxes (normal, transfigured, vaal, awakened, trarthus). */
const STAT_ORDER = ['int', 'str', 'dex'];
const STAT_LABELS = { int: 'Intelligence', str: 'Strength', dex: 'Dexterity' };
const STAT_COLORS = { int: '#3366cc', str: '#cc3333', dex: '#33cc33' };
const STAT_ORDER_COUNTS = ['dex', 'str', 'int']; // Green, Red, Blue
const VARIANT_OPTIONS = [
  { key: 'normal', label: 'Normal' },
  { key: 'transfigured', label: 'Transfigured' },
  { key: 'vaal', label: 'Vaal' },
  { key: 'awakened', label: 'Awakened' },
  { key: 'trarthus', label: 'Trarthus' },
  { key: 'exceptional', label: 'Exceptional' },
];

const defaultFilters = { normal: true, transfigured: true, vaal: true, awakened: true, trarthus: true, exceptional: true };

/** Variants that apply to active gems only. Toggling these affects which actives are shown and support gem counts. */
const ACTIVE_VARIANTS = ['normal', 'transfigured', 'vaal', 'trarthus'];

function noopVariantFilter() {}

function renderGlobalVariantCheckboxes(variantFilters, onVariantFilterChange) {
  const wrap = document.createElement('div');
  wrap.className = 'variant-filters variant-filters-global';
  const filters = variantFilters || defaultFilters;
  for (const { key, label } of VARIANT_OPTIONS) {
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
    wrap.appendChild(labelEl);
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

/** Filter support gems by support variant filters only (normal, awakened, exceptional). */
function filterByVariantForSupport(list, variantFilters) {
  const filters = variantFilters || defaultFilters;
  return list.filter((g) => {
    const v = g.variant || 'normal';
    if (filters[v] === false) return false;
    if (g.exceptional && filters.exceptional === false) return false;
    return true;
  });
}

/** Filter active gem ids by active variant filters only. Uses Map for O(1) lookups. */
function filterIdsByVariantForActives(gemById, ids, variantFilters) {
  const filters = variantFilters || defaultFilters;
  return ids.filter((id) => {
    const g = gemById.get(id);
    if (!g) return false;
    const v = g.variant || 'normal';
    if (!ACTIVE_VARIANTS.includes(v)) return true;
    if (filters[v] === false) return false;
    return true;
  });
}

/** Filter support gem ids by support variant filters only. Uses Map for O(1) lookups. */
function filterIdsByVariantForSupports(gemById, ids, variantFilters) {
  const filters = variantFilters || defaultFilters;
  return ids.filter((id) => {
    const g = gemById.get(id);
    if (!g) return false;
    const v = g.variant || 'normal';
    if (filters[v] === false) return false;
    if (g.exceptional && filters.exceptional === false) return false;
    return true;
  });
}

/** Count ids by primary stat. Uses Map for O(1) lookups. */
function countByStat(gemById, ids) {
  const counts = { int: 0, str: 0, dex: 0 };
  for (const id of ids) {
    const g = gemById.get(id);
    if (g && g.primaryStat && counts[g.primaryStat] !== undefined) {
      counts[g.primaryStat]++;
    }
  }
  return counts;
}

function renderStatCountSpans(counts, parent) {
  for (const stat of STAT_ORDER_COUNTS) {
    const n = counts[stat] ?? 0;
    const span = document.createElement('span');
    span.className = 'gem-chip-count';
    span.dataset.stat = stat;
    span.textContent = String(n);
    span.style.color = STAT_COLORS[stat];
    parent.appendChild(span);
  }
}

export function renderClusters(gems, onSelectGem, variantFilters, onVariantFilterChange, fullGems) {
  const container = document.createElement('div');
  container.className = 'gem-clusters';
  const allGems = fullGems ?? gems;

  container.appendChild(renderGlobalVariantCheckboxes(variantFilters || defaultFilters, onVariantFilterChange || noopVariantFilter));

  const gemById = new Map(allGems.map((g) => [g.id, g]));

  const byStat = { int: [], str: [], dex: [] };
  for (const g of gems) {
    const s = g.primaryStat || 'str';
    if (byStat[s]) byStat[s].push(g);
  }

  const filters = variantFilters || defaultFilters;

  // Pre-compute compatibility once per unique gem (filter-invariant)
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
        if (!supportsCache.has(g.id)) supportsCache.set(g.id, getSupportsForActive(g.id, allGems));
        const supportIds = supportsCache.get(g.id);
        const filteredSupportIds = filterIdsByVariantForSupports(gemById, supportIds, filters);
        const counts = countByStat(gemById, filteredSupportIds);

        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gem-btn';
        btn.dataset.gemId = g.id;
        btn.dataset.gemKind = g.kind;

        const img = document.createElement('img');
        img.className = 'gem-icon';
        img.src = getGemIconUrl(g);
        img.alt = `${g.name} icon`;

        const span = document.createElement('span');
        span.className = 'gem-label';
        span.textContent = g.name;

        const wikiLink = createWikiLink(g.name);
        wikiLink.addEventListener('click', (e) => e.stopPropagation());

        btn.appendChild(img);
        btn.appendChild(span);
        btn.appendChild(wikiLink);

        const countWrap = document.createElement('span');
        countWrap.className = 'gem-chip-counts';
        renderStatCountSpans(counts, countWrap);
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
        if (!activesCache.has(g.id)) activesCache.set(g.id, getActivesForSupport(g.id, allGems));
        const activeIds = activesCache.get(g.id);
        const filteredActiveIds = filterIdsByVariantForActives(gemById, activeIds, filters);
        const counts = countByStat(gemById, filteredActiveIds);

        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gem-btn';
        btn.dataset.gemId = g.id;
        btn.dataset.gemKind = g.kind;

        const img = document.createElement('img');
        img.className = 'gem-icon';
        img.src = getGemIconUrl(g);
        img.alt = `${g.name} icon`;

        const span = document.createElement('span');
        span.className = 'gem-label';
        span.textContent = g.name;

        const wikiLink = createWikiLink(g.name);
        wikiLink.addEventListener('click', (e) => e.stopPropagation());

        btn.appendChild(img);
        btn.appendChild(span);
        btn.appendChild(wikiLink);

        const countWrap = document.createElement('span');
        countWrap.className = 'gem-chip-counts';
        renderStatCountSpans(counts, countWrap);
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
