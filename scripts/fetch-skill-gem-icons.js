/**
 * Fetch active skill gem inventory icons from PoE Wiki and save them under:
 *   public/assets/images/active/<gemId>.<ext>                 (regular active gems)
 *   public/assets/images/active/transfigured/<gemId>.<ext>    (transfigured active gems)
 *   public/assets/images/active/vaal/<gemId>.<ext>            (Vaal active gems)
 *   public/assets/images/active/trarthan/<Name>.<ext>         (Trarthan active gems)
 *
 * Matching is done via `public/gems.json` entries emitted from `skill-data/*.lua`.
 *
 * Usage:
 *   node scripts/fetch-skill-gem-icons.js
 *   node scripts/fetch-skill-gem-icons.js --force
 *   node scripts/fetch-skill-gem-icons.js --dry-run
 *   node scripts/fetch-skill-gem-icons.js --concurrency 12
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const WIKI_LIST_URL = 'https://www.poewiki.net/wiki/List_of_skill_gems';
const WIKI_TRANSGEM_URL = 'https://www.poewiki.net/wiki/Transfigured_skill_gem';
const WIKI_VAAL_URL = 'https://www.poewiki.net/wiki/Vaal_skill';
const WIKI_TRARTHAN_URL = 'https://www.poewiki.net/wiki/List_of_Trarthan_gems';
const WIKI_API_URL = 'https://www.poewiki.net/api.php';

const GEMS_JSON = path.join(ROOT, 'public', 'gems.json');
const OUT_DIR_ACTIVE = path.join(ROOT, 'public', 'assets', 'images', 'active');
const OUT_DIR_ACTIVE_TRANSGEM = path.join(OUT_DIR_ACTIVE, 'transfigured');
const OUT_DIR_ACTIVE_VAAL = path.join(OUT_DIR_ACTIVE, 'vaal');
const OUT_DIR_ACTIVE_TRARTHAN = path.join(OUT_DIR_ACTIVE, 'trarthan');

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
          'Fetch active skill gem icons from poewiki and save them to public/assets/images/active.',
          '',
          'Usage:',
          '  node scripts/fetch-skill-gem-icons.js [--force] [--dry-run] [--concurrency N]',
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
  // Example: /wiki/File:Battlemage%27s_Cry_inventory_icon.png
  {
    const re = /\/wiki\/File:([^"?#\s]+_inventory_icon\.(?:png|webp|gif|jpe?g))/gi;
    let m;
    while ((m = re.exec(html)) !== null) titles.add(m[1]);
  }

  // The gem list table commonly embeds thumbnails directly without a File: href.
  // Example: /images/thumb/c/c6/Absolution_inventory_icon.png/16px-Absolution_inventory_icon.png
  {
    const re =
      /\/images\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/"?#\s]+_inventory_icon\.(?:png|webp|gif|jpe?g))/gi;
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
      const title = page?.title; // e.g. "File:Absolution_inventory_icon.png"
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

function addJobsForFileTitles({
  label,
  fileTitles,
  imageUrlByFileTitle,
  byExact,
  byNorm,
  outDir,
  makeFileBase = (gem) => gem.id,
  jobs,
  unmatched,
  ambiguous,
}) {
  for (const fileTitle of fileTitles) {
    const gemName = gemNameFromInventoryIconFileTitle(fileTitle);

    const exact = byExact.get(gemName) ?? [];
    const norm = byNorm.get(normalizeName(gemName)) ?? [];
    let matches = exact.length ? exact : norm;

    if (matches.length === 0) {
      unmatched.push({ source: label, gemName });
      continue;
    }

    if (matches.length > 1) {
      const activeMatches = matches.filter((m) => m.kind === 'active');
      if (activeMatches.length === 1) matches = activeMatches;
      else if (activeMatches.length > 1) matches = activeMatches;
    }

    if (matches.length !== 1) {
      ambiguous.push({ source: label, gemName, ids: matches.map((m) => m.id) });
      continue;
    }

    const gem = matches[0];
    const imageUrl = getImageUrlForFileTitle(imageUrlByFileTitle, fileTitle);
    if (!imageUrl) continue;

    const ext = path.extname(new URL(imageUrl).pathname) || path.extname(fileTitle) || '.png';
    const baseName = makeFileBase(gem);
    const outPath = path.join(outDir, `${baseName}${ext}`);
    jobs.push({ source: label, gemName, gemId: gem.id, imageUrl, outPath });
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const { byExact, byNorm } = loadGemsIndex();

  // eslint-disable-next-line no-console
  console.log(`Fetching list page: ${WIKI_LIST_URL}`);
  const htmlActive = await fetchText(WIKI_LIST_URL);

  const jobs = [];
  const unmatched = [];
  const ambiguous = [];

  // Ensure output directories exist up front.
  ensureDirSync(OUT_DIR_ACTIVE, { dryRun: args.dryRun });
  ensureDirSync(OUT_DIR_ACTIVE_TRANSGEM, { dryRun: args.dryRun });
  ensureDirSync(OUT_DIR_ACTIVE_VAAL, { dryRun: args.dryRun });
  ensureDirSync(OUT_DIR_ACTIVE_TRARTHAN, { dryRun: args.dryRun });

  // Base active skill gems from the main list page.
  {
    const fileTitles = extractInventoryIconFileTitlesFromHtml(htmlActive);
    // eslint-disable-next-line no-console
    console.log(`[active] Found ${fileTitles.length} inventory icon file titles on the page.`);

    const imageUrlByFileTitle = await fetchImageInfoUrls(fileTitles);
    // eslint-disable-next-line no-console
    console.log(`[active] Resolved ${imageUrlByFileTitle.size}/${fileTitles.length} direct image URLs.`);

    addJobsForFileTitles({
      label: 'active',
      fileTitles,
      imageUrlByFileTitle,
      byExact,
      byNorm,
      outDir: OUT_DIR_ACTIVE,
      makeFileBase: (gem) => gem.id,
      jobs,
      unmatched,
      ambiguous,
    });
  }

  // Transfigured active skill gems.
  {
    // eslint-disable-next-line no-console
    console.log(`Fetching transfigured gem page: ${WIKI_TRANSGEM_URL}`);
    const htmlTrans = await fetchText(WIKI_TRANSGEM_URL);
    const fileTitles = extractInventoryIconFileTitlesFromHtml(htmlTrans);
    // eslint-disable-next-line no-console
    console.log(`[transfigured] Found ${fileTitles.length} inventory icon file titles on the page.`);

    const imageUrlByFileTitle = await fetchImageInfoUrls(fileTitles);
    // eslint-disable-next-line no-console
    console.log(
      `[transfigured] Resolved ${imageUrlByFileTitle.size}/${fileTitles.length} direct image URLs.`,
    );

    addJobsForFileTitles({
      label: 'transfigured',
      fileTitles,
      imageUrlByFileTitle,
      byExact,
      byNorm,
      outDir: OUT_DIR_ACTIVE_TRANSGEM,
      makeFileBase: (gem) =>
        gem.name
          .split(/\s+/)
          .map((part) => {
            const clean = part.replace(/[^A-Za-z0-9]/g, '');
            if (!clean) return '';
            return clean.charAt(0).toUpperCase() + clean.slice(1);
          })
          .join('') || gem.id,
      jobs,
      unmatched,
      ambiguous,
    });
  }

  // Vaal active skill gems.
  {
    // eslint-disable-next-line no-console
    console.log(`Fetching Vaal gem page: ${WIKI_VAAL_URL}`);
    const htmlVaal = await fetchText(WIKI_VAAL_URL);
    const fileTitles = extractInventoryIconFileTitlesFromHtml(htmlVaal);
    // eslint-disable-next-line no-console
    console.log(`[vaal] Found ${fileTitles.length} inventory icon file titles on the page.`);

    const imageUrlByFileTitle = await fetchImageInfoUrls(fileTitles);
    // eslint-disable-next-line no-console
    console.log(`[vaal] Resolved ${imageUrlByFileTitle.size}/${fileTitles.length} direct image URLs.`);

    addJobsForFileTitles({
      label: 'vaal',
      fileTitles,
      imageUrlByFileTitle,
      byExact,
      byNorm,
      outDir: OUT_DIR_ACTIVE_VAAL,
      makeFileBase: (gem) => gem.id,
      jobs,
      unmatched,
      ambiguous,
    });
  }

  // Trarthan active skill gems (List of Trarthan gems).
  {
    // eslint-disable-next-line no-console
    console.log(`Fetching Trarthan gem page: ${WIKI_TRARTHAN_URL}`);
    const htmlTrarthan = await fetchText(WIKI_TRARTHAN_URL);
    const fileTitles = extractInventoryIconFileTitlesFromHtml(htmlTrarthan);
    // eslint-disable-next-line no-console
    console.log(`[trarthan] Found ${fileTitles.length} inventory icon file titles on the page.`);

    const imageUrlByFileTitle = await fetchImageInfoUrls(fileTitles);
    // eslint-disable-next-line no-console
    console.log(
      `[trarthan] Resolved ${imageUrlByFileTitle.size}/${fileTitles.length} direct image URLs.`,
    );

    addJobsForFileTitles({
      label: 'trarthan',
      fileTitles,
      imageUrlByFileTitle,
      byExact,
      byNorm,
      outDir: OUT_DIR_ACTIVE_TRARTHAN,
      makeFileBase: (gem) =>
        gem.name
          .split(/\s+/)
          .map((part) => {
            const clean = part.replace(/[^A-Za-z0-9]/g, '');
            if (!clean) return '';
            return clean.charAt(0).toUpperCase() + clean.slice(1);
          })
          .join('') || gem.id,
      jobs,
      unmatched,
      ambiguous,
    });
  }

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
        failures.push({ gemId: job.gemId, gemName: job.gemName, url: job.imageUrl, error: String(e) });
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
        .map((a) => `  - ${a.gemName}: ${a.ids.join(', ')}`)
        .join('\n')}`,
    );
  }
  if (failures.length) {
    // eslint-disable-next-line no-console
    console.log(
      `Failures (first 10):\n${failures
        .slice(0, 10)
        .map((f) => `  - ${f.gemId} (${f.gemName}): ${f.error}`)
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

