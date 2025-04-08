'use client';

import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Copy, Share2, Calendar, User, Phone, Mail, Link as LinkIcon, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

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
        const response = await fetch(`/api/patients/${params.slug}?token=${token}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar dados do paciente');
        }
        const data = await response.json();
        setPatient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        if (!token) {
          router.push('/patient/access');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPatientData();
  }, [params.slug, token, router]);

  const handleCopyLink = () => {
    if (patient?.lead?.indication?.fullLink) {
      navigator.clipboard.writeText(patient.lead.indication.fullLink);
      toast.success('Link copiado com sucesso!');
    }
  };

  const handleShareLink = () => {
    if (patient?.lead?.indication?.fullLink) {
      navigator.share({
        title: 'Link de Indicação',
        text: 'Confira este link de indicação:',
        url: patient.lead.indication.fullLink,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white" />
          <p className="mt-4 text-zinc-400">Carregando dados do paciente...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Erro ao carregar dados</h2>
          <p className="text-zinc-400 mb-8">{error || 'Paciente não encontrado'}</p>
          <Button
            variant="outline"
            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
            onClick={() => router.push('/')}
          >
            Voltar para o início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          {/* Logo */}
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-montserrat font-light text-white tracking-wider">MED1</h1>
          </Link>
          {/* Logout Button */}
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => router.push('/patient/access')}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sair
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Dados do Paciente */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-8 border border-zinc-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Dados do Paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <User className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-zinc-400 text-sm">Nome</p>
                  <p className="text-white">{patient.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-zinc-400 text-sm">Email</p>
                  <p className="text-white">{patient.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Phone className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-zinc-400 text-sm">Telefone</p>
                  <p className="text-white">{patient.phone}</p>
                </div>
              </div>
              {patient.lead?.appointmentDate && (
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-zinc-400 text-sm">Data da Consulta</p>
                    <p className="text-white">
                      {format(new Date(patient.lead.appointmentDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Médico */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-8 border border-zinc-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Dados do Médico</h2>
            <div className="flex items-center space-x-6">
              {patient.user.image && (
                <div className="relative h-20 w-20 rounded-full overflow-hidden">
                  <Image
                    src={patient.user.image}
                    alt={patient.user.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{patient.user.name}</h3>
                <p className="text-zinc-400">{patient.user.specialty}</p>
                <p className="text-zinc-400">{patient.user.phone}</p>
              </div>
            </div>
          </div>

          {/* Prontuário */}
          {patient.lead?.medicalNotes && (
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-8 border border-zinc-800 mb-8">
              <h2 className="text-2xl font-semibold mb-6">Prontuário</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-white whitespace-pre-wrap">{patient.lead.medicalNotes}</p>
              </div>
            </div>
          )}

          {/* Link de Indicação */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-8 border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-6">Link de Indicação</h2>
            <div className="space-y-6">
              {patient.lead?.indication ? (
                <>
                  <div>
                    <p className="text-zinc-400 text-sm mb-2">Nome do Link</p>
                    <p className="text-white">{patient.lead.indication.name}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm mb-2">Criado em</p>
                    <p className="text-white">
                      {format(new Date(patient.lead.indication.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-zinc-400 text-sm mb-2">Total de Cliques</p>
                      <p className="text-white text-2xl font-semibold">{patient.lead.indication._count.events}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm mb-2">Total de Leads</p>
                      <p className="text-white text-2xl font-semibold">{patient.lead.indication._count.leads}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm mb-2">Link</p>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4 text-zinc-400" />
                      <p className="text-white break-all">{patient.lead.indication.fullLink}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                      onClick={handleCopyLink}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                      onClick={handleShareLink}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>

                  {/* Gráficos */}
                  <div className="mt-8 space-y-8">
                    {/* Fontes de Tráfego */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Fontes de Tráfego</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={[
                              { name: 'Direct', value: 90 },
                              { name: 'Clipboard', value: 10 }
                            ]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#666"
                              tick={{ fill: '#fff' }}
                            />
                            <YAxis 
                              stroke="#666"
                              tick={{ fill: '#fff' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                border: '1px solid #333',
                                borderRadius: '8px'
                              }}
                              labelStyle={{ color: '#fff' }}
                              itemStyle={{ color: '#00f2fe' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#00f2fe"
                              fillOpacity={1}
                              fill="url(#colorValue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Indicações */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Top Indicações</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={[
                              { name: 'Vilma', value: 25 },
                              { name: 'Carou', value: 20 },
                              { name: 'Maria', value: 15 },
                              { name: 'Carilene', value: 10 },
                              { name: 'Consulta', value: 5 }
                            ]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#666"
                              tick={{ fill: '#fff' }}
                            />
                            <YAxis 
                              stroke="#666"
                              tick={{ fill: '#fff' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                border: '1px solid #333',
                                borderRadius: '8px'
                              }}
                              labelStyle={{ color: '#fff' }}
                              itemStyle={{ color: '#00f2fe' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#00f2fe"
                              fillOpacity={1}
                              fill="url(#colorValue2)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-400">Nenhum link de indicação disponível</p>
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white" />
          <p className="mt-4 text-zinc-400">Carregando dados do paciente...</p>
        </div>
      </div>
    }>
      <PatientPageContent />
    </Suspense>
  );
} 