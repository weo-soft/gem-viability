/** Shared variant filter rules for cluster rendering and compatibility panel lists. */

export const ACTIVE_VARIANTS = ['normal', 'transfigured', 'vaal', 'trarthus'];

export const defaultVariantFilters = {
  normal: true,
  transfigured: true,
  vaal: true,
  normalSupport: true,
  awakened: true,
  trarthus: true,
  exceptional: true,
  legacy: true,
  recipeOnly: true,
};

export function isActiveVariant(variant) {
  return ACTIVE_VARIANTS.includes(variant);
}

export function filterIdsByVariantForActives(gemById, ids, variantFilters) {
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

export function filterIdsByVariantForSupports(gemById, ids, variantFilters) {
  const filters = variantFilters || defaultVariantFilters;
  return ids.filter((id) => {
    const g = gemById.get(id);
    if (!g) return false;
    const v = g.variant || 'normal';
    if (g.exceptional && filters.exceptional === true) return true;
    if (v === 'normal') {
      if (filters.normalSupport === false) return false;
    } else if (filters[v] === false) {
      return false;
    }
    if (g.exceptional && filters.exceptional === false) return false;
    return true;
  });
}
