import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: '注册' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return <AuthForm mode="register" />;
}
