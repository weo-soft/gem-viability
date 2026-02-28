/**
 * Build the PoE Wiki URL for a gem.
 * Format: https://www.poewiki.net/wiki/{Name} with spaces as underscores and special chars encoded.
 * @param {string} gemName
 * @returns {string}
 */
export function getGemWikiUrl(gemName) {
  if (!gemName) return 'https://www.poewiki.net/wiki/';
  const slug = gemName.replace(/ /g, '_');
  return `https://www.poewiki.net/wiki/${encodeURIComponent(slug).replace(/'/g, '%27')}`;
}

const EXTERNAL_LINK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

/**
 * Create an anchor element with external link icon that opens the gem's PoE Wiki page.
 * @param {string} gemName
 * @returns {HTMLAnchorElement}
 */
export function createWikiLink(gemName) {
  const a = document.createElement('a');
  a.className = 'gem-wiki-link';
  a.href = getGemWikiUrl(gemName);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.title = `Open ${gemName} on PoE Wiki`;
  a.innerHTML = EXTERNAL_LINK_SVG;
  return a;
}
