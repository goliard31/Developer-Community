import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { UploadForm } from '@/components/UploadForm';
import { getCurrentUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { isGroupKey } from '@/lib/groups';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: '上传项目' };

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; project?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/upload');
  const sp = await searchParams;
  const defaultGroup = sp.group && isGroupKey(sp.group) ? sp.group : undefined;

  let existing: { id: string; title: string; files: string[] } | null = null;
  if (sp.project) {
    const db = readDb();
    const p = db.projects.find((x) => x.id === sp.project);
    if (p && (p.ownerId === user.id || user.role === 'admin')) {
      existing = { id: p.id, title: p.title, files: p.files.map((f) => f.path) };
    }
  }

  return <UploadForm defaultGroup={defaultGroup} existing={existing} />;
}
