'use client';

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'loading') {
      router.push('/outbound');
    }
  }, [status, router]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}
