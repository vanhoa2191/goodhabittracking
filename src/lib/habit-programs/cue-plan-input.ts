import { z } from 'zod';

/** What a person may type for a cue plan; shared by the form, the store and the server route. */
export const cuePlanFields = {
  cueKind: z.enum(['event', 'time']),
  cueText: z.string().trim().min(1).max(200),
  cueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  placeText: z.string().trim().max(120).nullable(),
  weekendVariantText: z.string().trim().max(200).nullable(),
};

/** A time cue needs a time of day; an event cue ("after dinner") must not have one. */
export function timeMatchesKind(value: { cueKind: string; cueTime: string | null }): boolean {
  return (value.cueKind === 'time') === (value.cueTime !== null);
}

export const cuePlanInputSchema = z.object(cuePlanFields).strict().refine(timeMatchesKind);

export type CuePlanInput = z.infer<typeof cuePlanInputSchema>;
