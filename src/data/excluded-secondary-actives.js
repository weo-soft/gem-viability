/**
 * Gem IDs for secondary actives (triggered/granted) and secondary supports excluded from display and compatibility.
 * Keep in sync with EXCLUDED_GEM_IDS in scripts/generate-gems-json.js.
 */
export const EXCLUDED_SECONDARY_ACTIVE_SKILL_IDS = new Set([
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
