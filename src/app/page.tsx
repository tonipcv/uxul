'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <Logo className="scale-150" variant="light" />
        </div>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
        <h2 className="text-lg text-white">Carregando...</h2>
      </div>
    </div>
  );
}
