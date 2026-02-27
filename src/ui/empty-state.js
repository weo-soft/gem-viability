/**
 * Empty state message when there are no compatible supports or actives.
 * @param {'supports'|'actives'} type
 * @returns {HTMLElement}
 */
export function renderEmptyState(type) {
  const p = document.createElement('p');
  p.className = 'empty-state';
  p.textContent = type === 'supports' ? 'No compatible supports.' : 'No compatible actives.';
  return p;
}
