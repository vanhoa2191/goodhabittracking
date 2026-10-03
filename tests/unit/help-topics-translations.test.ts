import { describe, expect, it } from 'vitest';
import { HELP_TOPIC_IDS, type HelpTopicId } from '@/lib/guide/help-topic-id';
import { HELP_TOPICS, type HelpText } from '@/lib/guide/help-topics';
import { helpTextFor, loadHelpTranslation, type HelpTranslation } from '@/lib/guide/help-topics-loader';
import { HELP_TOPICS_DE } from '@/lib/guide/help-topics-de';
import { HELP_TOPICS_ES } from '@/lib/guide/help-topics-es';
import { HELP_TOPICS_FR } from '@/lib/guide/help-topics-fr';
import { HELP_TOPICS_IT } from '@/lib/guide/help-topics-it';
import { HELP_TOPICS_JA } from '@/lib/guide/help-topics-ja';
import { HELP_TOPICS_KO } from '@/lib/guide/help-topics-ko';
import { HELP_TOPICS_ZH } from '@/lib/guide/help-topics-zh';
import { getJourneyStageCopy } from '@/lib/i18n/journey-stage-copy';
import { JOURNEY_STAGES } from '@/lib/journeys/age-journeys';
import type { Language } from '@/types';

type Translated = Exclude<Language, 'vi' | 'en'>;

const TRANSLATIONS: Readonly<Record<Translated, HelpTranslation>> = {
  fr: HELP_TOPICS_FR,
  de: HELP_TOPICS_DE,
  it: HELP_TOPICS_IT,
  es: HELP_TOPICS_ES,
  zh: HELP_TOPICS_ZH,
  ja: HELP_TOPICS_JA,
  ko: HELP_TOPICS_KO,
};
const TRANSLATED = Object.keys(TRANSLATIONS) as Translated[];
const ALL_LANGUAGES: readonly Language[] = ['vi', 'en', ...TRANSLATED];

// Letters only Vietnamese uses (not French, Italian or Spanish accents): a hit means a Vietnamese string was left in.
const VIETNAMESE_ONLY = /[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u;

describe('help topic translations', () => {
  for (const language of TRANSLATED) {
    const table = TRANSLATIONS[language];

    describe(language, () => {
      it('has exactly the topic ids, each with a title and a text', () => {
        expect(Object.keys(table).sort()).toEqual([...HELP_TOPIC_IDS].sort());
        for (const id of HELP_TOPIC_IDS) {
          expect(table[id].title.trim().length, `${id} title`).toBeGreaterThan(0);
          expect(table[id].text.trim().length, `${id} text`).toBeGreaterThan(0);
        }
      });

      it('has no Vietnamese left in it and is not a copy of the Vietnamese text', () => {
        for (const id of HELP_TOPIC_IDS) {
          const { title, text } = table[id];
          expect(VIETNAMESE_ONLY.test(title.normalize('NFC')), `${id} title: ${title}`).toBe(false);
          expect(VIETNAMESE_ONLY.test(text.normalize('NFC')), `${id} text: ${text}`).toBe(false);
          expect(title, `${id} title equals the Vietnamese one`).not.toBe(HELP_TOPICS[id].vi.title);
          expect(text, `${id} text equals the Vietnamese one`).not.toBe(HELP_TOPICS[id].vi.text);
        }
      });

      it('is not much longer than the English text (catches repeated or runaway strings)', () => {
        for (const id of HELP_TOPIC_IDS) {
          const limit = HELP_TOPICS[id].en.text.length * 1.5 + 40;
          expect(table[id].text.length, `${id} text is ${table[id].text.length} long, limit ${limit}`).toBeLessThanOrEqual(limit);
        }
      });
    });
  }
});

describe('helpTextFor', () => {
  const id: HelpTopicId = 'today.card';
  const topic = HELP_TOPICS[id];
  const translated: HelpText = { title: 'Titre', text: 'Texte' };
  const table = { ...TRANSLATIONS.fr, [id]: translated } as HelpTranslation;

  it('reads Vietnamese and English from the topic itself', () => {
    expect(helpTextFor(id, topic, table, 'vi')).toBe(topic.vi);
    expect(helpTextFor(id, topic, table, 'en')).toBe(topic.en);
  });

  it('uses the translation when it has the topic', () => {
    expect(helpTextFor(id, topic, table, 'fr')).toBe(translated);
  });

  it('falls back to English without a translation, without the topic, or with an empty title or text', () => {
    expect(helpTextFor(id, topic, null, 'fr')).toBe(topic.en);
    expect(helpTextFor(id, topic, undefined, 'ja')).toBe(topic.en);
    const missing = { ...table } as Partial<Record<HelpTopicId, HelpText>>;
    delete missing[id];
    expect(helpTextFor(id, topic, missing as HelpTranslation, 'fr')).toBe(topic.en);
    expect(helpTextFor(id, topic, { ...table, [id]: { title: '', text: 'Texte' } } as HelpTranslation, 'fr')).toBe(topic.en);
    expect(helpTextFor(id, topic, { ...table, [id]: { title: 'Titre', text: '  ' } } as HelpTranslation, 'fr')).toBe(topic.en);
  });
});

describe('loadHelpTranslation', () => {
  it('has nothing to load for Vietnamese and English', async () => {
    expect(await loadHelpTranslation('vi')).toBeNull();
    expect(await loadHelpTranslation('en')).toBeNull();
  });

  it('loads each other language once and keeps it', async () => {
    for (const language of TRANSLATED) {
      const loaded = await loadHelpTranslation(language);
      expect(loaded, language).toBe(TRANSLATIONS[language]);
      expect(loadHelpTranslation(language)).toBe(loadHelpTranslation(language));
    }
  });
});

describe('journey stage copy', () => {
  it('has a title and an adult role for every language and stage', () => {
    for (const language of ALL_LANGUAGES) {
      for (const stage of JOURNEY_STAGES) {
        const copy = getJourneyStageCopy(language, stage.id);
        expect(copy.title.trim().length, `${language} ${stage.id} title`).toBeGreaterThan(0);
        expect(copy.adultRole.trim().length, `${language} ${stage.id} adultRole`).toBeGreaterThan(0);
      }
    }
  });

  it('matches the stage data in Vietnamese and English', () => {
    for (const stage of JOURNEY_STAGES) {
      expect(getJourneyStageCopy('vi', stage.id)).toEqual({ title: stage.title.vi, adultRole: stage.adultRole.vi });
      expect(getJourneyStageCopy('en', stage.id)).toEqual({ title: stage.title.en, adultRole: stage.adultRole.en });
    }
  });

  it('has no Vietnamese left in the other languages', () => {
    for (const language of TRANSLATED) {
      for (const stage of JOURNEY_STAGES) {
        const { title, adultRole } = getJourneyStageCopy(language, stage.id);
        expect(VIETNAMESE_ONLY.test(`${title} ${adultRole}`.normalize('NFC')), `${language} ${stage.id}`).toBe(false);
      }
    }
  });
});
