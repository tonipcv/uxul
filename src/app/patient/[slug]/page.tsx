'use client';

import { useEffect, useState, Suspense } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  Copy, Share2, Calendar, User, Phone, Mail, Link as LinkIcon, 
  Loader2, LogOut, FileText, ChevronRight, Home, Bell,
  FileCheck, ClipboardList, UserCircle, Settings, BarChart3, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PatientData {
  name: string;
  email: string;
  phone: string;
  user: {
    name: string;
    specialty: string;
    phone: string;
    image: string | null;
    slug: string;
  };
  lead: {
    status: string;
    appointmentDate: string | null;
    medicalNotes: string | null;
    indication: {
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      fullLink: string;
      _count: {
        leads: number;
        events: number;
      };
    } | null;
  };
}

function SidebarLink({ href, icon: Icon, children, active = false }: { 
  href: string; 
  icon: any; 
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        active 
          ? "bg-blue-600/10 text-blue-600" 
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4" />}
    </Link>
  );
}

function PatientPageContent() {
  const params = useParams<{ slug: string }>();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    async function fetchPatientData() {
      try {
        const url = token 
          ? `/api/patient/${params.slug}?token=${token}&includeStats=true`
          : `/api/patient/${params.slug}?includeStats=true`;
        
        const response = await fetch(url, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            document.cookie = 'patient_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            router.replace('/patient/login');
            return;
          }
          throw new Error('Erro ao carregar dados do paciente');
        }
        
        const data = await response.json();
        
        // Atualizar os dados a cada 30 segundos
        const interval = setInterval(async () => {
          try {
            const statsResponse = await fetch(`/api/patient/${params.slug}/stats`);
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              setPatient(prev => prev ? {
                ...prev,
                lead: {
                  ...prev.lead,
                  indication: prev.lead?.indication ? {
                    ...prev.lead.indication,
                    _count: statsData.counts
                  } : null
                }
              } : null);
            }
          } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
          }
        }, 30000);

        setPatient(data);
        
        return () => clearInterval(interval);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        if (!token) {
          router.replace('/patient/login');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPatientData();
  }, [params.slug, token, router]);

  const handleCopyLink = () => {
    if (patient?.lead?.indication?.fullLink) {
      const link = patient.lead.indication.fullLink;
      navigator.clipboard.writeText(link);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleShareLink = () => {
    if (patient?.lead?.indication?.fullLink) {
      const link = patient.lead.indication.fullLink;
      const text = `Olá! Gostaria de compartilhar este link de indicação: ${link}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Link de Indicação',
          text: 'Confira este link de indicação:',
          url: link
        }).catch(error => {
          console.error('Erro ao compartilhar:', error);
          // Fallback para WhatsApp se o compartilhamento nativo falhar
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        });
      } else {
        // Fallback direto para WhatsApp se navigator.share não estiver disponível
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/patient/logout', {
        method: 'POST',
      });
      
      router.push('/patient/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2b2a2c] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-full h-12 w-12 bg-white/10 text-white mb-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-zinc-400">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="inline-flex items-center justify-center rounded-full h-12 w-12 bg-red-600/10 text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Não foi possível carregar seus dados</h2>
          <p className="text-zinc-400 mb-6">{error || 'Verifique sua conexão e tente novamente'}</p>
          <Button
            variant="outline"
            className="border-zinc-700 text-white hover:bg-zinc-800"
            onClick={() => router.push('/patient/login')}
          >
            Voltar para login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 p-4 border-r border-gray-200 h-screen fixed">
        <div className="flex items-center gap-2 py-3 px-2 mb-6">
          <h1 className="text-xl font-montserrat text-gray-900">MED1</h1>
        </div>
        
        <div className="flex flex-col gap-1 mb-6">
          <p className="text-xs uppercase text-gray-500 font-medium px-3 mb-1">Meu Painel</p>
          <SidebarLink href={`/patient/${params.slug}`} icon={Home} active>Dashboard</SidebarLink>
          <SidebarLink href="#" icon={FileCheck}>Prontuário</SidebarLink>
          <SidebarLink href="#" icon={Calendar}>Consultas</SidebarLink>
          <SidebarLink href="#" icon={ClipboardList}>Resultados</SidebarLink>
        </div>
        
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase text-gray-500 font-medium px-3 mb-1">Conta</p>
          <SidebarLink href="#" icon={UserCircle}>Perfil</SidebarLink>
          <SidebarLink href="#" icon={Bell}>Notificações</SidebarLink>
          <SidebarLink href="#" icon={Settings}>Configurações</SidebarLink>
        </div>
        
        <div className="mt-auto pt-6 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da conta</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-montserrat text-gray-900">MED1</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <div className="p-4 md:p-8">
          {/* Greeting and Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Olá, {patient.name.split(' ')[0]}</h2>
            <p className="text-gray-500">Bem-vindo(a) ao seu painel de saúde. Acompanhe seus dados e consultas.</p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                {patient.lead?.appointmentDate ? (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    Agendado
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    Nenhuma
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Próxima consulta</h3>
              {patient.lead?.appointmentDate ? (
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(patient.lead.appointmentDate), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              ) : (
                <p className="text-lg font-semibold text-gray-900">Não agendada</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-emerald-100 rounded-lg p-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  Atualizado
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Prontuário</h3>
              <p className="text-lg font-semibold text-gray-900">{patient.lead?.medicalNotes ? 'Disponível' : 'Em branco'}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-purple-100 rounded-lg p-2">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  Ativo
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Link de indicação</h3>
              <p className="text-lg font-semibold text-gray-900">
                {patient.lead?.indication ? 
                  `${patient.lead.indication._count.leads} leads` : 
                  'Não disponível'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Coluna 1 - Dados do paciente e médico */}
            <div className="lg:col-span-1 space-y-6">
              {/* Dados do Paciente */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Dados Pessoais</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Nome completo</p>
                      <p className="text-sm text-gray-900">{patient.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Telefone</p>
                      <p className="text-sm text-gray-900">{patient.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados do Médico */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Seu Médico</h2>
                
                <div className="flex items-center gap-4">
                  {patient.user.image ? (
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border border-gray-200">
                      <Image
                        src={patient.user.image}
                        alt={patient.user.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{patient.user.name}</h3>
                    <p className="text-sm text-gray-500">{patient.user.specialty}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 text-white hover:bg-gray-50"
                    onClick={() => {
                      const phone = patient.user.phone.replace(/\D/g, '');
                      window.open(`https://wa.me/55${phone}`, '_blank');
                    }}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Entrar em contato
                  </Button>
                </div>
              </div>
            </div>

            {/* Coluna 2 - Prontuário e Indicações */}
            <div className="lg:col-span-2 space-y-6">
              {/* Prontuário */}
              {patient.lead?.medicalNotes && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Prontuário Médico</h2>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Atualizado
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {patient.lead.medicalNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Link de Indicação */}
              {patient.lead?.indication && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Link de Indicação</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      Ativo
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Nome do Link</p>
                      <p className="text-sm text-gray-900 font-medium">{patient.lead.indication.name}</p>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-xs text-gray-500">Criado em</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(patient.lead.indication.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col">
                      <div className="flex gap-8 mb-auto">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Cliques</p>
                          <p className="text-xl font-semibold text-gray-900">{patient.lead.indication._count.events}</p>
                          <p className="text-xs text-gray-500 mt-1">Total de visitas</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Leads</p>
                          <p className="text-xl font-semibold text-gray-900">{patient.lead.indication._count.leads}</p>
                          <p className="text-xs text-gray-500 mt-1">Pacientes cadastrados</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs text-gray-500">Taxa de conversão</p>
                          <p className="text-xs font-medium text-gray-700">
                            {patient.lead.indication._count.events > 0 
                              ? `${Math.round((patient.lead.indication._count.leads / patient.lead.indication._count.events) * 100)}%`
                              : '0%'
                            }
                          </p>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${
                                patient.lead.indication._count.events > 0 
                                  ? (patient.lead.indication._count.leads / patient.lead.indication._count.events * 100)
                                  : 0
                              }%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {patient.lead.indication._count.leads} pacientes de {patient.lead.indication._count.events} visitas
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">URL do Link</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700 truncate">
                        {patient.lead.indication.fullLink}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                          onClick={handleShareLink}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleShareLink}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-full h-12 w-12 bg-blue-600/10 text-blue-600 mb-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-zinc-400">Carregando dados do paciente...</p>
        </div>
      </div>
    }>
      <PatientPageContent />
    </Suspense>
  );
} 