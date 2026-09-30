import type { ActivityLogStatus } from '@/types';

type PromptLog = {
  readonly id: string;
  readonly activityId: string;
  readonly childId: string;
  readonly date: string;
  readonly status: ActivityLogStatus;
};

type PromptContext = {
  /** `${childId}:${activityId}` of every habit that has a cue plan. */
  readonly planned: ReadonlySet<string>;
  /** Logs that already have a saved support level. */
  readonly recorded: ReadonlySet<string>;
  /** Logs answered during this visit, kept on screen briefly as a confirmation. */
  readonly saved: ReadonlySet<string>;
  readonly today: string;
  readonly yesterday: string;
};

export const MAX_UNANSWERED_PROMPTS = 6;
export const MAX_CONFIRMATIONS = 3;

/** Unanswered questions come first so answered rows never take their place; only the latest confirmations stay. */
export function selectSupportPromptItems<T extends PromptLog>(logs: readonly T[], context: PromptContext): T[] {
  const eligible = logs.filter((log) => (log.status === 'completed' || log.status === 'approved')
    && (log.date === context.today || log.date === context.yesterday)
    && context.planned.has(`${log.childId}:${log.activityId}`));
  const unanswered = eligible.filter((log) => !context.recorded.has(log.id)).slice(0, MAX_UNANSWERED_PROMPTS);
  const confirmations = eligible.filter((log) => context.saved.has(log.id)).slice(-MAX_CONFIRMATIONS);
  return [...unanswered, ...confirmations];
}

type ChildOption = { readonly id: string; readonly name: string };

/** Which children a cue can be written for, and which one is preselected. Shared habits never silently pick a child. */
export function cueChildOptions<P extends ChildOption>(
  activity: { readonly childId: string | null },
  profiles: readonly P[],
  listFilterChildId: string,
  activeChildId: string | null,
): { options: P[]; defaultId: string | null } {
  const fixedId = activity.childId ?? (listFilterChildId !== 'all' ? listFilterChildId : null);
  if (fixedId) {
    const only = profiles.find((profile) => profile.id === fixedId);
    return only ? { options: [only], defaultId: only.id } : { options: [], defaultId: null };
  }
  const options = [...profiles];
  const preferred = options.find((profile) => profile.id === activeChildId) ?? options[0];
  return { options, defaultId: preferred?.id ?? null };
}

/** Closing an editor only clears the state when it is still that editor that is open. */
export function keepIfOtherEditor<T>(current: T | null, finished: T): T | null {
  return current === finished ? null : current;
}
