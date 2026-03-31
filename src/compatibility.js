/**
 * Pure compatibility logic: which support gems can support which active gems.
 * Rule:
 * - requireSkillTypes: parsed using special SkillTypes "OR" and "AND". If AND is present,
 *   expression is (OR-group) AND (OR-group) AND ... where OR-groups are separated by AND.
 *   If only OR is present or no special types, active must match AT LEAST ONE (OR). Empty passes.
 * - excludeSkillTypes: active must match NONE (operator tokens OR/AND/NOT are ignored when checking).
 */

const OPERATORS = new Set(['OR', 'AND', 'NOT']);

/**
 * Excludes that refer to the active gem / how it is used (wrapper `skillTypes`), not the delegated
 * minion attack (`minionSkillTypes`). The payload often omits e.g. Minion or Trapped, so "both lists"
 * matching alone would miss Cast on Death vs Summon Holy Relic.
 * Not listed here: types like CreatesMinion or Triggered, where intersection semantics are needed
 * (e.g. Multistrike + Raise Zombie, Second Wind + Holy Relic).
 */
const EXCLUDE_WRAPPER_ONLY_TYPES = new Set([
  'Minion',
  'Trapped',
  'RemoteMined',
  'SummonsTotem',
  'Aura',
  'InbuiltTrigger',
  'DisallowTriggerSupports',
]);

function isOperator(t) {
  return OPERATORS.has(t);
}

/**
 * Evaluate requireSkillTypes against active's skillTypes.
 * When AND is present: split by AND into parts; each part is OR-group(s). All parts must pass.
 * When only OR or no operators: at least one required type must match (legacy behavior).
 *
 * @param {Set<string>} activeTypes
 * @param {string[]} require
 * @returns {boolean}
 */
function requireSkillTypesMatch(activeTypes, require) {
  const hasAnd = require.includes('AND');

  if (require.length === 0) return true;

  if (hasAnd) {
    // Split by AND into top-level parts (each part may contain OR-groups).
    const parts = splitByOperator(require, 'AND').filter((p) => p.length > 0);
    for (const part of parts) {
      const typesInPart = part.filter((t) => !isOperator(t));
      if (typesInPart.length === 0) continue;
      if (part.includes('OR')) {
        const orGroups = splitByOperator(part, 'OR').filter((g) => g.length > 0);
        const partPass = orGroups.every((group) =>
          group.some((t) => !isOperator(t) && activeTypes.has(t))
        );
        if (!partPass) return false;
      } else {
        const partPass = typesInPart.every((t) => activeTypes.has(t));
        if (!partPass) return false;
      }
    }
    return true;
  }

  // No AND: at least one required type must match (OR or plain list).
  const typeTokens = require.filter((t) => !isOperator(t));
  if (typeTokens.length === 0) return true;
  return typeTokens.some((r) => activeTypes.has(r));
}

/**
 * Split array by separator (e.g. 'AND'), keeping structure; separator is not included in chunks.
 * @param {string[]} arr
 * @param {string} separator
 * @returns {string[][]}
 */
function splitByOperator(arr, separator) {
  const result = [];
  let current = [];
  for (const t of arr) {
    if (t === separator) {
      if (current.length) result.push(current);
      current = [];
    } else {
      current.push(t);
    }
  }
  if (current.length) result.push(current);
  return result;
}

/**
 * Types used to check support's requireSkillTypes. Includes skillTypes and, when the support does not
 * ignore minion types, minionSkillTypes (so e.g. Multistrike can match via minionSkillTypes.Multistrikeable).
 * @param {{ skillTypes?: string[], minionSkillTypes?: string[] }} active
 * @param {{ ignoreMinionTypes?: boolean }} [support]
 * @returns {Set<string>}
 */
function getActiveTypesForRequire(active, support) {
  const types = new Set(active.skillTypes || []);
  if (support?.ignoreMinionTypes) return types;
  const minionSkillTypes = active.minionSkillTypes || [];
  for (const t of minionSkillTypes) types.add(t);
  return types;
}

