import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: '登录' };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return <AuthForm mode="login" />;
}
