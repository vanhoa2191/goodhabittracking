import { describe, expect, it } from 'vitest';
import {
  buildParentSectionUrl,
  DEFAULT_PARENT_SECTION,
  PARENT_SECTIONS,
  parseParentSection,
  parseSettingsAnchor,
  SETTINGS_SECTIONS,
} from '@/lib/parent-section-url';
import { getSettingsLayoutCopy } from '@/lib/i18n/settings-layout-copy';
import type { Language } from '@/types';

const LANGUAGES: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('parseParentSection', () => {
  it('opens approvals when the URL names no section', () => {
    expect(parseParentSection('', '')).toBe(DEFAULT_PARENT_SECTION);
    expect(parseParentSection('?demo=1', '')).toBe('approvals');
  });

  it.each(PARENT_SECTIONS)('accepts the section %s', (section) => {
    expect(parseParentSection(`?section=${section}`, '')).toBe(section);
  });

  it('ignores unknown, empty and differently cased values', () => {
    for (const search of ['?section=admin', '?section=', '?section=Settings', '?section=__proto__', '?section=settings%20']) {
      expect(parseParentSection(search, '')).toBe('approvals');
    }
  });

  it('opens settings for a valid settings anchor with no section', () => {
    expect(parseParentSection('', '#settings-security')).toBe('settings');
    expect(parseParentSection('?demo=1', '#settings-offers')).toBe('settings');
  });

  it('ignores a hash that is not a settings anchor', () => {
    expect(parseParentSection('', '#settings-unknown')).toBe('approvals');
    expect(parseParentSection('', '#parent-section-panel')).toBe('approvals');
    expect(parseParentSection('', '#')).toBe('approvals');
  });

  it('lets an explicit section win over the anchor', () => {
    expect(parseParentSection('?section=habits', '#settings-security')).toBe('habits');
  });

  it('falls back to the anchor when the section value is unknown', () => {
    expect(parseParentSection('?section=nope', '#settings-privacy')).toBe('settings');
  });
});

describe('parseSettingsAnchor', () => {
  it('accepts every settings group and nothing else', () => {
    for (const { id } of SETTINGS_SECTIONS) expect(parseSettingsAnchor(`#${id}`)).toBe(id);
    expect(parseSettingsAnchor('settings-security')).toBe('settings-security');
    expect(parseSettingsAnchor('#family-pause-title')).toBeNull();
    expect(parseSettingsAnchor('')).toBeNull();
  });
});

describe('buildParentSectionUrl', () => {
  const home = { pathname: '/', search: '', hash: '' };

  it('writes the section and leaves no parameter for the default', () => {
    expect(buildParentSectionUrl(home, 'habits')).toBe('/?section=habits');
    expect(buildParentSectionUrl({ ...home, search: '?section=habits' }, 'approvals')).toBe('/');
  });

  it('keeps the other parameters', () => {
    expect(buildParentSectionUrl({ ...home, search: '?demo=1&ref=ABCD1234' }, 'rewards')).toBe('/?demo=1&ref=ABCD1234&section=rewards');
    expect(buildParentSectionUrl({ ...home, search: '?demo=1&section=rewards' }, 'approvals')).toBe('/?demo=1');
    expect(buildParentSectionUrl({ ...home, search: '?section=rewards&demo=1' }, 'children')).toBe('/?section=children&demo=1');
  });

  it('keeps a valid settings anchor on settings', () => {
    expect(buildParentSectionUrl({ ...home, search: '?section=settings', hash: '#settings-security' }, 'settings')).toBe('/?section=settings#settings-security');
    expect(buildParentSectionUrl({ ...home, hash: '#settings-offers' }, 'settings')).toBe('/?section=settings#settings-offers');
  });

  it('drops a settings anchor when leaving settings so the hash cannot reopen it', () => {
    const url = buildParentSectionUrl({ ...home, search: '?section=settings', hash: '#settings-security' }, 'approvals');
    expect(url).toBe('/');
    const [pathAndQuery, hash = ''] = url.split('#');
    expect(parseParentSection(pathAndQuery.slice(1), hash ? `#${hash}` : '')).toBe('approvals');
  });

  it('keeps a hash that is not a settings anchor', () => {
    expect(buildParentSectionUrl({ ...home, hash: '#other' }, 'habits')).toBe('/?section=habits#other');
  });

  it('round-trips through the parser for every section', () => {
    for (const section of PARENT_SECTIONS) {
      const url = new URL(buildParentSectionUrl(home, section), 'https://example.test');
      expect(parseParentSection(url.search, url.hash)).toBe(section);
    }
  });
});

describe('settings groups', () => {
  it('has a unique id and a nav label in every language for each group', () => {
    expect(new Set(SETTINGS_SECTIONS.map((section) => section.id)).size).toBe(SETTINGS_SECTIONS.length);
    for (const language of LANGUAGES) {
      const copy = getSettingsLayoutCopy(language);
      for (const { nav } of SETTINGS_SECTIONS) expect(copy[nav].trim()).not.toBe('');
    }
  });

  it('names the offers group in all nine languages, apart from the account group', () => {
    for (const language of LANGUAGES) {
      const copy = getSettingsLayoutCopy(language);
      expect(copy.navOffers.trim()).not.toBe('');
      expect(copy.sectionOffers.trim()).not.toBe('');
      expect(copy.sectionOffers).not.toBe(copy.sectionAccount);
    }
  });
});
