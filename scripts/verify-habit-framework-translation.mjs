import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Vietnamese is authoritative. Each translation must mirror its structure exactly, keep every number,
// and leave no Vietnamese text behind in the fields that were translated.
const vietnamese = JSON.parse(readFileSync(resolve('src/data/habit-framework-v1.vi.json'), 'utf8'));
// Languages not listed here fall back to the English text in the app. Add a language once its file exists.
const LANGUAGES = ['en', 'ko', 'fr', 'de', 'it', 'es', 'zh', 'ja'];

// Letters that only Vietnamese uses (plain â, ê, ô, à, é… are ordinary in French, Spanish and Italian).
const VIETNAMESE_LETTERS = /[ăơưđĂƠƯĐạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ]/u;
const SCRIPT_CHECK = {
  zh: /[一-鿿]/u,
  ja: /[぀-ヿ一-鿿]/u,
  ko: /[가-힯]/u,
};

const failures = [];

function verify(language) {
  const fail = (message) => failures.push(`[${language}] ${message}`);
  const file = resolve(`public/data/habit-framework-v1.${language}.json`);
  if (!existsSync(file)) return fail(`public/data/habit-framework-v1.${language}.json is missing`);
  const translated = JSON.parse(readFileSync(file, 'utf8'));

  const text = (path, value) => {
    if (typeof value !== 'string' || value.trim() === '') return fail(`${path} must be a non-empty string`);
    if (VIETNAMESE_LETTERS.test(value)) fail(`${path} still contains Vietnamese text: ${value.slice(0, 60)}`);
  };

  if (translated.language !== language) fail(`language must be "${language}"`);
  if (translated.schemaVersion !== vietnamese.schemaVersion) fail('schemaVersion differs from the Vietnamese file');
  if (translated.contentVersion !== vietnamese.contentVersion) fail('contentVersion differs from the Vietnamese file');
  if (JSON.stringify(translated.source) !== JSON.stringify(vietnamese.source)) fail('source must match the Vietnamese file');
  if (JSON.stringify(translated.review) !== JSON.stringify(vietnamese.review)) fail('review must match the Vietnamese file');
  if (translated.translation?.authoritativeLanguage !== 'vi') fail('translation.authoritativeLanguage must be "vi"');
  if (translated.translation?.translatedFromContentVersion !== vietnamese.contentVersion) fail('translation.translatedFromContentVersion must name the Vietnamese contentVersion');

  if (translated.stages.length !== vietnamese.stages.length) fail('stage count differs');
  vietnamese.stages.forEach((stage, index) => {
    const entry = translated.stages[index];
    if (!entry || entry.id !== stage.id || entry.ageRange !== stage.ageRange) {
      fail(`stage ${index} must keep id ${stage.id} and ageRange ${stage.ageRange}`);
      return;
    }
    text(`stages[${stage.id}].title`, entry.title);
    text(`stages[${stage.id}].adultRole`, entry.adultRole);
  });

  if (translated.habits.length !== vietnamese.habits.length) fail(`habit count ${translated.habits.length} differs from ${vietnamese.habits.length}`);
  vietnamese.habits.forEach((habit, index) => {
    const entry = translated.habits[index];
    if (!entry || entry.id !== habit.id) {
      fail(`habit ${index} must be ${habit.id} in the same order`);
      return;
    }
    for (const key of ['sourceAliases', 'stageId', 'ageRange', 'primaryDomain', 'conceptTags']) {
      if (JSON.stringify(entry[key]) !== JSON.stringify(habit[key])) fail(`${habit.id}.${key} must not change`);
    }
    for (const key of ['name', 'childMeaning', 'successSignal', 'parentGuidance', 'measurement']) text(`${habit.id}.${key}`, entry[key]);
    if (!Array.isArray(entry.activities) || entry.activities.length !== habit.activities.length) {
      fail(`${habit.id}.activities must keep ${habit.activities.length} items`);
    } else {
      entry.activities.forEach((activity, position) => text(`${habit.id}.activities[${position}]`, activity));
    }
    // Numbers carry the measurable part of a habit, so the same digits must survive translation.
    const digits = (value) => (String(value).match(/\d+/g) ?? []).join(',');
    for (const key of ['successSignal', 'measurement']) {
      if (digits(habit[key]) !== digits(entry[key])) fail(`${habit.id}.${key} changed its numbers`);
    }
    const script = SCRIPT_CHECK[language];
    if (script && !script.test(String(entry.name))) fail(`${habit.id}.name is not written in the expected script`);
  });
}

for (const language of LANGUAGES) verify(language);

if (failures.length > 0) {
  process.stderr.write(`Habit framework translation check failed (${failures.length}):\n${failures.slice(0, 40).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`Habit framework translations verified: ${LANGUAGES.join(', ')} (${vietnamese.habits.length} habits, ${vietnamese.stages.length} stages each).\n`);
