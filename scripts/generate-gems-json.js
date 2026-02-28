/**
 * Build-time script: parse skill-data/*.lua (Path of Building format) and emit public/gems.json.
 * No Lua runtime required; uses regex and brace-counting to extract skill blocks.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SKILL_DATA_DIR = path.join(ROOT, 'skill-data');
const OUT_FILE = path.join(ROOT, 'public', 'gems.json');

const COLOR_TO_STAT = { 1: 'str', 2: 'dex', 3: 'int', 4: 'white' };

/** Secondary actives (triggered/granted) and secondary supports excluded from processing and display. */
const EXCLUDED_GEM_IDS = new Set([
  // Secondary active skills
  'KineticRainKineticInstability', // Kinetic Anomaly
  'RuneBlast',
  'RuneBlastAltX', // Rune Blast of Teleportation
  'SignalPrey',
  'DoomBlast',
  'TriggeredSupportKineticInstability', // Kinetic Flux
  'TriggeredSupportLivingLightning', // Summon Living Lightning
  'PrismaticBurst',
  'SupportPrismaticBurst',
  'SummonSacredWisp', // Summon Sacred Whisp
  'CallOfSteel',
  'QuickstepHardMode', // Quickstep
  'FrozenSweep',
  'FrozenSweepAltX',
  'Combust',
  'AvengingFlame',
  'SupportShockwave',
  'SupportBluntWeaponShockwave',
  'SupportWindburst',
  'TriggeredSupportWindburst',
  'ThunderstormMiniTornados', // Thunderburst
  // Secondary supports
  'SupportAutomation', // Automation
  'SupportAutoexertion', // Autoexertion
  'BrandSupport', // Arcanist Brand
  'SupportBrandSupport',
  'SupportDarkRitual', // Bane
  'SupportDarkRitualAltX',
  'SupportSpellslinger', // Spellslinger
  'BattlemagesCrySupport', // Battlemage's Cry
  'GeneralsCrySupport', // General's Cry
  'SupportFistofWar', // Fist of War
  'SupportGuardiansBlessing', // Guardian's Blessing
  'SupportGuardiansBlessingMinion',
  'ChannelledSnipeSupport', // Snipe
  'SupportIntuitiveLink', // Intuitive Link
]);

/** Support gems that exist only as legacy (no longer obtainable normally). */
const LEGACY_GEM_IDS = new Set(['SupportItemQuantity']);

/** Support gems that exist only from recipes (e.g. vendor/bench), not as drops. */
const RECIPE_ONLY_GEM_IDS = new Set(['SupportElementalPenetration', 'SupportBlockChanceReduction']);

function extractSkillBlocks(content) {
  const blocks = [];
  const re = /skills\["([^"]+)"\]\s*=\s*\{/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const start = match.index + match[0].length;
    let depth = 1;
    let pos = start;
    while (pos < content.length && depth > 0) {
      const c = content[pos];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      pos++;
    }
    const block = content.slice(start, pos - 1);
    blocks.push({ id: match[1], block });
  }
  return blocks;
}

function extractSkillTypes(block) {
  const re = /SkillType\.(\w+)/g;
  const types = new Set();
  let m;
  while ((m = re.exec(block)) !== null) types.add(m[1]);
  return [...types];
}

function extractTableContent(block, tableName) {
  const re = new RegExp(tableName + '\\s*=\\s*\\{', 'g');
  const m = re.exec(block);
  if (!m) return '';
  let start = m.index + m[0].length;
  let depth = 1;
  let pos = start;
  while (pos < block.length && depth > 0) {
    const c = block[pos];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    pos++;
  }
  return block.slice(start, pos - 1);
}

function extractSkillTypesFromTable(block, tableName) {
  const inner = extractTableContent(block, tableName);
  return extractSkillTypes(inner);
}

