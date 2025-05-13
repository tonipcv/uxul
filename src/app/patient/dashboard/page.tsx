'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  User, Phone, Mail, Calendar, 
  FileText, ChevronRight, Bell, Settings 
} from 'lucide-react';
import { toast } from 'sonner';

interface Doctor {
  name: string;
  specialty: string;
  phone: string;
  image: string | null;
  slug: string;
}

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasActiveProducts: boolean;
  doctor: Doctor | null;
}

export default function PatientDashboard() {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Bem-vindo, {patientData?.name}</h1>
            <p className="text-zinc-400">Gerencie seus dados e acompanhamentos médicos</p>
          </div>

          {/* Informações do Paciente */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium mb-4">Suas Informações</h2>
            <div className="space-y-4">
              <div className="flex items-center text-zinc-400">
                <User className="h-5 w-5 mr-3" />
                <span>{patientData?.name}</span>
              </div>
              <div className="flex items-center text-zinc-400">
                <Mail className="h-5 w-5 mr-3" />
                <span>{patientData?.email}</span>
              </div>
              <div className="flex items-center text-zinc-400">
                <Phone className="h-5 w-5 mr-3" />
                <span>{patientData?.phone}</span>
              </div>
            </div>
          </div>

          {/* Informações do Médico ou Mensagem de Boas-vindas */}
          {patientData?.doctor ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Seu Médico</h2>
              <div className="flex items-start space-x-4">
                {patientData.doctor.image ? (
                  <Image
                    src={patientData.doctor.image}
                    alt={patientData.doctor.name}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-zinc-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{patientData.doctor.name}</h3>
                  <p className="text-zinc-400 text-sm">{patientData.doctor.specialty}</p>
                  <div className="mt-2 flex items-center text-zinc-400 text-sm">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{patientData.doctor.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-center">
              <h2 className="text-lg font-medium mb-2">Bem-vindo à Plataforma</h2>
              <p className="text-zinc-400 mb-4">
                Você ainda não tem um médico vinculado. Quando seu médico liberar acesso aos serviços,
                você será notificado por email.
              </p>
              <div className="flex justify-center">
                <Button variant="outline" className="text-zinc-400 border-zinc-700">
                  Saiba mais sobre nossos serviços
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 