'use client';

import Navigation from '@/components/Navigation';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] h-full bg-slate-50">
      <Navigation />
      <main className="lg:pl-20 h-full pt-[60px] pb-[80px] lg:pt-0 lg:pb-0">
        {children}
      </main>
    </div>
  );
} 