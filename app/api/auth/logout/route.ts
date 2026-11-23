import { NextResponse } from 'next/server';
import { destroySession, getSessionToken, clearSessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  destroySession(await getSessionToken());
  const res = NextResponse.json({ ok: true });
  await clearSessionCookie();
  return res;
}
