'use client';

import Navigation from '@/components/Navigation';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] h-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900">
      <Navigation />
      <main className="h-full min-h-[100dvh] pt-16 pb-20 lg:pt-0 lg:pb-0">
        {children}
      </main>
    </div>
  );
} 