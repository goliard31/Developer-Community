import type { Metadata } from 'next';
import './globals.css';
import './fonts/noto-sans-sc.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: {
    default: '社区项目站',
    template: '%s · 社区项目站',
  },
  description: '集中展示各开发组项目的社区站点：注册登录后上传自己的项目，网页内查看代码、图文与视频。',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
