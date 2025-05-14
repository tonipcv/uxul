'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Gift, Users, Link as LinkIcon, 
  Award, Loader2, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface Referral {
  id: string;
  visits: number;
  leads: number;
  sales: number;
  rewards: Array<{
    id: string;
    title: string;
    description: string | null;
    unlockValue: number;
    unlockedAt: string | null;
  }>;
}

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasActiveProducts: boolean;
  referrals: Referral[];
}

export default function ReferralsPage() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      const response = await fetch('/api/patient/me');
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      const data = await response.json();
      setPatientData(data);
    } catch (error) {
      toast.error('Erro ao carregar seus dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando suas indicações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Minhas Indicações</h1>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <Users className="h-5 w-5 text-gray-400 mb-2" />
            <div className="text-xl font-medium text-gray-900">
              {patientData?.referrals?.reduce((acc, ref) => acc + ref.visits, 0) || 0}
            </div>
            <div className="text-sm text-gray-500">Visitas</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <LinkIcon className="h-5 w-5 text-gray-400 mb-2" />
            <div className="text-xl font-medium text-gray-900">
              {patientData?.referrals?.reduce((acc, ref) => acc + ref.leads, 0) || 0}
            </div>
            <div className="text-sm text-gray-500">Indicações</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <Award className="h-5 w-5 text-gray-400 mb-2" />
            <div className="text-xl font-medium text-gray-900">
              {patientData?.referrals?.reduce((acc, ref) => acc + ref.sales, 0) || 0}
            </div>
            <div className="text-sm text-gray-500">Vendas</div>
          </div>
        </div>

        {/* Referrals List */}
        {patientData?.referrals && patientData.referrals.length > 0 ? (
          <div className="space-y-4">
            {patientData.referrals.map((referral) => (
              <div key={referral.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Link de Indicação</h3>
                    <p className="text-sm text-gray-500">
                      {referral.visits} visitas • {referral.leads} leads • {referral.sales} vendas
                    </p>
                  </div>
                </div>

                {/* Rewards */}
                {referral.rewards && referral.rewards.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recompensas</h4>
                    <div className="space-y-3">
                      {referral.rewards.map((reward) => (
                        <div 
                          key={reward.id} 
                          className="bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">{reward.title}</h5>
                              {reward.description && (
                                <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                              )}
                            </div>
                            {reward.unlockedAt ? (
                              <span className="text-xs font-medium text-green-600">Desbloqueado</span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Meta: {reward.unlockValue}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Comece a Indicar
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Indique pacientes para seu médico e ganhe recompensas exclusivas.
            </p>
            <Button
              onClick={() => router.push('/patient/dashboard')}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Voltar para o Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 