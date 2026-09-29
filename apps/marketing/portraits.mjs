import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The sixteen growth portraits (CD-01…CD-16) of the approved habit framework v1.
// Names follow docs/habit-framework-data-contract.md; habit links are read from the
// same data the app ships, so the marketing page never invents a habit-to-portrait link.
const frameworkPath = fileURLToPath(new URL('../../src/data/habit-framework-v1.vi.json', import.meta.url));

export const portraitNames = {
  'CD-01': 'Trí Tuệ Học Giả',
  'CD-02': 'Tâm Thái An Vui',
  'CD-03': 'Nhân Cách Kiện Toàn',
  'CD-04': 'Phẩm Chất Ưu Tú',
  'CD-05': 'Năng Lực Xuất Chúng',
  'CD-06': 'Thân Hình Người Mẫu',
  'CD-07': 'Sức Khỏe Người Sắt',
  'CD-08': 'Quảng Bá Siêu Phàm',
  'CD-09': 'Giao Tiếp Thông Thái',
  'CD-10': 'Luật Sắt Bản Thân',
  'CD-11': 'Tầm Nhìn Thấu Suốt',
  'CD-12': 'Thấu Hiểu Nhân Sinh',
  'CD-13': 'Bác Ái Lĩnh Chúng',
  'CD-14': 'Đức Hành Thiên Hạ',
  'CD-15': 'Lục Lộc Đại Thuận',
  'CD-16': 'Làm Người Thành Công',
};

export const summitId = 'CD-16';

const stageLabels = {
  GD1: '0–3 tuổi',
  GD2: '3–6 tuổi',
  GD3: '6–12 tuổi',
  GD4: '12–15 tuổi',
  GD5: '15–18 tuổi',
};

const stageOrder = Object.keys(stageLabels);
const preferredStageIndex = stageOrder.indexOf('GD3');

// Prefer the habit whose stage sits closest to the 6–12 stage most families start with.
function closestToPreferredStage(habits) {
  return [...habits].sort((a, b) => Math.abs(stageOrder.indexOf(a.stageId) - preferredStageIndex)
    - Math.abs(stageOrder.indexOf(b.stageId) - preferredStageIndex))[0] ?? null;
}

export function buildPortraitGuide() {
  const data = JSON.parse(readFileSync(frameworkPath, 'utf8'));
  const habitsByPortrait = new Map(Object.keys(portraitNames).map((id) => [id, []]));

  for (const habit of data.habits) {
    const linked = new Set();
    for (const tag of habit.conceptTags) {
      const match = /^#ChânDung:(CD-\d{2})-/u.exec(String(tag));
      if (match && habitsByPortrait.has(match[1])) linked.add(match[1]);
    }
    for (const id of linked) habitsByPortrait.get(id).push(habit);
  }

  const portraits = Object.entries(portraitNames).map(([id, name]) => {
    const habits = habitsByPortrait.get(id);
    const pick = closestToPreferredStage(habits);
    return {
      id,
      code: id.slice(3),
      name,
      habitCount: habits.length,
      example: pick ? { name: pick.name, stage: stageLabels[pick.stageId] ?? '', meaning: pick.childMeaning } : null,
    };
  });

  return {
    habitCount: data.habits.length,
    stageCount: data.stages.length,
    portraits,
  };
}
