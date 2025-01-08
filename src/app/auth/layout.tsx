'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] grid place-items-center bg-background p-4">
      {children}
    </div>
  );
} 