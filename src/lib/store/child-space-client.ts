import {
  normalizeSpaceNote,
  spaceSnapshotSchema,
  type SpaceMood,
  type SpaceNoteKind,
  type SpaceReason,
  type SpaceSnapshot,
} from '@/lib/child-space';

export type ChildSpaceMode = 'paired' | 'parent' | 'local';
export const EMPTY_SPACE: SpaceSnapshot = { moods: [], notes: [] };

const localKey = (childId: string) => `kidhabit.child-space.local.v1.${childId}`;

/** Only a paired child device writes to the cloud; a parent previewing the screen and local practice stay on this device. */
function readLocal(childId: string): SpaceSnapshot {
  try {
    const parsed = spaceSnapshotSchema.safeParse(JSON.parse(window.localStorage.getItem(localKey(childId)) ?? 'null'));
    return parsed.success ? parsed.data : EMPTY_SPACE;
  } catch {
    return EMPTY_SPACE;
  }
}

function writeLocal(childId: string, snapshot: SpaceSnapshot): void {
  try { window.localStorage.setItem(localKey(childId), JSON.stringify(snapshot)); } catch { /* storage unavailable */ }
}

const json = { 'content-type': 'application/json' };

export async function loadChildSpace(childId: string, mode: ChildSpaceMode): Promise<SpaceSnapshot | null> {
  if (mode !== 'paired') return readLocal(childId);
  try {
    const response = await fetch('/api/child/space', { cache: 'no-store' });
    const parsed = spaceSnapshotSchema.safeParse(await response.json());
    return response.ok && parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveSpaceMood(
  childId: string, mode: ChildSpaceMode, date: string, mood: SpaceMood, reason: SpaceReason | null,
): Promise<boolean> {
  if (mode === 'paired') {
    try {
      return (await fetch('/api/child/space', { method: 'PUT', headers: json, body: JSON.stringify({ type: 'mood', date, mood, reason }) })).ok;
    } catch {
      return false;
    }
  }
  const current = readLocal(childId);
  writeLocal(childId, { ...current, moods: [{ local_date: date, mood, reason }, ...current.moods.filter((entry) => entry.local_date !== date)] });
  return true;
}

export async function saveSpaceNote(
  childId: string, mode: ChildSpaceMode, date: string, kind: SpaceNoteKind, text: string, shared: boolean,
): Promise<boolean> {
  const note = normalizeSpaceNote(text);
  if (!note) return false;
  if (mode === 'paired') {
    try {
      return (await fetch('/api/child/space', { method: 'PUT', headers: json, body: JSON.stringify({ type: 'note', date, kind, text: note, shared }) })).ok;
    } catch {
      return false;
    }
  }
  const current = readLocal(childId);
  writeLocal(childId, {
    ...current,
    notes: [{ local_date: date, kind, note_text: note, shared_with_parent: shared },
      ...current.notes.filter((entry) => !(entry.local_date === date && entry.kind === kind))],
  });
  return true;
}

export async function deleteSpaceNote(childId: string, mode: ChildSpaceMode, date: string, kind: SpaceNoteKind): Promise<boolean> {
  if (mode === 'paired') {
    try {
      return (await fetch('/api/child/space', { method: 'DELETE', headers: json, body: JSON.stringify({ date, kind }) })).ok;
    } catch {
      return false;
    }
  }
  const current = readLocal(childId);
  writeLocal(childId, { ...current, notes: current.notes.filter((entry) => !(entry.local_date === date && entry.kind === kind)) });
  return true;
}

export async function loadParentChildSpace(childId: string): Promise<SpaceSnapshot | null> {
  try {
    const response = await fetch(`/api/domain/child-space?childId=${encodeURIComponent(childId)}`, { cache: 'no-store' });
    const parsed = spaceSnapshotSchema.safeParse(await response.json());
    return response.ok && parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
