'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  User, Phone, Mail, Calendar, 
  FileText, ChevronRight, Bell, Settings,
  Gift, Users, Link as LinkIcon, Award,
  LogOut, ClipboardIcon, ExternalLinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Doctor {
  name: string;
  specialty: string;
  phone: string;
  image: string | null;
  slug: string;
}

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
  page: {
    title: string;
  };
  slug: string;
}

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasActiveProducts: boolean;
  doctor: Doctor | null;
  referrals: Referral[];
}

export default function PatientDashboard() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    fetchPatientData();
    setIsClient(true);
    
    // Use environment variable for base URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://med1.app';
    setBaseUrl(appUrl);
  }, []);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text).then(
        () => {
          toast.success('Link copiado com sucesso!');
        },
        (err) => {
          toast.error('Erro ao copiar o link');
          console.error('Erro ao copiar: ', err);
        }
      );
    }
  };

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

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/patient/logout', {
        method: 'POST'
      });
      
      if (response.ok) {
        router.push('/patient/login');
      }
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Calcular estatísticas
  const totalVisits = patientData?.referrals?.reduce((acc, ref) => acc + ref.visits, 0) || 0;
  const totalLeads = patientData?.referrals?.reduce((acc, ref) => acc + ref.leads, 0) || 0;
  const totalSales = patientData?.referrals?.reduce((acc, ref) => acc + ref.sales, 0) || 0;
  const totalRewards = patientData?.referrals?.reduce((acc, ref) => acc + ref.rewards.length, 0) || 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="MED1 Logo"
                width={24}
                height={24}
                priority
                className="h-6 w-6 grayscale"
              />
              <span className="text-lg font-medium text-gray-700">MED1</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                onClick={() => router.push('/patient/profile')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Boas-vindas e Estatísticas */}
          <div>
            <h1 className="text-xl font-medium text-gray-900 mb-6">
              Bem-vindo, {patientData?.name}
            </h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <Users className="h-5 w-5 text-gray-400 mb-2" />
                <div className="text-xl font-medium text-gray-900">{totalVisits}</div>
                <div className="text-sm text-gray-500">Visitas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <LinkIcon className="h-5 w-5 text-gray-400 mb-2" />
                <div className="text-xl font-medium text-gray-900">{totalLeads}</div>
                <div className="text-sm text-gray-500">Indicações</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <Award className="h-5 w-5 text-gray-400 mb-2" />
                <div className="text-xl font-medium text-gray-900">{totalSales}</div>
                <div className="text-sm text-gray-500">Vendas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <Gift className="h-5 w-5 text-gray-400 mb-2" />
                <div className="text-xl font-medium text-gray-900">{totalRewards}</div>
                <div className="text-sm text-gray-500">Recompensas</div>
              </div>
            </div>
          </div>

          {/* Informações do Paciente */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              Suas Informações
            </h2>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <User className="h-4 w-4 mr-3 text-gray-400" />
                <span className="text-sm">{patientData?.name}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-3 text-gray-400" />
                <span className="text-sm">{patientData?.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-3 text-gray-400" />
                <span className="text-sm">{patientData?.phone}</span>
              </div>
            </div>
          </div>

          {/* Informações do Médico */}
          {patientData?.doctor && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4">
                Seu Médico
              </h2>
              <div className="flex items-start space-x-4">
                {patientData.doctor.image ? (
                  <Image
                    src={patientData.doctor.image}
                    alt={patientData.doctor.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {patientData.doctor.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {patientData.doctor.specialty}
                  </p>
                  <div className="mt-1 flex items-center text-gray-500 text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{patientData.doctor.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recompensas */}
          {patientData?.referrals && patientData.referrals.length > 0 ? (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4">
                Suas Recompensas
              </h2>
              <div className="space-y-3">
                {patientData.referrals.map((referral) => (
                  referral.rewards.map((reward) => (
                    <div 
                      key={reward.id} 
                      className="p-4 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{reward.title}</h3>
                          {reward.description && (
                            <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                          )}
                        </div>
                        {reward.unlockedAt ? (
                          <span className="text-sm font-medium text-green-600">Desbloqueado</span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Meta: {reward.unlockValue}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6 text-center">
              <Gift className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <h2 className="text-sm font-medium text-gray-900 mb-1">
                Comece a Indicar
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Indique pacientes para seu médico e ganhe recompensas exclusivas.
              </p>
              <Button 
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={() => router.push('/patient/referrals')}
              >
                Começar a Indicar
              </Button>
            </div>
          )}

          {patientData?.referrals && patientData.referrals.length > 0 ? (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4">
                Seus Links de Referência
              </h2>
              <div className="space-y-4">
                {patientData.referrals.map((referral) => (
                  <div key={referral.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{referral.page.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {referral.visits} visitas • {referral.leads} leads • {referral.sales} vendas
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={`${baseUrl}/${patientData.doctor?.slug}/${referral.slug}`}
                          readOnly
                          className="w-full py-1.5 pl-3 pr-10 text-sm rounded-md bg-white border border-gray-300 text-gray-700"
                        />
                      </div>
                      <button
                        onClick={() => copyToClipboard(`${baseUrl}/${patientData.doctor?.slug}/${referral.slug}`)}
                        className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <ClipboardIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`${baseUrl}/${patientData.doctor?.slug}/${referral.slug}`, '_blank')}
                        className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <ExternalLinkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6 text-center">
              <LinkIcon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <h2 className="text-sm font-medium text-gray-900 mb-1">
                Sem Links de Referência
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Você ainda não possui links de referência. Entre em contato com seu médico.
              </p>
            </div>
          )}

          {patientData?.referrals && patientData.referrals.some(ref => ref.rewards.length > 0) ? (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4">
                Recompensas Recebidas
              </h2>
              <div className="space-y-3">
                {patientData.referrals.map((referral) => (
                  referral.rewards.map((reward) => (
                    <div 
                      key={reward.id} 
                      className="p-4 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{reward.title}</h3>
                          {reward.description && (
                            <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                          )}
                        </div>
                        {reward.unlockedAt ? (
                          <span className="text-sm font-medium text-green-600">Desbloqueado</span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Meta: {reward.unlockValue}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6 text-center">
              <Gift className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <h2 className="text-sm font-medium text-gray-900 mb-1">
                Comece a Indicar
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Indique pacientes para seu médico e ganhe recompensas exclusivas.
              </p>
              <Button 
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={() => router.push('/patient/referrals')}
              >
                Começar a Indicar
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 