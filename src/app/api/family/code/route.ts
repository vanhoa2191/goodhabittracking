import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'edge';

interface ChildCodeEntry {
  code: string;
  familyId: string;
  childId: string;
  childName: string;
  childAvatar?: string;
  familyName?: string;
  parentPin?: string;
  childProfile: any;
  allProfiles: any[];
  activities: any[];
  rewards: any[];
  badges: any[];
  createdAt: string;
  updatedAt: string;
}

interface StorageSchema {
  codes: Record<string, ChildCodeEntry>; // key: code.toUpperCase()
  childToCode: Record<string, string>; // key: childId -> code
}

let memoryStorage: StorageSchema = {
  codes: {},
  childToCode: {},
};

function loadStorage(): StorageSchema {
  return memoryStorage;
}

function saveStorage(storage: StorageSchema) {
  memoryStorage = storage;
}

const CODE_PREFIX = 'HERO-';
const CHAR_SET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCode(): string {
  let result = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * CHAR_SET.length);
    result += CHAR_SET[idx];
  }
  return CODE_PREFIX + result;
}

function findUniqueCode(existingCodes: Set<string>): string {
  let attempts = 0;
  while (attempts < 1000) {
    const candidate = generateRandomCode();
    if (!existingCodes.has(candidate.toUpperCase())) {
      return candidate;
    }
    attempts++;
  }
  // Fallback with 6 characters
  let extended = 'HERO-';
  for (let i = 0; i < 6; i++) {
    extended += CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
  }
  return extended;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, familyId, childId, code, familyName, parentPin, profiles, activities, rewards, badges } = body;

    const storage = loadStorage();
    const existingCodes = new Set(Object.keys(storage.codes).map((k) => k.toUpperCase()));

    // 1. ACTION: GET_OR_CREATE PER CHILD (Generates unique code for each child profile)
    if (action === 'get_or_create' || action === 'get_or_create_per_child') {
      if (!familyId) {
        return NextResponse.json({ success: false, error: 'familyId là bắt buộc' }, { status: 400 });
      }

      const childList = Array.isArray(profiles) ? profiles : [];
      const updatedChildCodes: Record<string, string> = {};

      for (const child of childList) {
        if (!child.id) continue;

        let assignedCode = storage.childToCode[child.id];
        if (!assignedCode || !storage.codes[assignedCode.toUpperCase()]) {
          // Generate new unique code for this specific child
          assignedCode = findUniqueCode(existingCodes);
          existingCodes.add(assignedCode.toUpperCase());
          storage.childToCode[child.id] = assignedCode;
        }

        const now = new Date().toISOString();
        const codeKey = assignedCode.toUpperCase();
        storage.codes[codeKey] = {
          code: assignedCode,
          familyId,
          childId: child.id,
          childName: child.name || 'Bé',
          childAvatar: child.avatar || '🌟',
          familyName: familyName || 'Gia đình Siêu Nhân',
          parentPin: parentPin || '1234',
          childProfile: child,
          allProfiles: childList,
          activities: activities || [],
          rewards: rewards || [],
          badges: badges || [],
          createdAt: storage.codes[codeKey]?.createdAt || now,
          updatedAt: now,
        };

        updatedChildCodes[child.id] = assignedCode;
      }

      saveStorage(storage);

      // Optionally sync to Supabase table
      const supabase = getSupabase();
      if (supabase) {
        try {
          for (const [cId, cCode] of Object.entries(updatedChildCodes)) {
            await supabase.from('family_access_codes').upsert({
              code: cCode,
              family_id: familyId,
              family_name: familyName || 'Gia đình Siêu Nhân',
              data_snapshot: {
                childId: cId,
                profiles: childList,
                activities: activities || [],
                rewards: rewards || [],
                parentPin: parentPin || '1234',
              },
              updated_at: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase family_access_codes per-child sync skipped:', e);
        }
      }

      return NextResponse.json({
        success: true,
        familyId,
        codes: updatedChildCodes,
      });
    }

    // 2. ACTION: REGENERATE CODE FOR A SPECIFIC CHILD
    if (action === 'regenerate_child') {
      if (!childId) {
        return NextResponse.json({ success: false, error: 'childId là bắt buộc' }, { status: 400 });
      }

      const oldCode = storage.childToCode[childId];
      if (oldCode) {
        delete storage.codes[oldCode.toUpperCase()];
      }

      const newCode = findUniqueCode(existingCodes);
      existingCodes.add(newCode.toUpperCase());
      storage.childToCode[childId] = newCode;

      const matchedChild = (profiles || []).find((p: any) => p.id === childId) || { id: childId, name: 'Bé' };
      const now = new Date().toISOString();

      storage.codes[newCode.toUpperCase()] = {
        code: newCode,
        familyId: familyId || 'fam_default',
        childId,
        childName: matchedChild.name || 'Bé',
        childAvatar: matchedChild.avatar || '🌟',
        familyName: familyName || 'Gia đình Siêu Nhân',
        parentPin: parentPin || '1234',
        childProfile: matchedChild,
        allProfiles: profiles || [],
        activities: activities || [],
        rewards: rewards || [],
        badges: badges || [],
        createdAt: now,
        updatedAt: now,
      };

      saveStorage(storage);

      return NextResponse.json({
        success: true,
        childId,
        code: newCode,
      });
    }

    // 3. ACTION: VERIFY (CHILD DEVICE CONNECTING WITH SPECIFIC CHILD CODE)
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ success: false, error: 'Vui lòng nhập mã kết nối của bé.' }, { status: 400 });
      }

      const input = code.trim().toUpperCase().replace(/\s+/g, '');
      const candidate = input.startsWith('HERO-') ? input : `HERO-${input}`;

      let matched: ChildCodeEntry | undefined =
        storage.codes[input] ||
        storage.codes[candidate] ||
        Object.values(storage.codes).find(
          (c) => c.code.toUpperCase().replace('-', '') === input.replace('-', '')
        );

      // Check Supabase if not found locally
      if (!matched) {
        const supabase = getSupabase();
        if (supabase) {
          try {
            const { data } = await supabase
              .from('family_access_codes')
              .select('*')
              .or(`code.eq.${candidate},code.eq.${input}`)
              .maybeSingle();

            if (data) {
              const snap = data.data_snapshot || {};
              matched = {
                code: data.code,
                familyId: data.family_id,
                childId: snap.childId || (snap.profiles && snap.profiles[0]?.id) || 'child_default',
                childName: (snap.profiles && snap.profiles[0]?.name) || 'Bé',
                childAvatar: snap.profiles && snap.profiles[0]?.avatar,
                familyName: data.family_name || 'Gia đình Siêu Nhân',
                parentPin: snap.parentPin || '1234',
                childProfile: snap.profiles && snap.profiles[0],
                allProfiles: snap.profiles || [],
                activities: snap.activities || [],
                rewards: snap.rewards || [],
                badges: snap.badges || [],
                createdAt: data.created_at,
                updatedAt: data.updated_at,
              };
              storage.codes[matched.code.toUpperCase()] = matched;
              storage.childToCode[matched.childId] = matched.code;
              saveStorage(storage);
            }
          } catch (e) {
            console.warn('Supabase lookup error:', e);
          }
        }
      }

      if (!matched) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã kết nối của bé không chính xác hoặc chưa được kích hoạt. Vui lòng kiểm tra lại mã trên thẻ của bé trong trang Phụ huynh.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        code: matched.code,
        familyId: matched.familyId,
        childId: matched.childId,
        childName: matched.childName,
        childAvatar: matched.childAvatar,
        activeChild: matched.childProfile,
        profiles: matched.allProfiles,
        activities: matched.activities,
        rewards: matched.rewards,
        badges: matched.badges,
        familyName: matched.familyName,
        parentPin: matched.parentPin || '1234',
      });
    }

    return NextResponse.json({ success: false, error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/family/code:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý mã kết nối' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Per-Child Family Code Service is active' });
}
