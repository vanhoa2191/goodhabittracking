import { z } from 'zod';

const sectionRefSchema = z.object({
  id: z.string().min(1),
  /** 2 and 3 are headings; 0 is a part of a section that has an anchor of its own but no heading. */
  level: z.number().int().min(0).max(3),
  title: z.string(),
});

export const guideIndexSchema = z.array(z.object({
  slug: z.string().min(1),
  number: z.string().nullable(),
  title: z.string().min(1),
  summary: z.string(),
  sections: z.array(sectionRefSchema),
}));

export const guideChapterSchema = z.object({
  slug: z.string().min(1),
  number: z.string().nullable(),
  title: z.string().min(1),
  summary: z.string(),
  sections: z.array(sectionRefSchema.extend({ html: z.string(), text: z.string() })),
});

export type GuideIndex = z.infer<typeof guideIndexSchema>;
export type GuideIndexEntry = GuideIndex[number];
export type GuideChapter = z.infer<typeof guideChapterSchema>;
export type GuideSection = GuideChapter['sections'][number];
