/**
 * Convert gem display name to the filename base used on disk (PascalCase).
 * e.g. "Arc of Surging" -> "ArcOfSurging", "Battlemage's Cry" -> "BattlemagesCry"
 * Apostrophes are removed so "X's Y" becomes "XsY" to match icon filenames.
 *
 * @param {string} name
 * @returns {string}
 */
function nameToFileName(name) {
  if (!name) return '';
  const withoutApostrophes = name.replace(/'/g, '');
  const words = withoutApostrophes.split(/[^A-Za-z0-9]+/).filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

/**
 * Compute the icon URL for a gem based on kind, name, and variant.
 *
 * Icons live in:
 * - active/<Name>.png           (normal actives)
 * - active/transfigured/<Name>.png
 * - active/vaal/<Name>.png
 * - active/trarthan/<Name>.png  (Trarthus actives; folder name on disk is "trarthan")
 * - support/<Name>.png          (normal supports)
 * - support/awakened/<Name>.png   (awakened supports; filenames have "Awakened" prefix)
 *
 * @param {{ name: string, kind: string, variant?: string }} gem
 * @returns {string}
 */
export function getGemIconUrl(gem) {
  const folder = gem.kind === 'active' ? 'active' : 'support';
  const baseName = nameToFileName(gem.name || '');
  const fileName = `${baseName}.png`;

  let subfolder = '';
  if (gem.kind === 'active') {
    if (gem.variant === 'transfigured') subfolder = 'transfigured';
    else if (gem.variant === 'vaal') subfolder = 'vaal';
    else if (gem.variant === 'trarthus') subfolder = 'trarthan';
  } else if (gem.kind === 'support' && gem.variant === 'awakened') {
    subfolder = 'awakened';
  }

  const path = subfolder ? `${folder}/${subfolder}/${fileName}` : `${folder}/${fileName}`;
  const base =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : '';
  return `${base}/assets/images/${path}`;
}

