/**
 * Compatibility panel: shows valid supports for selected active, or compatible actives for selected support.
 * Updates on selection change; shows empty state when result list is empty.
 * Respects global variant filters (Normal, Transfigured, Vaal, Awakened, Trarthus, Exceptional).
 */
import { getSupportsForActive, getActivesForSupport } from '../compatibility.js';
import { renderEmptyState } from './empty-state.js';
import { getGemIconUrl } from './icons.js';
import { createWikiLink } from '../utils/wiki.js';

const defaultVariantFilters = { normal: true, transfigured: true, vaal: true, awakened: true, trarthus: true, exceptional: true };

const ACTIVE_VARIANTS = ['normal', 'transfigured', 'vaal', 'trarthus'];

function filterIdsByVariantForActives(gemById, ids, variantFilters) {
  const filters = variantFilters || defaultVariantFilters;
  return ids.filter((id) => {
    const g = gemById.get(id);
    if (!g) return false;
    const v = g.variant || 'normal';
    if (!ACTIVE_VARIANTS.includes(v)) return true;
    if (filters[v] === false) return false;
    return true;
  });
}

function filterIdsByVariantForSupports(gemById, ids, variantFilters) {
  const filters = variantFilters || defaultVariantFilters;
  return ids.filter((id) => {
    const g = gemById.get(id);
    if (!g) return false;
    const v = g.variant || 'normal';
    if (filters[v] === false) return false;
    if (g.exceptional && filters.exceptional === false) return false;
    return true;
  });
}

/**
 * @param {{ id: string, kind: string } | null} selectedGem
 * @param {Array<{id: string, name: string, kind: string, primaryStat: string, variant?: string}>} gems
 * @param {HTMLElement} panelEl
 * @param {{ normal?: boolean, transfigured?: boolean, vaal?: boolean, awakened?: boolean, trarthus?: boolean, exceptional?: boolean }} [variantFilters] Global variant toggles; when provided, filters both "Valid support gems" and "Compatible active gems".
 */
function renderSelectedGemBlock(gem) {
  const block = document.createElement('div');
  block.className = 'compat-panel-selected';
  const img = document.createElement('img');
  img.className = 'gem-icon';
  img.src = getGemIconUrl(gem);
  img.alt = `${gem.name} icon`;
  const span = document.createElement('span');
  span.className = 'gem-label';
  span.textContent = gem.name;
  const wikiLink = createWikiLink(gem.name);
  block.appendChild(img);
  block.appendChild(span);
  block.appendChild(wikiLink);
  return block;
}

export function updateCompatibilityPanel(selectedGem, gems, panelEl, variantFilters) {
  panelEl.innerHTML = '';
  if (!selectedGem) {
    const p = document.createElement('p');
    p.className = 'panel-placeholder';
    p.textContent = 'Select an active or support gem to see compatibility.';
    panelEl.appendChild(p);
    return;
  }

  const gemById = new Map(gems.map((g) => [g.id, g]));
  const selectedGemData = gems.find((g) => g.id === selectedGem.id && g.kind === selectedGem.kind);
  if (selectedGemData) {
    panelEl.appendChild(renderSelectedGemBlock(selectedGemData));
  }

  const scrollWrap = document.createElement('div');
  scrollWrap.className = 'compat-panel-scroll';

  if (selectedGem.kind === 'active') {
    const supportIds = getSupportsForActive(selectedGem.id, gems);
    const filteredIds = filterIdsByVariantForSupports(gemById, supportIds, variantFilters);

    const label = document.createElement('h3');
    label.textContent = 'Valid support gems';
    scrollWrap.appendChild(label);
    if (filteredIds.length === 0) {
      scrollWrap.appendChild(renderEmptyState('supports'));
    } else {
      const ul = document.createElement('ul');
      ul.className = 'compat-list';
      for (const id of filteredIds) {
        const g = gems.find((x) => x.id === id);
        if (g) {
          const li = document.createElement('li');
          const img = document.createElement('img');
          img.className = 'gem-icon';
          img.src = getGemIconUrl(g);
          img.alt = `${g.name} icon`;
          const span = document.createElement('span');
          span.className = 'gem-label';
          span.textContent = g.name;
          const wikiLink = createWikiLink(g.name);
          li.appendChild(img);
          li.appendChild(span);
          li.appendChild(wikiLink);
          ul.appendChild(li);
        }
      }
      scrollWrap.appendChild(ul);
    }
  } else {
    const activeIds = getActivesForSupport(selectedGem.id, gems);
    const filteredIds = filterIdsByVariantForActives(gemById, activeIds, variantFilters);

    const label = document.createElement('h3');
    label.textContent = 'Compatible active gems';
    scrollWrap.appendChild(label);
    if (filteredIds.length === 0) {
      scrollWrap.appendChild(renderEmptyState('actives'));
    } else {
      const ul = document.createElement('ul');
      ul.className = 'compat-list';
      for (const id of filteredIds) {
        const g = gems.find((x) => x.id === id);
        if (g) {
          const li = document.createElement('li');
          const img = document.createElement('img');
          img.className = 'gem-icon';
          img.src = getGemIconUrl(g);
          img.alt = `${g.name} icon`;
          const span = document.createElement('span');
          span.className = 'gem-label';
          span.textContent = g.name;
          const wikiLink = createWikiLink(g.name);
          li.appendChild(img);
          li.appendChild(span);
          li.appendChild(wikiLink);
          ul.appendChild(li);
        }
      }
      scrollWrap.appendChild(ul);
    }
  }

  panelEl.appendChild(scrollWrap);
}

/**
 * Set selected gem visual state: add .selected to the clicked button, remove from others.
 * @param {HTMLElement} clustersEl
 * @param {{ id: string, kind: string } | null} selectedGem
 */
export function setSelectionVisual(clustersEl, selectedGem) {
  const all = clustersEl.querySelectorAll('.gem-btn');
  all.forEach((btn) => {
    if (selectedGem && btn.dataset.gemId === selectedGem.id && btn.dataset.gemKind === selectedGem.kind) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}
