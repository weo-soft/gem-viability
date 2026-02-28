/**
 * Pure compatibility logic: which support gems can support which active gems.
 * Rule:
 * - requireSkillTypes: parsed using special SkillTypes "OR" and "AND". If AND is present,
 *   expression is (OR-group) AND (OR-group) AND ... where OR-groups are separated by AND.
 *   If only OR is present or no special types, active must match AT LEAST ONE (OR). Empty passes.
 * - excludeSkillTypes: active must match NONE (operator tokens OR/AND/NOT are ignored when checking).
 */

const OPERATORS = new Set(['OR', 'AND', 'NOT']);

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
 * Build the set of skill types to check for compatibility. Includes skillTypes and, when present, minionSkillTypes
 * (e.g. Animate Weapon of Ranged Arms has minionSkillTypes including Projectile types, so projectile supports apply).
 * @param {{ skillTypes?: string[], minionSkillTypes?: string[] }} active
 * @returns {Set<string>}
 */
function getActiveTypesForCompatibility(active) {
  const types = new Set(active.skillTypes || []);
  const minionSkillTypes = active.minionSkillTypes || [];
  for (const t of minionSkillTypes) types.add(t);
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
  const activeTypes = getActiveTypesForCompatibility(active);
  const ids = gems
    .filter((g) => g.kind === 'support' && canSupport(activeTypes, g))
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
    .filter((g) => g.kind === 'active' && canSupport(getActiveTypesForCompatibility(g), support))
    .map((g) => g.id);
  return deduplicateByIdentity(ids, gems);
}

/**
 * @param {Set<string>} activeTypes
 * @param {{ requireSkillTypes?: string[], excludeSkillTypes?: string[] }} support
 * @returns {boolean}
 */
function canSupport(activeTypes, support) {
  const require = support.requireSkillTypes || [];
  const exclude = support.excludeSkillTypes || [];
  if (!requireSkillTypesMatch(activeTypes, require)) return false;
  for (const e of exclude) {
    if (!isOperator(e) && activeTypes.has(e)) return false;
  }
  return true;
}
