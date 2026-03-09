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
 * Awakened gems (including Awakened Enlighten/Enhance/Empower) use the awakened folder.
 * Only the base exceptional trio (Enlighten, Enhance, Empower) use the exceptional folder.
 *
 * Icons live in:
 * - active/<Name>.png           (normal actives)
 * - active/transfigured/<Name>.png
 * - active/vaal/<Name>.png
 * - active/trarthan/<Name>.png  (Trarthus actives; folder name on disk is "trarthan")
 * - support/<Name>.png          (normal supports)
 * - support/awakened/<Name>.png   (awakened supports; their own category)
 * - support/exceptional/<Name>.webp  (all exceptional supports: Enlighten/Enhance/Empower + level-72 non-awakened)
 *
 * @param {{ name: string, kind: string, variant?: string, exceptional?: boolean }} gem
 * @returns {string}
 */
export function getGemIconUrl(gem) {
  const folder = gem.kind === 'active' ? 'active' : 'support';
  // Support gem icons are stored as <bareName>.png (e.g. Barrage.png for "Barrage Support");
  // the fetch script uses gem id with "Support" stripped (SupportBarrage → Barrage).
  let displayName = gem.name || '';
  if (gem.kind === 'support') {
    displayName = displayName.replace(/\s+Support$/i, '');
  }
  const baseName = nameToFileName(displayName);

  let subfolder = '';
  let ext = 'png';
  if (gem.kind === 'active') {
    if (gem.variant === 'transfigured') subfolder = 'transfigured';
    else if (gem.variant === 'vaal') subfolder = 'vaal';
    else if (gem.variant === 'trarthus') subfolder = 'trarthan';
  } else if (gem.kind === 'support') {
    // Awakened gems use awakened folder; all other exceptional gems use exceptional folder (.webp)
    if (gem.variant === 'awakened') {
      subfolder = 'awakened';
    } else if (gem.exceptional) {
      subfolder = 'exceptional';
      ext = 'webp';
    }
  }

  const fileName = `${baseName}.${ext}`;
  const path = subfolder ? `${folder}/${subfolder}/${fileName}` : `${folder}/${fileName}`;
  const base =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : '';
  return `${base}/assets/images/${path}`;
}

/**
 * Optional fallback URL for exceptional support gems (e.g. .png when .webp missing).
 * Enlighten, Enhance, Empower are stored as .png in exceptional folder.
 *
 * @param {{ name: string, kind: string, variant?: string, exceptional?: boolean }} gem
 * @returns {string|null}
 */
export function getGemIconUrlFallback(gem) {
  if (gem.kind !== 'support' || !gem.exceptional) return null;
  let displayName = gem.name || '';
  displayName = displayName.replace(/\s+Support$/i, '');
  const baseName = nameToFileName(displayName);
  const base =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : '';
  return `${base}/assets/images/support/exceptional/${baseName}.png`;
}

/**
 * Set icon src on an img element, with optional fallback for exceptional support gems.
 *
 * @param {HTMLImageElement} img
 * @param {{ name: string, kind: string, variant?: string, exceptional?: boolean }} gem
 */
export function setGemIconSrc(img, gem) {
  img.src = getGemIconUrl(gem);
  const fallback = getGemIconUrlFallback(gem);
  if (fallback) {
    img.onerror = function onIconError() {
      img.onerror = null;
      img.src = fallback;
    };
  }
}

