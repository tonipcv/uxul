'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white relative">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-turquoise/10 via-transparent to-transparent blur-3xl" />
      </div>

      {children}
    </div>
  );
} 