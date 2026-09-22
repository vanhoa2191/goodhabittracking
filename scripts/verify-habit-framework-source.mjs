import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dataPath = resolve('src/data/habit-framework-v1.vi.json');
const manifestPath = resolve('docs/schemas/habit-framework-v1.reconciliation.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function recordPayload(habit) {
  return JSON.stringify({
    id: habit.id,
    sourceAliases: habit.sourceAliases,
    stageId: habit.stageId,
    ageRange: habit.ageRange,
    primaryDomain: habit.primaryDomain,
    name: habit.name,
    childMeaning: habit.childMeaning,
    successSignal: habit.successSignal,
    activities: habit.activities,
    parentGuidance: habit.parentGuidance,
    measurement: habit.measurement,
    conceptTags: habit.conceptTags,
  });
}

function clean(value) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSource(sourceText) {
  const stageById = new Map(data.stages.map((stage) => [stage.id, stage]));
  const pattern = /^#### `(GD[1-5]-(?:NT|SK|MQH|HT|TC)-\d{2})` · (.+?)\n([\s\S]*?)(?=^#### `GD[1-5]-|^---\n# GIAI ĐOẠN|^# PHẦN)/gm;
  const habits = [];
  let match = pattern.exec(sourceText);
  while (match) {
    const sourceId = match[1];
    const body = match[3];
    const stageId = sourceId.slice(0, 3);
    const stage = stageById.get(stageId);
    if (!stage) throw new Error(`Unknown stage ${stageId}.`);
    const field = (label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const found = body.match(new RegExp(`^- \\*\\*${escaped}:\\*\\*\\s*(.+)$`, 'm'));
      if (!found) throw new Error(`Missing ${label} for ${sourceId}.`);
      return clean(found[1]);
    };
    const activitySection = body.match(/^- \*\*Hoạt động mẫu:\*\*\n([\s\S]*?)(?=^- \*\*Người lớn đồng hành:\*\*)/m);
    if (!activitySection) throw new Error(`Missing activities for ${sourceId}.`);
    const activities = [...activitySection[1].matchAll(/^\s*\d+\.\s+(.+)$/gm)]
      .map((entry) => clean(entry[1]));
    const canonicalId = sourceId === 'GD5-HT-02' ? 'GD5-TC-01' : sourceId;
    habits.push({
      id: canonicalId,
      sourceAliases: canonicalId === sourceId ? [] : [sourceId],
      stageId,
      ageRange: stage.ageRange,
      primaryDomain: canonicalId.split('-')[1],
      name: clean(match[2]),
      childMeaning: field('Định nghĩa (trẻ hiểu được)'),
      successSignal: field('Biểu hiện đạt'),
      activities,
      parentGuidance: field('Người lớn đồng hành'),
      measurement: field('Đo lường'),
      conceptTags: [...field('Bồi dưỡng').matchAll(/#(?:7Giàu|ChânDung|8TốChất|9DạngNgười|7BốThí):[^ ]+/g)]
        .map((entry) => entry[0]),
    });
    match = pattern.exec(sourceText);
  }
  return habits;
}

if (data.habits.length !== 47 || manifest.records.length !== 47) {
  throw new Error('The v1 release must contain exactly 47 reconciled habits.');
}
if (data.source.sha256 !== manifest.source.sha256) {
  throw new Error('The runtime source checksum differs from the reconciliation manifest.');
}

const manifestById = new Map(manifest.records.map((record) => [record.canonicalId, record]));
for (const habit of data.habits) {
  const record = manifestById.get(habit.id);
  if (!record || record.payloadSha256 !== digest(recordPayload(habit))) {
    throw new Error(`Unreconciled runtime habit: ${habit.id}.`);
  }
}

const sourcePath = process.argv[2];
if (sourcePath) {
  const sourceBuffer = readFileSync(resolve(sourcePath));
  if (digest(sourceBuffer) !== manifest.source.sha256) {
    throw new Error('The supplied source file checksum does not match the approved release.');
  }
  const sourceHabits = parseSource(sourceBuffer.toString('utf8'));
  if (sourceHabits.length !== 47) throw new Error('The supplied source does not contain 47 habits.');
  for (const habit of sourceHabits) {
    const record = manifestById.get(habit.id);
    if (!record || record.payloadSha256 !== digest(recordPayload(habit))) {
      throw new Error(`Source mismatch for habit: ${habit.id}.`);
    }
  }
}

console.log(`Habit framework verified: ${data.habits.length} records, source ${manifest.source.sha256}.`);
