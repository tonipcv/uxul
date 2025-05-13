'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

function SetupPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: searchParams.get('email') || '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro específico quando o campo é alterado
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não conferem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNextStep();
      return;
    }

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Enviando dados:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      const response = await fetch('/api/patient/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      console.log('Status da resposta:', response.status);
      
      // Se não for JSON, vamos ver o texto da resposta
      if (!response.headers.get('content-type')?.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não-JSON recebida:', text);
        throw new Error('Resposta inválida do servidor');
      }

      const data = await response.json();
      console.log('Dados da resposta:', data);

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({ email: 'Este email já está cadastrado' });
          setStep(1);
          throw new Error('Este email já está cadastrado');
        } else {
          throw new Error(data.error || 'Erro ao criar conta');
        }
      }

      toast.success('Conta criada com sucesso!');
      router.push('/patient/login');
    } catch (error) {
      console.error('Erro completo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center">
      <div className="w-full max-w-[480px] mx-auto px-4">
        <div className="flex justify-center mb-8 items-center gap-3">
          <Image
            src="/logo.png"
            alt="MED1 Logo"
            width={48}
            height={48}
            priority
            className="h-12 w-12"
          />
          <span className="text-3xl font-semibold text-[#5c5b60]">MED1</span>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 ? 'Criar Conta' : 'Definir Senha'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 
                ? 'Preencha seus dados para criar sua conta'
                : 'Crie uma senha segura para sua conta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className={`bg-white text-black ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className={`bg-white text-black ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className={`bg-white text-black ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className={`bg-white text-black ${errors.password ? 'border-red-500' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Digite a senha novamente"
                    className={`bg-white text-black ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-[#0070df] text-white hover:bg-[#0070df]/90 transition-colors border-none rounded-full"
              disabled={loading}
            >
              {loading 
                ? "Processando..." 
                : step === 1 
                  ? "Continuar" 
                  : "Criar Conta"
              }
            </Button>

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Voltar para dados pessoais
              </button>
            )}
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Já tem uma conta?{' '}
            <Link href="/patient/login" className="text-[#0070df] hover:text-[#0070df]/90 font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-full h-12 w-12 bg-white/10 text-white mb-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    }>
      <SetupPasswordContent />
    </Suspense>
  );
} 