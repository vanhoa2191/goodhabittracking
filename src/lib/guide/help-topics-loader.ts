import type { HelpTopic } from './help-topics';
import type { HelpTopicId } from './help-topic-id';

type Topics = Readonly<Record<HelpTopicId, HelpTopic>>;

let pending: Promise<Topics> | undefined;

/** The texts load on the first "?" that is used and are kept after that. */
export function loadHelpTopics(): Promise<Topics> {
  if (!pending) {
    pending = import('./help-topics').then((module) => module.HELP_TOPICS);
    pending.catch(() => { pending = undefined; });
  }
  return pending;
}
