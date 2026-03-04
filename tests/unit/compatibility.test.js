import { describe, it, expect } from 'vitest';
import { getSupportsForActive, getActivesForSupport } from '../../src/compatibility.js';

const fixtureGems = [
  { id: 'Fireball', kind: 'active', skillTypes: ['Spell', 'Damage', 'Projectile', 'Area'], primaryStat: 'int' },
  { id: 'Cleave', kind: 'active', skillTypes: ['Attack', 'Damage', 'Melee'], primaryStat: 'str' },
  { id: 'SupportSpellDamage', kind: 'support', requireSkillTypes: ['Spell'], excludeSkillTypes: [], primaryStat: 'int' },
  { id: 'SupportAttackDamage', kind: 'support', requireSkillTypes: ['Attack'], excludeSkillTypes: [], primaryStat: 'str' },
  { id: 'SupportNoMinion', kind: 'support', requireSkillTypes: ['Spell'], excludeSkillTypes: ['Minion'], primaryStat: 'int' },
  { id: 'SupportSpellOrAttack', kind: 'support', requireSkillTypes: ['Spell', 'Attack'], excludeSkillTypes: [], primaryStat: 'dex' },
];

describe('getSupportsForActive', () => {
  it('returns support ids that match requireSkillTypes and not excludeSkillTypes', () => {
    expect(getSupportsForActive('Fireball', fixtureGems)).toContain('SupportSpellDamage');
    expect(getSupportsForActive('Fireball', fixtureGems)).not.toContain('SupportAttackDamage');
    expect(getSupportsForActive('Cleave', fixtureGems)).toContain('SupportAttackDamage');
    expect(getSupportsForActive('Cleave', fixtureGems)).not.toContain('SupportSpellDamage');
  });

  it('treats requireSkillTypes as OR when no AND (at least one must match)', () => {
    expect(getSupportsForActive('Fireball', fixtureGems)).toContain('SupportSpellOrAttack');
    expect(getSupportsForActive('Cleave', fixtureGems)).toContain('SupportSpellOrAttack');
  });

  it('treats requireSkillTypes with AND as all listed types must match', () => {
    const supportSpellAndTrigger = {
      id: 'SupportSpellTrigger',
      kind: 'support',
      requireSkillTypes: ['Triggerable', 'Spell', 'AND'],
      excludeSkillTypes: [],
      primaryStat: 'int',
    };
    const spellOnly = { id: 'SpellOnly', kind: 'active', skillTypes: ['Spell'], primaryStat: 'int' };
    const triggerOnly = { id: 'TriggerOnly', kind: 'active', skillTypes: ['Triggerable'], primaryStat: 'int' };
    const spellAndTrigger = { id: 'SpellTrigger', kind: 'active', skillTypes: ['Spell', 'Triggerable'], primaryStat: 'int' };
    const gems = [...fixtureGems, supportSpellAndTrigger, spellOnly, triggerOnly, spellAndTrigger];
    expect(getSupportsForActive('SpellOnly', gems)).not.toContain('SupportSpellTrigger');
    expect(getSupportsForActive('TriggerOnly', gems)).not.toContain('SupportSpellTrigger');
    expect(getSupportsForActive('SpellTrigger', gems)).toContain('SupportSpellTrigger');
  });

  it('evaluates (A OR B) AND C for requireSkillTypes like Locus Mine', () => {
    const supportLocusMine = {
      id: 'SupportLocusMine',
      kind: 'support',
      requireSkillTypes: ['Projectile', 'ThresholdJewelProjectile', 'OR', 'RangedAttack', 'ThresholdJewelRangedAttack', 'OR', 'AND', 'Mineable', 'AND'],
      excludeSkillTypes: [],
      primaryStat: 'dex',
    };
    const projectileRangedMineable = {
      id: 'IceShot',
      kind: 'active',
      skillTypes: ['Projectile', 'RangedAttack', 'Mineable'],
      primaryStat: 'dex',
    };
    const noMineable = {
      id: 'SomeBow',
      kind: 'active',
      skillTypes: ['Projectile', 'RangedAttack'],
      primaryStat: 'dex',
    };
    const gems = [...fixtureGems, supportLocusMine, projectileRangedMineable, noMineable];
    expect(getSupportsForActive('IceShot', gems)).toContain('SupportLocusMine');
    expect(getSupportsForActive('SomeBow', gems)).not.toContain('SupportLocusMine');
  });

  it('excludes supports whose excludeSkillTypes match the active', () => {
    const withMinion = [...fixtureGems, { id: 'SummonSkelly', kind: 'active', skillTypes: ['Spell', 'Minion'], primaryStat: 'int' }];
    const supports = getSupportsForActive('SummonSkelly', withMinion);
    expect(supports).not.toContain('SupportNoMinion');
  });

  it('ignores OR/AND/NOT in excludeSkillTypes when checking (structural tokens only)', () => {
    const supportWithOperatorsInExclude = {
      id: 'SupportExcludeWithOps',
      kind: 'support',
      requireSkillTypes: ['Spell'],
      excludeSkillTypes: ['Minion', 'NOT', 'AND'],
      primaryStat: 'int',
    };
    const spellMinion = { id: 'SummonSkelly', kind: 'active', skillTypes: ['Spell', 'Minion'], primaryStat: 'int' };
    const gems = [...fixtureGems, supportWithOperatorsInExclude, spellMinion];
    expect(getSupportsForActive('SummonSkelly', gems)).not.toContain('SupportExcludeWithOps');
    expect(getSupportsForActive('Fireball', gems)).toContain('SupportExcludeWithOps');
  });

  it('returns empty array for unknown or non-active id', () => {
    expect(getSupportsForActive('Unknown', fixtureGems)).toEqual([]);
    expect(getSupportsForActive('SupportSpellDamage', fixtureGems)).toEqual([]);
  });

  it('uses minionSkillTypes when present (e.g. Animate Weapon of Ranged Arms + projectile supports)', () => {
    const animateWeaponRanged = {
      id: 'AnimateWeaponAltY',
      kind: 'active',
      skillTypes: ['Triggerable', 'Duration', 'Minion', 'Spell'],
      minionSkillTypes: ['Attack', 'ProjectilesFromUser', 'ThresholdJewelProjectile', 'ThresholdJewelRangedAttack'],
      primaryStat: 'dex',
    };
    const supportVolley = {
      id: 'SupportVolley',
      kind: 'support',
      requireSkillTypes: ['ProjectilesFromUser'],
      excludeSkillTypes: [],
      primaryStat: 'dex',
    };
    const supportPierce = {
      id: 'SupportPierce',
      kind: 'support',
      requireSkillTypes: ['Projectile', 'ThresholdJewelProjectile', 'ThresholdJewelRangedAttack'],
      excludeSkillTypes: [],
      primaryStat: 'dex',
    };
    const gems = [...fixtureGems, animateWeaponRanged, supportVolley, supportPierce];
    const supports = getSupportsForActive('AnimateWeaponAltY', gems);
    expect(supports).toContain('SupportVolley');
    expect(supports).toContain('SupportPierce');
  });

  it('ignores minionSkillTypes when support has ignoreMinionTypes: true', () => {
    const minionWithSpellMinionTypes = {
      id: 'SummonSkelly',
      kind: 'active',
      skillTypes: ['Spell', 'Minion', 'Duration'],
      minionSkillTypes: ['Attack', 'Spell', 'Melee'],
      primaryStat: 'int',
    };
    const supportRequiresSpell = {
      id: 'SupportSpellOnly',
      kind: 'support',
      requireSkillTypes: ['Spell'],
      excludeSkillTypes: [],
      ignoreMinionTypes: true,
      primaryStat: 'int',
    };
    const supportRequiresAttack = {
      id: 'SupportAttackOnly',
      kind: 'support',
      requireSkillTypes: ['Attack'],
      excludeSkillTypes: [],
      ignoreMinionTypes: true,
      primaryStat: 'str',
    };
    const gems = [...fixtureGems, minionWithSpellMinionTypes, supportRequiresSpell, supportRequiresAttack];
    const supports = getSupportsForActive('SummonSkelly', gems);
    expect(supports).toContain('SupportSpellOnly'); // Spell is in skillTypes
    expect(supports).not.toContain('SupportAttackOnly'); // Attack only in minionSkillTypes, ignored
  });
});

describe('getActivesForSupport', () => {
  it('returns active ids that the support can support', () => {
    const actives = getActivesForSupport('SupportSpellDamage', fixtureGems);
    expect(actives).toContain('Fireball');
    expect(actives).not.toContain('Cleave');
  });

  it('returns empty array for unknown or non-support id', () => {
    expect(getActivesForSupport('Unknown', fixtureGems)).toEqual([]);
    expect(getActivesForSupport('Fireball', fixtureGems)).toEqual([]);
  });
});
