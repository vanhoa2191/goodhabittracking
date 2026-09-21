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
    return NextResponse.json({ error: 'Yêu cầu làm mới mã không hợp lệ.' }, { status: 400 });
  }
  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập tài khoản phụ huynh.' }, { status: 401 });
  }
  const secret = getPairingSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Dịch vụ kết nối tạm thời chưa sẵn sàng.' }, { status: 503 });
  }

  const rotationNonce = randomUUID();
  const credential = await derivePairingCredential(parsed.data.childId, rotationNonce, secret);
  const [verifierHash, tokenHash] = await Promise.all([
    sha256Hex(credential.code),
    sha256Hex(credential.token),
  ]);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('rotate_pairing_credential', {
    target_child_id: parsed.data.childId,
    next_rotation_nonce: rotationNonce,
    next_display_code_id: credential.code.slice(0, 4),
    next_verifier_hash: verifierHash,
    next_token_hash: tokenHash,
  });
  const row = credentialRowSchema.safeParse(Array.isArray(data) ? data[0] : data);
  if (error) {
    return NextResponse.json({ error: 'Không thể làm mới mã kết nối.' }, { status: 503 });
  }
  if (!row.success) {
    return NextResponse.json({ error: 'Không tìm thấy hồ sơ bé trong gia đình này.' }, { status: 404 });
  }

  return NextResponse.json({
    childId: parsed.data.childId,
    code: credential.code,
    qrPayload: `${request.nextUrl.origin}/?pair=${encodeURIComponent(credential.token)}`,
    rotatedAt: row.data.rotated_at,
  });
}
