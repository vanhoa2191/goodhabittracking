import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { derivePairingCredential, getPairingSecret, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const requestSchema = z.object({ childId: z.string().uuid() }).strict();
const credentialRowSchema = z.object({
  rotation_nonce: z.string().uuid(),
  rotated_at: z.string(),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Yêu cầu mã kết nối không hợp lệ.' }, { status: 400 });
  }
  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập tài khoản phụ huynh.' }, { status: 401 });
  }
  const secret = getPairingSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Dịch vụ kết nối tạm thời chưa sẵn sàng.' }, { status: 503 });
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

  const proposedNonce = randomUUID();
  const proposed = await derivePairingCredential(child.id, proposedNonce, secret);
  const [verifierHash, tokenHash] = await Promise.all([
    sha256Hex(proposed.code),
    sha256Hex(proposed.token),
  ]);
  const { data, error } = await supabase.rpc('ensure_pairing_credential', {
    target_child_id: child.id,
    proposed_rotation_nonce: proposedNonce,
    proposed_display_code_id: proposed.code.slice(0, 4),
    proposed_verifier_hash: verifierHash,
    proposed_token_hash: tokenHash,
  });
  const row = credentialRowSchema.safeParse(Array.isArray(data) ? data[0] : data);
  if (error || !row.success) {
    return NextResponse.json({ error: 'Không thể tải mã kết nối.' }, { status: 503 });
  }

  const credential = await derivePairingCredential(child.id, row.data.rotation_nonce, secret);
  return NextResponse.json({
    childId: child.id,
    code: credential.code,
    qrPayload: `${request.nextUrl.origin}/?pair=${encodeURIComponent(credential.token)}`,
    rotatedAt: row.data.rotated_at,
  });
}
