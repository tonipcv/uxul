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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <Logo className="scale-100" variant="dark" />
        </div>
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    </div>
  );
}
