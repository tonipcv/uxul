'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

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

  // Função memoizada para buscar o plano do usuário
  const fetchUserPlan = useCallback(async () => {
    try {
      // Verificar se temos dados em cache e se são recentes (menos de 5 minutos)
      const cachedPlan = localStorage.getItem('userPlan');
      const cachedTime = localStorage.getItem('userPlanTime');
      
      const now = Date.now();
      const cacheAge = cachedTime ? now - parseInt(cachedTime, 10) : Infinity;
      const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutos
      
      if (cachedPlan && cacheValid) {
        const parsedPlan = JSON.parse(cachedPlan);
        setPlan({
          ...parsedPlan,
          planExpiresAt: parsedPlan.planExpiresAt ? new Date(parsedPlan.planExpiresAt) : null,
          isLoading: false
        });
        return;
      }
      
      // Buscar dados atualizados da API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/users/plan', {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        let daysRemaining: number | null = null;
        if (data.planExpiresAt) {
          const expiryDate = new Date(data.planExpiresAt);
          const today = new Date();
          const diff = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          daysRemaining = diff > 0 ? diff : 0;
        }

        const planData = {
          isPremium: data.plan === 'premium',
          isLoading: false,
          planExpiresAt: data.planExpiresAt,
          daysRemaining
        };

        setPlan({
          ...planData,
          planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : null
        });

        // Salvar em cache local
        localStorage.setItem('userPlan', JSON.stringify(planData));
        localStorage.setItem('userPlanTime', now.toString());
      } else {
        setPlan({
          isPremium: false,
          isLoading: false,
          planExpiresAt: null,
          daysRemaining: null
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao buscar plano do usuário:', error);
      }
      
      setPlan({
        isPremium: false,
        isLoading: false,
        planExpiresAt: null,
        daysRemaining: null
      });
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user?.id) {
      // Limpamos o cache quando o usuário muda
      const currentUserId = localStorage.getItem('currentUserId');
      if (currentUserId !== session.user.id) {
        localStorage.removeItem('userPlan');
        localStorage.removeItem('userPlanTime');
        localStorage.setItem('currentUserId', session.user.id);
      }
      
      fetchUserPlan();
    } else if (status === 'unauthenticated') {
      setPlan({
        isPremium: false,
        isLoading: false,
        planExpiresAt: null,
        daysRemaining: null
      });
    }
  }, [session, status, fetchUserPlan]);

  return plan;
} 