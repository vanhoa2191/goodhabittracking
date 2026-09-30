import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

const revokeSchema = z.object({ inviteId: z.string().uuid() }).strict();

async function authenticatedClient() {
  const client = await createServerSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  return user ? client : null;
}

export async function GET() {
  const client = await authenticatedClient();
  if (!client) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const { data, error } = await client.rpc('list_caregiver_invites');
  if (error) return NextResponse.json({ error: 'Chỉ chủ gia đình có thể quản lý lời mời.' }, { status: 403 });
  const invites = (Array.isArray(data) ? data : []).map((row) => ({
    id: row.invite_id,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  }));
  return NextResponse.json({ invites });
}

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const client = await authenticatedClient();
  if (!client) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const { data, error } = await client.rpc('create_caregiver_invite', { ttl_hours: 72 });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return NextResponse.json({ error: 'Chỉ chủ gia đình có thể tạo lời mời.' }, { status: 403 });
  return NextResponse.json({
    invite: { id: row.invite_id, token: row.token, expiresAt: row.expires_at },
  }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const client = await authenticatedClient();
  if (!client) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Lời mời không hợp lệ.' }, { status: 400 });
  const { data, error } = await client.rpc('revoke_caregiver_invite', {
    target_invite_id: parsed.data.inviteId,
  });
  if (error) return NextResponse.json({ error: 'Chỉ chủ gia đình có thể thu hồi lời mời.' }, { status: 403 });
  if (data !== true) return NextResponse.json({ error: 'Lời mời không còn hiệu lực.' }, { status: 409 });
  return NextResponse.json({ success: true });
}
