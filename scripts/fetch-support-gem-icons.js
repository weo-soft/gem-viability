/**
 * Fetch support gem inventory icons from PoE Wiki and save them under:
 *   public/assets/images/support/<bareId>.<ext>           (regular support gems)
 *   public/assets/images/support/awakened/<bareId>.<ext>  (awakened support gems)
 *
 * Matching is done via `public/gems.json` entries emitted from `skill-data/*.lua`.
 *
 * Usage:
 *   node scripts/fetch-support-gem-icons.js
 *   node scripts/fetch-support-gem-icons.js --force
 *   node scripts/fetch-support-gem-icons.js --dry-run
 *   node scripts/fetch-support-gem-icons.js --concurrency 12
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const WIKI_LIST_URL = 'https://www.poewiki.net/wiki/List_of_support_gems';
const WIKI_AWAKENED_URL = 'https://www.poewiki.net/wiki/Awakened_support_gem';
const WIKI_API_URL = 'https://www.poewiki.net/api.php';

const GEMS_JSON = path.join(ROOT, 'public', 'gems.json');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'images', 'support');
const OUT_DIR_AWAKENED = path.join(OUT_DIR, 'awakened');

function parseArgs(argv) {
  const args = {
    force: false,
    dryRun: false,
    concurrency: 8,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--concurrency') {
      const v = argv[i + 1];
      i++;
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid --concurrency: ${v}`);
      args.concurrency = Math.floor(n);
    } else if (a === '--help' || a === '-h') {
      // eslint-disable-next-line no-console
      console.log(
        [
          'Fetch support gem icons from poewiki and save them to public/assets/images.',
          '',
          'Usage:',
          '  node scripts/fetch-support-gem-icons.js [--force] [--dry-run] [--concurrency N]',
          '',
          'Options:',
          '  --force           Re-download even if file exists',
          '  --dry-run         Print what would happen, do not write files',
          '  --concurrency N   Parallel downloads (default: 8)',
        ].join('\n'),
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }

  return args;
}

function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

/** Decode URL-encoded file title (e.g. %27 → ') so API and lookups work for names like "Assassin's Mark". */
function safeDecodeFileTitle(s) {
  try {
    return decodeURIComponent(String(s));
  } catch {
    return s;
  }
}

function getImageUrlForFileTitle(urlMap, fileTitle) {
  return urlMap.get(fileTitle) || urlMap.get(safeDecodeFileTitle(fileTitle));
}

