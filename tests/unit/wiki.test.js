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
});
