import { getGemIconUrl } from './icons.js';

/** Render gem clusters by Int/Str/Dex with global variant filter checkboxes (normal, transfigured, vaal, awakened, trarthus). */
const STAT_ORDER = ['int', 'str', 'dex'];
const STAT_LABELS = { int: 'Intelligence', str: 'Strength', dex: 'Dexterity' };
const STAT_COLORS = { int: '#3366cc', str: '#cc3333', dex: '#33cc33' };
const VARIANT_OPTIONS = [
  { key: 'normal', label: 'Normal' },
  { key: 'transfigured', label: 'Transfigured' },
  { key: 'vaal', label: 'Vaal' },
  { key: 'awakened', label: 'Awakened' },
  { key: 'trarthus', label: 'Trarthus' },
  { key: 'exceptional', label: 'Exceptional' },
];

const defaultFilters = { normal: true, transfigured: true, vaal: true, awakened: true, trarthus: true, exceptional: true };

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

function filterByVariant(list, variantFilters) {
  const filters = variantFilters || defaultFilters;
  return list.filter((g) => {
    const v = g.variant || 'normal';
    if (filters[v] === false) return false;
    if (g.exceptional && filters.exceptional === false) return false;
    return true;
  });
}

export function renderClusters(gems, onSelectGem, variantFilters, onVariantFilterChange) {
  const container = document.createElement('div');
  container.className = 'gem-clusters';

  container.appendChild(renderGlobalVariantCheckboxes(variantFilters || defaultFilters, onVariantFilterChange || noopVariantFilter));

  const byStat = { int: [], str: [], dex: [] };
  for (const g of gems) {
    const s = g.primaryStat || 'str';
    if (byStat[s]) byStat[s].push(g);
  }

  const filters = variantFilters || defaultFilters;

  for (const stat of STAT_ORDER) {
    const list = byStat[stat];
    if (!list.length) continue;

    const section = document.createElement('section');
    section.className = 'cluster';
    section.setAttribute('data-stat', stat);
    section.style.borderLeftColor = STAT_COLORS[stat];

    const heading = document.createElement('h2');
    heading.textContent = STAT_LABELS[stat];
    heading.style.color = STAT_COLORS[stat];
    section.appendChild(heading);

    const actives = filterByVariant(list.filter((g) => g.kind === 'active'), filters);
    const supports = filterByVariant(list.filter((g) => g.kind === 'support'), filters);

    if (actives.length) {
      const sub = document.createElement('div');
      sub.className = 'cluster-sub';
      const label = document.createElement('h3');
      label.textContent = 'Active';
      sub.appendChild(label);
      const ul = document.createElement('ul');
      ul.className = 'gem-list active-list';
      for (const g of actives) {
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

        btn.appendChild(img);
        btn.appendChild(span);

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

        btn.appendChild(img);
        btn.appendChild(span);

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
