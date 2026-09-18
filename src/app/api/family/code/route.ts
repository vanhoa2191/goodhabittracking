import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabase } from '@/lib/supabase';

interface FamilyRecord {
  code: string;
  familyId: string;
  familyName?: string;
  parentPin?: string;
  profiles?: any[];
  activities?: any[];
  rewards?: any[];
  badges?: any[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'family_codes.json');

// In-memory cache for fast lookup and thread-safety within process
let memoryCache: Record<string, FamilyRecord> = {};
let isCacheLoaded = false;

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not initialize .data directory:', err);
  }
}

function loadRecords(): Record<string, FamilyRecord> {
  if (isCacheLoaded) {
    return memoryCache;
  }
  ensureDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryCache = JSON.parse(raw || '{}');
      isCacheLoaded = true;
    }
  } catch (err) {
    console.warn('Error reading family_codes.json:', err);
    memoryCache = {};
  }
  return memoryCache;
}

function saveRecords(records: Record<string, FamilyRecord>) {
  memoryCache = records;
  isCacheLoaded = true;
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing family_codes.json:', err);
  }
}

// Generate human-friendly safe code: no confusing characters 0/O, 1/I/L
const CODE_PREFIX = 'HERO-';
const CHAR_SET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCode(): string {
  let result = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * CHAR_SET.length);
    result += CHAR_SET[randomIndex];
  }
  return CODE_PREFIX + result;
}

function findUniqueCode(existingRecords: Record<string, FamilyRecord>): string {
  const existingCodes = new Set(Object.values(existingRecords).map((r) => r.code.toUpperCase()));
  let attempts = 0;
  while (attempts < 1000) {
    const candidate = generateRandomCode();
    if (!existingCodes.has(candidate.toUpperCase())) {
      return candidate;
    }
    attempts++;
  }
  // Fallback with 6 characters if 4 has high collision
  let extended = 'HERO-';
  for (let i = 0; i < 6; i++) {
    extended += CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
  }
  return extended;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, familyId, code, familyName, parentPin, profiles, activities, rewards, badges } = body;

    const records = loadRecords();

    // 1. ACTION: GET_OR_CREATE or REGENERATE
    if (action === 'get_or_create' || action === 'regenerate') {
      if (!familyId) {
        return NextResponse.json({ success: false, error: 'familyId là bắt buộc' }, { status: 400 });
      }

      let existingRecord: FamilyRecord | undefined = records[familyId];

      if (action === 'regenerate' || !existingRecord) {
        const newCode = findUniqueCode(records);
        const now = new Date().toISOString();
        existingRecord = {
          code: newCode,
          familyId,
          familyName: familyName || 'Gia đình Siêu Nhân',
          parentPin: parentPin || '1234',
          profiles: profiles || [],
          activities: activities || [],
          rewards: rewards || [],
          badges: badges || [],
          createdAt: existingRecord?.createdAt || now,
          updatedAt: now,
        };
        records[familyId] = existingRecord;
        saveRecords(records);

        // Attempt Supabase insert/upsert if configured
        const supabase = getSupabase();
        if (supabase) {
          try {
            await supabase.from('family_access_codes').upsert({
              family_id: familyId,
              code: newCode,
              family_name: familyName || 'Gia đình Siêu Nhân',
              data_snapshot: {
                profiles: profiles || [],
                activities: activities || [],
                rewards: rewards || [],
                parentPin: parentPin || '1234',
              },
              updated_at: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Supabase family_access_codes sync skipped:', e);
          }
        }
      } else {
        // Update snapshot data on heartbeat / get_or_create
        let changed = false;
        if (profiles && profiles.length > 0) {
          existingRecord.profiles = profiles;
          changed = true;
        }
        if (activities && activities.length > 0) {
          existingRecord.activities = activities;
          changed = true;
        }
        if (rewards && rewards.length > 0) {
          existingRecord.rewards = rewards;
          changed = true;
        }
        if (familyName) {
          existingRecord.familyName = familyName;
          changed = true;
        }
        if (parentPin) {
          existingRecord.parentPin = parentPin;
          changed = true;
        }
        if (changed) {
          existingRecord.updatedAt = new Date().toISOString();
          records[familyId] = existingRecord;
          saveRecords(records);
        }
      }

      return NextResponse.json({
        success: true,
        code: existingRecord.code,
        familyId: existingRecord.familyId,
        familyName: existingRecord.familyName,
        createdAt: existingRecord.createdAt,
      });
    }

    // 2. ACTION: VERIFY (CHILD DEVICE CONNECTING)
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ success: false, error: 'Vui lòng nhập mã kết nối.' }, { status: 400 });
      }

      const inputNormalized = code.trim().toUpperCase().replace(/\s+/g, '');
      const candidateCode = inputNormalized.startsWith('HERO-') ? inputNormalized : `HERO-${inputNormalized}`;

      // Find in local records
      let matchedRecord: FamilyRecord | undefined = Object.values(records).find(
        (r) =>
          r.code.toUpperCase() === inputNormalized ||
          r.code.toUpperCase() === candidateCode ||
          r.code.toUpperCase().replace('-', '') === inputNormalized.replace('-', '')
      );

      // If not in local records, check Supabase
      if (!matchedRecord) {
        const supabase = getSupabase();
        if (supabase) {
          try {
            const { data } = await supabase
              .from('family_access_codes')
              .select('*')
              .or(`code.eq.${candidateCode},code.eq.${inputNormalized}`)
              .maybeSingle();

            if (data) {
              matchedRecord = {
                code: data.code,
                familyId: data.family_id,
                familyName: data.family_name || 'Gia đình Siêu Nhân',
                parentPin: data.data_snapshot?.parentPin || '1234',
                profiles: data.data_snapshot?.profiles || [],
                activities: data.data_snapshot?.activities || [],
                rewards: data.data_snapshot?.rewards || [],
                badges: data.data_snapshot?.badges || [],
                createdAt: data.created_at,
                updatedAt: data.updated_at,
              };
              // Cache locally
              records[matchedRecord.familyId] = matchedRecord;
              saveRecords(records);
            }
          } catch (e) {
            console.warn('Supabase lookup error:', e);
          }
        }
      }

      if (!matchedRecord) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã kết nối không chính xác hoặc chưa được kích hoạt trên trang Phụ huynh. Vui lòng kiểm tra lại mã.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        code: matchedRecord.code,
        familyId: matchedRecord.familyId,
        familyName: matchedRecord.familyName,
        parentPin: matchedRecord.parentPin || '1234',
        profiles: matchedRecord.profiles || [],
        activities: matchedRecord.activities || [],
        rewards: matchedRecord.rewards || [],
        badges: matchedRecord.badges || [],
      });
    }

    // 3. ACTION: SYNC (SYNC DATA FROM DEVICE BACK TO SERVER)
    if (action === 'sync') {
      if (!familyId) {
        return NextResponse.json({ success: false, error: 'familyId là bắt buộc' }, { status: 400 });
      }
      const existing = records[familyId];
      if (existing) {
        if (profiles) existing.profiles = profiles;
        if (activities) existing.activities = activities;
        if (rewards) existing.rewards = rewards;
        if (badges) existing.badges = badges;
        existing.updatedAt = new Date().toISOString();
        records[familyId] = existing;
        saveRecords(records);
      }
      return NextResponse.json({ success: true });
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

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Family Code Service is active',
  });
}
