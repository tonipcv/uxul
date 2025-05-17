'use client';

import Navigation from '@/components/Navigation';

export default function FormulasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] h-full">
      <Navigation />
      <main className="lg:pl-20 h-full">
        {children}
      </main>
    </div>
  );
} 