function parseSkill(id, block) {
  const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
  const colorMatch = block.match(/color\s*=\s*(\d+)/);
  const isSupport = /support\s*=\s*true/.test(block);
  const name = nameMatch ? nameMatch[1] : id;
  const color = colorMatch ? parseInt(colorMatch[1], 10) : 1;
  const primaryStat = COLOR_TO_STAT[color] || 'str';

  // Derive variant information
  let variant = 'normal';
  let exceptional = false;
  // Support awakened versions use plusVersionOf
  const plusMatch = block.match(/plusVersionOf\s*=\s*"([^"]+)"/);
  if (plusMatch && isSupport) {
    variant = 'awakened';
  } else if (/ of Trarthus$/i.test(name)) {
    variant = 'trarthus';
  } else if (!isSupport) {
    // Active variants: Vaal vs transfigured vs normal
    // Transfigured gems have Alt in id (e.g. EyeOfWinterAltX). Do not use " of " in name:
    // that would misclassify base gems like "Herald of Agony", "Purity of Ice", "Eye of Winter".
    if (/SkillType\.Vaal/.test(block) || /^Vaal\s/.test(name)) {
      variant = 'vaal';
    } else if (/Alt/.test(id)) {
      variant = 'transfigured';
    }
  }

  // Exceptional support gems: Enlighten, Enhance, Empower and their Awakened versions
  if (isSupport) {
    const exceptionalBaseNames = ['Enlighten', 'Enhance', 'Empower'];
    const isExceptionalBase = exceptionalBaseNames.includes(name);
    const isExceptionalAwakened =
      variant === 'awakened' &&
      (name === 'Awakened Enlighten' || name === 'Awakened Enhance' || name === 'Awakened Empower');
    if (isExceptionalBase) {
      variant = 'exceptional';
      exceptional = true;
    } else if (isExceptionalAwakened) {
      exceptional = true;
    }
  }

  if (LEGACY_GEM_IDS.has(id)) {
    variant = 'legacy';
  } else if (RECIPE_ONLY_GEM_IDS.has(id)) {
    variant = 'recipeOnly';
  }

  if (isSupport) {
    const requireSkillTypes = extractSkillTypesFromTable(block, 'requireSkillTypes');
    const excludeSkillTypes = extractSkillTypesFromTable(block, 'excludeSkillTypes');
    const out = {
      id,
      name,
      kind: 'support',
      primaryStat,
      color,
      variant,
      skillTypes: [],
      requireSkillTypes: requireSkillTypes || [],
      excludeSkillTypes: excludeSkillTypes || [],
    };
    if (exceptional) out.exceptional = true;
    return out;
  }

  const skillTypes = extractSkillTypesFromTable(block, 'skillTypes');
  const minionSkillTypes = extractSkillTypesFromTable(block, 'minionSkillTypes');
  const out = {
    id,
    name,
    kind: 'active',
    primaryStat,
    color,
    variant,
    skillTypes: skillTypes || [],
    requireSkillTypes: [],
    excludeSkillTypes: [],
  };
  if (minionSkillTypes && minionSkillTypes.length > 0) {
    out.minionSkillTypes = minionSkillTypes;
  }
  return out;
}

function loadLuaFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return extractSkillBlocks(content).map(({ id, block }) => parseSkill(id, block));
}

function main() {
  const files = fs.readdirSync(SKILL_DATA_DIR).filter((f) => f.endsWith('.lua'));
  const allGems = [];
  for (const file of files) {
    const filePath = path.join(SKILL_DATA_DIR, file);
    const gems = loadLuaFile(filePath);
    allGems.push(...gems);
  }
  const filtered = allGems.filter((g) => !EXCLUDED_GEM_IDS.has(g.id));
  const outDir = path.dirname(OUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(filtered, null, 0), 'utf8');
  console.log(`Wrote ${filtered.length} gems to ${OUT_FILE} (excluded ${allGems.length - filtered.length} secondary gems)`);
}

main();
