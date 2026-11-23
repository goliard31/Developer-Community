'use client';

import { useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { useState } from 'react';

export function LogoutButton({ className = 'btn btn--ghost btn--sm' }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.push('/');
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      <Icon name="logout" className="w-4 h-4" /> {busy ? '退出中…' : '退出登录'}
    </button>
  );
}