/**
 * Types used to check support's excludeSkillTypes. When the active has minionSkillTypes and the support does not
 * ignore them, only minionSkillTypes are used—so a support that excludes e.g. CreatesMinion still matches
 * minion skills whose minion attacks satisfy the support (e.g. Multistrike + Raise Zombie: exclude is checked
 * against the minion's skill types, not the main skill's CreatesMinion).
 * @param {{ skillTypes?: string[], minionSkillTypes?: string[] }} active
 * @param {{ ignoreMinionTypes?: boolean }} [support]
 * @returns {Set<string>}
 */
function getActiveTypesForExclude(active, support) {
  if (support?.ignoreMinionTypes) {
    return new Set(active.skillTypes || []);
  }
  const minionSkillTypes = active.minionSkillTypes || [];
  if (minionSkillTypes.length > 0) {
    return new Set(minionSkillTypes);
  }
  const types = new Set(active.skillTypes || []);
  return types;
}

/**
 * Deduplicate gem ids by display name. Multiple gems (e.g. Cast on Crit base + triggered) can share
 * the same name but be valid via different skillTypes; show each name only once.
 * @param {string[]} ids
 * @param {Array<{id: string, name?: string}>} gems
 * @returns {string[]}
 */
function deduplicateByIdentity(ids, gems) {
  const seen = new Set();
  const result = [];
  for (const id of ids) {
    const g = gems.find((x) => x.id === id);
    const key = g?.name ?? id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(id);
  }
  return result;
}

/**
 * @param {string} activeId
 * @param {Array<{id: string, name?: string, kind: string, skillTypes: string[], minionSkillTypes?: string[], requireSkillTypes?: string[], excludeSkillTypes?: string[]}>} gems
 * @returns {string[]} support gem ids that can support this active (unique by display name)
 */
export function getSupportsForActive(activeId, gems) {
  const active = gems.find((g) => g.id === activeId && g.kind === 'active');
  if (!active) return [];
  const ids = gems
    .filter((g) => g.kind === 'support' && canSupport(active, g))
    .map((g) => g.id);
  return deduplicateByIdentity(ids, gems);
}

/**
 * @param {string} supportId
 * @param {Array<{id: string, name?: string, kind: string, skillTypes: string[], minionSkillTypes?: string[], requireSkillTypes?: string[], excludeSkillTypes?: string[]}>} gems
 * @returns {string[]} active gem ids that this support can support (unique by display name)
 */
export function getActivesForSupport(supportId, gems) {
  const support = gems.find((g) => g.id === supportId && g.kind === 'support');
  if (!support) return [];
  const ids = gems
    .filter((g) => g.kind === 'active' && canSupport(g, support))
    .map((g) => g.id);
  return deduplicateByIdentity(ids, gems);
}

/**
 * @param {{ skillTypes?: string[], minionSkillTypes?: string[] }} active
 * @param {{ requireSkillTypes?: string[], excludeSkillTypes?: string[], ignoreMinionTypes?: boolean }} support
 * @returns {boolean}
 */
function canSupport(active, support) {
  const typesForRequire = getActiveTypesForRequire(active, support);
  const typesForExclude = getActiveTypesForExclude(active, support);
  const wrapperTypesForExclude = new Set(active.skillTypes || []);
  const minionTypesForExclude = new Set(active.minionSkillTypes || []);
  const exclude = support.excludeSkillTypes || [];
  const requireMatch = support.requireSkillTypesAlternatives
    ? support.requireSkillTypesAlternatives.some((alt) =>
        requireSkillTypesMatch(typesForRequire, alt)
      )
    : requireSkillTypesMatch(typesForRequire, support.requireSkillTypes || []);
  if (!requireMatch) return false;
  for (const e of exclude) {
    if (isOperator(e)) continue;
    // If the active has a minion payload and the support doesn't ignore minion types:
    // - wrapper-only tags (Minion, Trapped, …) exclude when present on the active gem wrapper;
    // - other tags exclude only when present on BOTH wrapper and minion payload (payload-only tags
    //   like Triggered on the relic nova do not block the wrapper gem).
    if (!support.ignoreMinionTypes && minionTypesForExclude.size > 0) {
      if (EXCLUDE_WRAPPER_ONLY_TYPES.has(e)) {
        if (wrapperTypesForExclude.has(e)) return false;
        continue;
      }
      if (wrapperTypesForExclude.has(e) && minionTypesForExclude.has(e)) return false;
      continue;
    }
    if (typesForExclude.has(e)) return false;
  }
  return true;
}
