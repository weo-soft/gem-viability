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
  'TriggeredSupportWindburst', // triggered half of Windburst only; SupportWindburst is the regular support
  'ThunderstormMiniTornados', // Thunderburst
  // Secondary supports (triggered/granted half of dual-skill gems; same display name as primary)
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
  'SupportCastWhileChannellingTriggered', // Cast while Channelling (triggered half)
  'SupportCastWhileChannellingTriggeredPlus', // Awakened Cast While Channelling (triggered half)
  'SupportCurseOnHitCurse', // Hextouch (triggered curse half)
  'SupportCurseOnHitCursePlus', // Awakened Hextouch (triggered half)
  'SupportCastOnMeleeKillTriggered', // Cast on Melee Kill (triggered half)
  'SupportCastOnCritTriggered', // Cast On Critical Strike (triggered half)
  'SupportCastOnCritTriggeredPlus', // Awakened Cast On Critical Strike (triggered half)
]);