function ensureDirSync(dir, { dryRun }) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchText(url) {
  if (!globalThis.fetch) {
    throw new Error('This script requires Node.js with global fetch (Node 18+).');
  }
  const res = await fetch(url, {
    headers: {
      'user-agent': 'skill-support-compatibility-viewer/0.1 (icon fetcher)',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function extractInventoryIconFileTitlesFromHtml(html) {
  const titles = new Set();

  // Some parts of the page link to file pages.
  // Example: /wiki/File:Added_Fire_Damage_Support_inventory_icon.png
  {
    const re = /\/wiki\/File:([^"?#\s]+_Support_inventory_icon\.(?:png|webp|gif|jpe?g))/gi;
    let m;
    while ((m = re.exec(html)) !== null) titles.add(m[1]);
  }

  // The gem list table commonly embeds thumbnails directly without a File: href.
  // Example: /images/thumb/5/5b/Added_Fire_Damage_Support_inventory_icon.png/16px-Added_Fire_Damage_Support_inventory_icon.png
  {
    const re =
      /\/images\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/"?#\s]+_Support_inventory_icon\.(?:png|webp|gif|jpe?g))/gi;
    let m;
    while ((m = re.exec(html)) !== null) titles.add(m[1]);
  }

  return [...titles];
}

function gemNameFromInventoryIconFileTitle(fileTitle) {
  const base = fileTitle.replace(/_inventory_icon\.(?:png|webp|gif|jpe?g)$/i, '');
  const spaced = base.replace(/_/g, ' ');
  // The file title may contain URL-escaped apostrophes, parentheses, etc.
  return decodeURIComponent(spaced);
}

function candidateGemNamesFromWikiName(wikiName) {
  const out = [wikiName];
  if (/\sSupport$/i.test(wikiName)) {
    out.push(wikiName.replace(/\sSupport$/i, ''));
  }
  return out;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchImageInfoUrls(fileTitles) {
  // MediaWiki query API supports `titles` separated by |. Keep batches small.
  const result = new Map(); // fileTitle -> direct image url
  const batches = chunk(fileTitles, 50);

  for (const batch of batches) {
    const titlesParam = batch.map((t) => `File:${safeDecodeFileTitle(t)}`).join('|');
    const url =
      `${WIKI_API_URL}?action=query&format=json&prop=imageinfo&iiprop=url&titles=` +
      encodeURIComponent(titlesParam);

    const res = await fetch(url, {
      headers: {
        'user-agent': 'skill-support-compatibility-viewer/0.1 (icon fetcher)',
        accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const title = page?.title;
      const imageUrl = page?.imageinfo?.[0]?.url;
      if (!title) continue;
      const fileTitleRaw = title.replace(/^File:/, ''); // MediaWiki returns spaces in titles
      const fileTitleUnderscored = fileTitleRaw.replace(/ /g, '_');
      if (imageUrl) {
        // Allow lookups by either convention (HTML uses underscores; API titles often use spaces).
        result.set(fileTitleRaw, imageUrl);
        result.set(fileTitleUnderscored, imageUrl);
      }
    }
  }

  return result;
}

async function downloadToFile(url, outPath, { dryRun }) {
  if (dryRun) return;
  const res = await fetch(url, {
    headers: {
      'user-agent': 'skill-support-compatibility-viewer/0.1 (icon fetcher)',
      accept: 'image/*',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const arr = new Uint8Array(await res.arrayBuffer());
  fs.writeFileSync(outPath, arr);
}

async function runPool(items, worker, concurrency) {
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const my = idx++;
      if (my >= items.length) return;
      await worker(items[my], my);
    }
  });
  await Promise.all(workers);
}

function loadGemsIndex() {
  if (!fs.existsSync(GEMS_JSON)) {
    throw new Error(`Missing ${GEMS_JSON}. Run: node scripts/generate-gems-json.js`);
  }
  const gems = JSON.parse(fs.readFileSync(GEMS_JSON, 'utf8'));
  if (!Array.isArray(gems)) throw new Error(`Expected ${GEMS_JSON} to be a JSON array.`);

  const byExact = new Map();
  const byNorm = new Map();

  for (const g of gems) {
    if (!g || typeof g !== 'object') continue;
    if (typeof g.id !== 'string' || typeof g.name !== 'string') continue;

    if (!byExact.has(g.name)) byExact.set(g.name, []);
    byExact.get(g.name).push(g);

    const n = normalizeName(g.name);
    if (!byNorm.has(n)) byNorm.set(n, []);
    byNorm.get(n).push(g);
  }

  return { gems, byExact, byNorm };
}

function pickBestSupportMatch(matches) {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Prefer the "base" support gem entry (non-triggered / non-minion variants).
  const withoutVariants = matches.filter((m) => !/(Triggered|Minion)/i.test(m.id));
  if (withoutVariants.length === 1) return withoutVariants[0];

  // As a general heuristic, the base gem id tends to be the shortest.
  const sorted = [...matches].sort((a, b) => a.id.length - b.id.length || a.id.localeCompare(b.id));
  return sorted[0] ?? null;
}

function chooseSupportMatchFromCandidates(candidates, { byExact, byNorm }) {
  for (const name of candidates) {
    const exact = byExact.get(name) ?? [];
    const norm = byNorm.get(normalizeName(name)) ?? [];
    const matches = exact.length ? exact : norm;
    if (matches.length === 0) continue;

    const supportMatches = matches.filter((m) => m.kind === 'support');
    if (supportMatches.length === 1) return supportMatches[0];
    if (supportMatches.length > 1) {
      const picked = pickBestSupportMatch(supportMatches);
      if (picked) return picked;
      return { ambiguous: supportMatches.map((m) => m.id) };
    }

    // No `kind: support` entries for this name; try other candidate spellings first.
  }

  // As a fallback (rare), accept a unique match even if `kind` is missing/unexpected.
  for (const name of candidates) {
    const exact = byExact.get(name) ?? [];
    const norm = byNorm.get(normalizeName(name)) ?? [];
    const matches = exact.length ? exact : norm;
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) return { ambiguous: matches.map((m) => m.id) };
  }

  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  const { byExact, byNorm } = loadGemsIndex();

  // eslint-disable-next-line no-console
  console.log(`Fetching list page: ${WIKI_LIST_URL}`);
  const html = await fetchText(WIKI_LIST_URL);

  const fileTitles = extractInventoryIconFileTitlesFromHtml(html);
  // eslint-disable-next-line no-console
  console.log(`Found ${fileTitles.length} support inventory icon file titles on the page.`);

  const imageUrlByFileTitle = await fetchImageInfoUrls(fileTitles);
  // eslint-disable-next-line no-console
  console.log(`Resolved ${imageUrlByFileTitle.size}/${fileTitles.length} direct image URLs.`);

  ensureDirSync(OUT_DIR, { dryRun: args.dryRun });

  const jobs = [];
  const unmatched = [];
  const ambiguous = [];

  function addJobsForFileTitles(fileTitlesList, urlMap, outDir, { requireAwakened = false }) {
    for (const fileTitle of fileTitlesList) {
      const wikiName = gemNameFromInventoryIconFileTitle(fileTitle);
      const candidates = candidateGemNamesFromWikiName(wikiName);
      const picked = chooseSupportMatchFromCandidates(candidates, { byExact, byNorm });

      if (!picked) {
        unmatched.push(wikiName);
        continue;
      }
      if (picked && typeof picked === 'object' && 'ambiguous' in picked) {
        ambiguous.push({ wikiName, ids: picked.ambiguous });
        continue;
      }

      const gem = picked;
      if (requireAwakened && !/Awakened/i.test(gem.id)) {
        unmatched.push(wikiName);
        continue;
      }
      const imageUrl = getImageUrlForFileTitle(urlMap, fileTitle);
    if (!imageUrl) continue;

      const ext = path.extname(new URL(imageUrl).pathname) || path.extname(fileTitle) || '.png';
      const bareId = gem.id.startsWith('Support') ? gem.id.slice('Support'.length) : gem.id;
      const outPath = path.join(outDir, `${bareId}${ext}`);
      jobs.push({ wikiName, gemId: gem.id, imageUrl, outPath });
    }
  }

  addJobsForFileTitles(fileTitles, imageUrlByFileTitle, OUT_DIR, { requireAwakened: false });

  // Awakened support gems from https://www.poewiki.net/wiki/Awakened_support_gem
  // eslint-disable-next-line no-console
  console.log(`Fetching awakened list page: ${WIKI_AWAKENED_URL}`);
  const htmlAwakened = await fetchText(WIKI_AWAKENED_URL);
  const fileTitlesAwakened = extractInventoryIconFileTitlesFromHtml(htmlAwakened);
  // eslint-disable-next-line no-console
  console.log(`Found ${fileTitlesAwakened.length} awakened support inventory icon file titles.`);

  const imageUrlByFileTitleAwakened = await fetchImageInfoUrls(fileTitlesAwakened);
  // eslint-disable-next-line no-console
  console.log(
    `Resolved ${imageUrlByFileTitleAwakened.size}/${fileTitlesAwakened.length} awakened image URLs.`,
  );

  ensureDirSync(OUT_DIR_AWAKENED, { dryRun: args.dryRun });
  addJobsForFileTitles(fileTitlesAwakened, imageUrlByFileTitleAwakened, OUT_DIR_AWAKENED, {
    requireAwakened: true,
  });

  // eslint-disable-next-line no-console
  console.log(
    `Planned downloads: ${jobs.length} (unmatched: ${unmatched.length}, ambiguous: ${ambiguous.length}).`,
  );

  let skipped = 0;
  let downloaded = 0;
  const failures = [];

  await runPool(
    jobs,
    async (job) => {
      const exists = fs.existsSync(job.outPath);
      if (exists && !args.force) {
        skipped++;
        return;
      }
      try {
        await downloadToFile(job.imageUrl, job.outPath, { dryRun: args.dryRun });
        downloaded++;
      } catch (e) {
        failures.push({ gemId: job.gemId, wikiName: job.wikiName, url: job.imageUrl, error: String(e) });
      }
    },
    args.concurrency,
  );

  // eslint-disable-next-line no-console
  console.log(
    [
      'Done.',
      `  Downloaded: ${args.dryRun ? 0 : downloaded}`,
      `  Skipped:    ${skipped}`,
      `  Failures:   ${failures.length}`,
    ].join('\n'),
  );

  if (unmatched.length) {
    // eslint-disable-next-line no-console
    console.log(`Unmatched gem names (first 25):\n${unmatched.slice(0, 25).map((s) => `  - ${s}`).join('\n')}`);
  }
  if (ambiguous.length) {
    // eslint-disable-next-line no-console
    console.log(
      `Ambiguous gem names (first 25):\n${ambiguous
        .slice(0, 25)
        .map((a) => `  - ${a.wikiName}: ${a.ids.join(', ')}`)
        .join('\n')}`,
    );
  }
  if (failures.length) {
    // eslint-disable-next-line no-console
    console.log(
      `Failures (first 10):\n${failures
        .slice(0, 10)
        .map((f) => `  - ${f.gemId} (${f.wikiName}): ${f.error}`)
        .join('\n')}`,
    );
    process.exitCode = 1;
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

