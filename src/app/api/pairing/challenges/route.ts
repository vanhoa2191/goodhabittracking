import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { createDisplayCode, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const requestSchema = z.object({
  childId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Yêu cầu tạo mã không hợp lệ.' }, { status: 400 });
  }

  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập tài khoản phụ huynh.' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: child, error: childError } = await supabase
    .from('child_profiles')
    .select('id')
    .eq('id', parsed.data.childId)
    .eq('family_id', parent.familyId)
    .maybeSingle();

  if (childError) {
    return NextResponse.json({ error: 'Không thể kiểm tra hồ sơ của bé.' }, { status: 503 });
  }
  if (!child) {
    return NextResponse.json({ error: 'Không tìm thấy hồ sơ bé trong gia đình này.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  await supabase
    .from('pairing_challenges')
    .update({ revoked_at: now })
    .eq('family_id', parent.familyId)
    .eq('child_id', child.id)
    .is('consumed_at', null)
    .is('revoked_at', null);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { code, codeId } = createDisplayCode();
    const verifierHash = await sha256Hex(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { data: challenge, error } = await supabase
      .from('pairing_challenges')
      .insert({
        family_id: parent.familyId,
        child_id: child.id,
        display_code_id: codeId,
        verifier_hash: `\\x${verifierHash}`,
        attempts_remaining: 5,
        expires_at: expiresAt,
        created_by: parent.user.id,
      })
      .select('id')
      .single();

    if (!error && challenge) {
      return NextResponse.json({
        challengeId: challenge.id,
        childId: child.id,
        code,
        expiresAt,
      });
    }

    if (error?.code !== '23505') {
      return NextResponse.json({ error: 'Không thể tạo mã ghép nối.' }, { status: 503 });
    }
  }

  return NextResponse.json({ error: 'Không thể cấp mã duy nhất. Vui lòng thử lại.' }, { status: 503 });
}
