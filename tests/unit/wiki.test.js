import { describe, it, expect } from 'vitest';
import { getGemWikiUrl } from '../../src/utils/wiki.js';

describe('getGemWikiUrl', () => {
  it('replaces spaces with underscores', () => {
    expect(getGemWikiUrl('Impending Doom Support')).toBe(
      'https://www.poewiki.net/wiki/Impending_Doom_Support'
    );
  });

  it('encodes apostrophe as %27', () => {
    expect(getGemWikiUrl("Assassin's Mark")).toBe(
      'https://www.poewiki.net/wiki/Assassin%27s_Mark'
    );
  });

  it('encodes umlauts in URL', () => {
    expect(getGemWikiUrl('Summon Chaos Golem of the Maelström')).toBe(
      'https://www.poewiki.net/wiki/Summon_Chaos_Golem_of_the_Maelstr%C3%B6m'
    );
  });

  it('returns base URL for empty name', () => {
    expect(getGemWikiUrl('')).toBe('https://www.poewiki.net/wiki/');
  });

  it('appends _Support for support gems when name does not already end with Support', () => {
    expect(getGemWikiUrl('Added Chaos Damage', 'support')).toBe(
      'https://www.poewiki.net/wiki/Added_Chaos_Damage_Support'
    );
  });

  it('does not double-append _Support when support gem name already ends with Support', () => {
    expect(getGemWikiUrl('Impending Doom Support', 'support')).toBe(
      'https://www.poewiki.net/wiki/Impending_Doom_Support'
    );
  });

  it('uses Portal_(skill_gem) for active skill gem Portal', () => {
    expect(getGemWikiUrl('Portal', 'active')).toBe(
      'https://www.poewiki.net/wiki/Portal_(skill_gem)'
    );
  });
});
