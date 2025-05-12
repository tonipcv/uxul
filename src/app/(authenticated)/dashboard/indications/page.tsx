'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  PlusIcon, 
  ClipboardIcon, 
  QrCodeIcon,
  ShareIcon,
  LinkIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  GiftIcon
} from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Edit, Share2, Copy, Trash, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PatientReferral {
  id: string;
  slug: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  page: {
    id: string;
    title: string;
    slug: string;
  };
  stats: {
    visits: number;
    leads: number;
    sales: number;
  };
  rewards?: Array<{
    id: string;
    title: string;
    type: string;
    unlockValue: number;
    unlockType: string;
    unlockedAt: Date | null;
    progress: number;
  }>;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
}

interface ReferralsByPatient {
  [key: string]: {
    patient: Patient;
    referrals: PatientReferral[];
  }
}

interface DashboardData {
  totalLeads: number;
  totalIndications: number;
  totalClicks: number;
  totalRewards?: number;
}

export default function ReferralsPage() {
  const { data: session } = useSession();
  const [referrals, setReferrals] = useState<PatientReferral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [selectedPage, setSelectedPage] = useState<Page | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [userSlug, setUserSlug] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [openPageCombobox, setOpenPageCombobox] = useState(false);
  const [pageSearchQuery, setPageSearchQuery] = useState("");
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      console.log('Fetching patients on session change');
      fetchPatients();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    
    if (session?.user?.id) {
      fetchReferrals();
      fetchUserProfile();
      fetchPages();
    }
  }, [session, isClient]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users/profile?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.slug) {
          setUserSlug(data.slug);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const fetchReferrals = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/doctor/referrals');
      if (response.ok) {
        const { referrals } = await response.json();
        setReferrals(referrals);
      }
    } catch (error) {
      console.error('Erro ao buscar referências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as referências",
        variant: "destructive"
      });
    }
  };

  const fetchPages = async () => {
    if (!session?.user?.id) {
      console.log('No user session, skipping fetch');
      return;
    }
    
    try {
      console.log('Fetching pages...');
      const response = await fetch('/api/pages');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received pages data:', data);
        if (Array.isArray(data) && data.length > 0) {
          setPages(data);
          setFilteredPages(data);
        } else {
          console.log('No pages data received or empty array');
          toast({
            title: "Aviso",
            description: "Você precisa criar uma página antes de criar um link de referência",
            variant: "destructive"
          });
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast({
          title: "Erro",
          description: "Erro ao carregar páginas: " + errorText,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar páginas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de páginas",
        variant: "destructive"
      });
    }
  };

  const fetchPatients = async () => {
    if (!session?.user?.id) {
      console.log('No user session, skipping fetch');
      return;
    }
    
    try {
      console.log('Fetching patients...');
      const response = await fetch('/api/patients');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const { data } = await response.json();
        console.log('Received patients data:', data);
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
          setFilteredPatients(data);
        } else {
          console.log('No patients data received or empty array');
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast({
          title: "Erro",
          description: "Erro ao carregar pacientes: " + errorText,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pacientes",
        variant: "destructive"
      });
    }
  };

  const patientHasPageAccess = (patientId: string, pageId: string) => {
    return referrals.some(
      referral => referral.patient.id === patientId && referral.page.id === pageId
    );
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !selectedPatient || !selectedPage) {
      toast({
        title: "Erro",
        description: "Selecione um paciente e uma página para criar o link",
        variant: "destructive"
      });
      return;
    }

    if (patientHasPageAccess(selectedPatient.id, selectedPage.id)) {
      toast({
        title: "Erro",
        description: "Este paciente já tem acesso a esta página",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const referralResponse = await fetch('/api/patient-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          pageId: selectedPage.id
        })
      });
      
      if (referralResponse.ok) {
        toast({
          title: "Sucesso",
          description: "Link de referência criado com sucesso",
        });
        setSelectedPatient(undefined);
        setSelectedPage(undefined);
        setShowCreateModal(false);
        fetchReferrals();
      } else {
        const errorData = await referralResponse.json();
        throw new Error(errorData.error || "Não foi possível criar a referência");
      }
    } catch (error) {
      console.error('Erro ao criar referência:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a referência",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (isClient && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado",
        description: "Link copiado para a área de transferência",
      });
    }
  };

  // Agrupar referrals por paciente
  const referralsByPatient: ReferralsByPatient = referrals.reduce((acc, referral) => {
    const patientId = referral.patient.id;
    if (!acc[patientId]) {
      acc[patientId] = {
        patient: referral.patient,
        referrals: []
      };
    }
    acc[patientId].referrals.push(referral);
    return acc;
  }, {} as ReferralsByPatient);

  const handleCreateModalChange = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) {
      setSelectedPatient(undefined);
      setSelectedPage(undefined);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Links de Referência</h2>
              <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie os links de referência dos seus pacientes</p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="w-full md:w-auto mt-2 md:mt-0 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Link
            </Button>
          </div>

          <div className="space-y-4">
            {Object.values(referralsByPatient).map(({ patient, referrals }) => (
              <div key={patient.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{patient.name}</h3>
                      <p className="text-xs text-gray-500">{patient.email}</p>
                    </div>
                  </div>
                </div>

                <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Nome do Link</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead className="text-center">Visitas</TableHead>
                          <TableHead className="text-center">Leads</TableHead>
                          <TableHead className="text-center">Vendas</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell className="font-medium">{referral.page.title}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 truncate max-w-[200px]">
                                  {`${baseUrl}/${userSlug}/${referral.slug}`}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                  <ClipboardIcon className="h-4 w-4 text-gray-500" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                {referral.stats.visits}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                {referral.stats.leads}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                {referral.stats.sales}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                  <QrCodeIcon className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                  <ShareIcon className="h-4 w-4 text-gray-500" />
                                </Button>
                                {referral.rewards && referral.rewards.length > 0 && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                    <GiftIcon className="h-4 w-4 text-gray-500" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Sheet 
        open={showCreateModal} 
        onOpenChange={handleCreateModalChange}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-gray-900">Nova Indicação</SheetTitle>
            </SheetHeader>

            <form onSubmit={handleCreateReferral} className="space-y-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Básicas</h3>
                <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="patient" className="text-sm text-gray-700">Paciente</Label>
                    <Select
                      value={selectedPatient?.id || ''}
                      onValueChange={(value) => {
                        const patient = patients.find(p => p.id === value);
                        setSelectedPatient(patient || undefined);
                      }}
                    >
                      <SelectTrigger className="h-9 bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900">
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="page" className="text-sm text-gray-700">Página</Label>
                    <Select
                      value={selectedPage?.id || ''}
                      onValueChange={(value) => {
                        const page = pages.find(p => p.id === value);
                        setSelectedPage(page || undefined);
                      }}
                    >
                      <SelectTrigger className="h-9 bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900">
                        <SelectValue placeholder="Selecione uma página" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.map((page) => {
                          const isDisabled = selectedPatient && patientHasPageAccess(selectedPatient.id, page.id);
                          return (
                            <SelectItem 
                              key={page.id} 
                              value={page.id}
                              disabled={isDisabled}
                              className={cn(
                                isDisabled && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {page.title}
                              {isDisabled && " (Já tem acesso)"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedPatient(undefined);
                    setSelectedPage(undefined);
                  }}
                  className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedPatient || !selectedPage || isLoading}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Indicação'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 