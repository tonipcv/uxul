'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface UserPlan {
  isPremium: boolean;
  isLoading: boolean;
  planExpiresAt: Date | null;
  daysRemaining: number | null;
}

export function useUserPlan(): UserPlan {
  const { data: session, status } = useSession();
  const [plan, setPlan] = useState<UserPlan>({
    isPremium: false,
    isLoading: true,
    planExpiresAt: null,
    daysRemaining: null
  });

  useEffect(() => {
    if (status === 'loading') return;

    async function fetchUserPlan() {
      try {
        const response = await fetch('/api/users/plan');
        if (response.ok) {
          const data = await response.json();
          
          let daysRemaining = null;
          if (data.planExpiresAt) {
            const expiryDate = new Date(data.planExpiresAt);
            const today = new Date();
            const diff = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            daysRemaining = diff > 0 ? diff : 0;
          }

          setPlan({
            isPremium: data.plan === 'premium',
            isLoading: false,
            planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : null,
            daysRemaining
          });
        } else {
          setPlan({
            isPremium: false,
            isLoading: false,
            planExpiresAt: null,
            daysRemaining: null
          });
        }
      } catch (error) {
        console.error('Erro ao buscar plano do usuário:', error);
        setPlan({
          isPremium: false,
          isLoading: false,
          planExpiresAt: null,
          daysRemaining: null
        });
      }
    }

    if (session?.user?.id) {
      fetchUserPlan();
    } else {
      setPlan({
        isPremium: false,
        isLoading: false,
        planExpiresAt: null,
        daysRemaining: null
      });
    }
  }, [session, status]);

  return plan;
} 