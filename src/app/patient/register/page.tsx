'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PatientRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

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

  const validateForm = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
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

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({ email: 'Este email já está cadastrado' });
          throw new Error('Este email já está cadastrado');
        } else {
          throw new Error(data.error || 'Erro ao criar conta');
        }
      }

      toast.success('Conta criada com sucesso!');
      router.push('/patient/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-montserrat font-light text-white mb-2">MED1</h1>
            <p className="text-zinc-400">Área do Paciente</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 sm:p-8">
            <h2 className="text-xl font-medium text-white mb-6">Criar Conta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    required
                    className={`pl-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    className={`pl-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-400 mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    required
                    className={`pl-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Crie uma senha segura"
                    required
                    className={`pl-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-400 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirme sua senha"
                    required
                    className={`pl-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <>
                    Criar Conta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-400">
              Já tem uma conta?{' '}
              <Link href="/patient/login" className="text-blue-500 hover:text-blue-400 font-medium">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 