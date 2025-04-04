'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, CheckIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function InsideSalesPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '+55 ',
    instagram: '',
    area: '',
    employees: '',
    revenue: '',
    useTechnology: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [field]: value
      };
      
      setTimeout(() => {
        if (field === 'area' && updatedData.area !== '') {
          setStep(6);
        } else if (field === 'employees' && updatedData.employees !== '') {
          setStep(7);
        } else if (field === 'revenue' && updatedData.revenue !== '') {
          setStep(8);
        }
      }, 300);
      
      return updatedData;
    });
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1 && formData.name.trim() !== '') {
      setStep(2);
    } else if (step === 2 && formData.email.trim() !== '') {
      setStep(3);
    } else if (step === 3 && formData.whatsapp.trim() !== '' && formData.whatsapp.trim() !== '+55' && formData.whatsapp.trim() !== '+55 ') {
      setStep(4);
    } else if (step === 4 && formData.instagram.trim() !== '') {
      setStep(5);
    } else if (step === 5 && formData.area !== '') {
      setStep(6);
    } else if (step === 6 && formData.employees !== '') {
      setStep(7);
    } else if (step === 7 && formData.revenue !== '') {
      setStep(8);
    } else if (step === 8 && formData.useTechnology !== '') {
      setStep(9);
    } else if (step === 9) {
      submitFormData();
    }
  };

  const submitFormData = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      
      console.log('Enviando dados do formulário:', formData);
      
      // Abordagem simplificada para depuração
      const rawResponse = await fetch('/api/form-submission', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Status da resposta:', rawResponse.status, rawResponse.statusText);
      
      if (!rawResponse.ok) {
        const errorData = await rawResponse.json();
        throw new Error(errorData.error || 'Falha ao enviar dados');
      }
      
      const content = await rawResponse.json();
      console.log('Resposta completa:', content);
      
      // Avançar para a tela de confirmação
      setStep(9);
      
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erro ao enviar dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step !== 4 && step !== 5) {
      handleNext();
    }
  };

  const steps = [
    // Step 0: Headline e botão inicial
    <motion.div 
      key="intro" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-3xl mx-auto"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
        Agende sua demonstração gratuita
      </h1>
      <p className="text-xl text-white/90 mb-10 leading-relaxed">
        Conheça como o Med1 pode aumentar em até 3x o número de pacientes do seu consultório
      </p>
      <Button 
        className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all border-none shadow-lg px-8 py-6 text-lg rounded-xl group"
        variant="default"
        onClick={handleNext}
      >
        Agendar agora
        <span className="ml-2 bg-white/20 rounded-full p-1.5 group-hover:bg-white/30 transition-all">
          <ChevronRightIcon className="h-4 w-4 text-white" />
        </span>
      </Button>
    </motion.div>,

    // Step 1: Qual seu nome
    <motion.div 
      key="name" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-semibold text-white mb-4">
        Qual é o seu nome?
      </h2>
      <p className="text-white/80 mb-8">Nos diga como devemos te chamar</p>
      <div className="mb-10 px-4">
        <Input 
          type="text" 
          name="name"
          value={formData.name} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/5 backdrop-blur-sm border border-white/20 text-white text-2xl py-6 px-4 placeholder:text-white/40 w-full focus:ring-1 focus:ring-blue-400/50 focus:border-transparent rounded-lg"
          placeholder="Digite seu nome"
          autoFocus
        />
      </div>
      <Button 
        className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all border-none shadow-lg mt-6 px-8 py-6 text-lg rounded-xl group"
        variant="default"
        onClick={handleNext}
        disabled={formData.name.trim() === ''}
      >
        Continuar
        <span className="ml-2 bg-white/20 rounded-full p-1.5 group-hover:bg-white/30 transition-all">
          <ChevronRightIcon className="h-4 w-4 text-white" />
        </span>
      </Button>
    </motion.div>,

    // Step 2: Qual seu e-mail
    <motion.div 
      key="email" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-semibold text-white mb-4">
        Qual seu e-mail?
      </h2>
      <p className="text-white/80 mb-8">Enviaremos informações importantes por aqui</p>
      <div className="mb-10 px-4">
        <Input 
          type="email" 
          name="email"
          value={formData.email} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/5 backdrop-blur-sm border border-white/20 text-white text-2xl py-6 px-4 placeholder:text-white/40 w-full focus:ring-1 focus:ring-blue-400/50 focus:border-transparent rounded-lg"
          placeholder="Digite seu e-mail"
          autoFocus
        />
      </div>
      <Button 
        className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all border-none shadow-lg mt-6 px-8 py-6 text-lg rounded-xl group"
        variant="default"
        onClick={handleNext}
        disabled={formData.email.trim() === ''}
      >
        Continuar
        <span className="ml-2 bg-white/20 rounded-full p-1.5 group-hover:bg-white/30 transition-all">
          <ChevronRightIcon className="h-4 w-4 text-white" />
        </span>
      </Button>
    </motion.div>,

    // Step 3: Qual seu WhatsApp
    <motion.div 
      key="whatsapp" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-semibold text-white mb-4">
        Qual seu WhatsApp?
      </h2>
      <p className="text-white/80 mb-8">Nosso consultor entrará em contato por este número</p>
      <div className="mb-10 px-4">
        <Input 
          type="tel" 
          name="whatsapp"
          value={formData.whatsapp} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/5 backdrop-blur-sm border border-white/20 text-white text-2xl py-6 px-4 placeholder:text-white/40 w-full focus:ring-1 focus:ring-blue-400/50 focus:border-transparent rounded-lg"
          placeholder="Ex: (11) 98765-4321"
        />
      </div>
      <Button 
        className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all border-none shadow-lg mt-6 px-8 py-6 text-lg rounded-xl group"
        variant="default"
        onClick={handleNext}
        disabled={formData.whatsapp.trim() === '' || formData.whatsapp.trim() === '+55' || formData.whatsapp.trim() === '+55 '}
      >
        Continuar
        <span className="ml-2 bg-white/20 rounded-full p-1.5 group-hover:bg-white/30 transition-all">
          <ChevronRightIcon className="h-4 w-4 text-white" />
        </span>
      </Button>
    </motion.div>,

    // Step 4: Qual seu Instagram
    <motion.div 
      key="instagram" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-semibold text-white mb-4">
        Qual seu Instagram?
      </h2>
      <p className="text-white/80 mb-8">Vamos personalizar a demonstração para seu perfil</p>
      <div className="mb-10 px-4">
        <Input 
          type="text" 
          name="instagram"
          value={formData.instagram} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/5 backdrop-blur-sm border border-white/20 text-white text-2xl py-6 px-4 placeholder:text-white/40 w-full focus:ring-1 focus:ring-blue-400/50 focus:border-transparent rounded-lg"
          placeholder="@seuinstagram"
          autoFocus
        />
      </div>
      <Button 
        className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all border-none shadow-lg mt-6 px-8 py-6 text-lg rounded-xl group"
        variant="default"
        onClick={handleNext}
        disabled={formData.instagram.trim() === ''}
      >
        Continuar
        <span className="ml-2 bg-white/20 rounded-full p-1.5 group-hover:bg-white/30 transition-all">
          <ChevronRightIcon className="h-4 w-4 text-white" />
        </span>
      </Button>
    </motion.div>,

    // Step 5: Qual sua área
    <motion.div 
      key="area" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-semibold text-white mb-4">
        Qual sua área?
      </h2>
      <p className="text-white/80 mb-8">A demonstração será personalizada para sua especialidade</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-10">
        {['Odontologia', 'Medicina', 'Psicologia', 'Outra'].map((option) => (
          <button
            key={option}
            onClick={() => handleSelectChange(option, 'area')}
            className={`text-left text-2xl py-6 px-6 rounded-xl backdrop-blur-sm border-2 transition-all hover:border-white/60 ${
              formData.area === option
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-white/10 border-white/30 text-white'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                formData.area === option ? 'bg-white text-blue-700' : 'border-2 border-white/60'
              }`}>
                {formData.area === option && <CheckIcon className="h-4 w-4" />}
              </div>
              {option}
            </div>
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 6: Quantos funcionários
    <motion.div 
      key="employees" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-semibold text-white mb-4">
        Quantos funcionários?
      </h2>
      <p className="text-white/80 mb-8">Vamos oferecer a solução ideal para o tamanho do seu negócio</p>
      <div className="grid grid-cols-1 gap-4 px-4 mb-10">
        {[
          'Somente eu',
          '1-10',
          '10-50',
          'Mais de 50'
        ].map((option) => (
          <button
            key={option}
            onClick={() => handleSelectChange(option, 'employees')}
            className={`text-left text-2xl py-6 px-6 rounded-xl backdrop-blur-sm border-2 transition-all hover:border-white/60 ${
              formData.employees === option
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-white/10 border-white/30 text-white'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                formData.employees === option ? 'bg-white text-blue-700' : 'border-2 border-white/60'
              }`}>
                {formData.employees === option && <CheckIcon className="h-4 w-4" />}
              </div>
              {option}
            </div>
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 7: Qual seu faturamento mensal
    <motion.div 
      key="revenue" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-semibold text-white mb-4">
        Qual seu faturamento mensal?
      </h2>
      <p className="text-white/80 mb-8">Essa informação nos ajuda a calcular seu potencial de crescimento</p>
      <div className="grid grid-cols-1 gap-4 px-4 mb-10">
        {[
          '0 - 30 mil / mês',
          '30 mil a 100 mil / mês',
          '100 mil a 1 milhão / mês',
          'Acima de 1 milhão'
        ].map((option) => (
          <button
            key={option}
            onClick={() => handleSelectChange(option, 'revenue')}
            className={`text-left text-2xl py-6 px-6 rounded-xl backdrop-blur-sm border-2 transition-all hover:border-white/60 ${
              formData.revenue === option
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-white/10 border-white/30 text-white'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                formData.revenue === option ? 'bg-white text-blue-700' : 'border-2 border-white/60'
              }`}>
                {formData.revenue === option && <CheckIcon className="h-4 w-4" />}
              </div>
              {option}
            </div>
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 8: Já utiliza alguma tecnologia
    <motion.div 
      key="technology" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-semibold text-white mb-4">
        Já utiliza alguma tecnologia?
      </h2>
      <p className="text-white/80 mb-8">Vamos mostrar como o Med1 se integra ao seu fluxo atual</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-10">
        {['Sim', 'Ainda não!'].map((option) => (
          <button
            key={option}
            onClick={() => setFormData(prev => ({...prev, useTechnology: option}))}
            className={`text-left text-2xl py-6 px-6 rounded-xl backdrop-blur-sm border-2 transition-all hover:border-white/60 ${
              formData.useTechnology === option
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-white/10 border-white/30 text-white'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                formData.useTechnology === option ? 'bg-white text-blue-700' : 'border-2 border-white/60'
              }`}>
                {formData.useTechnology === option && <CheckIcon className="h-4 w-4" />}
              </div>
              {option}
            </div>
          </button>
        ))}
      </div>
      <Button 
        className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all border-none shadow-lg mt-6 px-8 py-6 text-lg rounded-xl group"
        variant="default"
        onClick={submitFormData}
        disabled={formData.useTechnology === '' || isSubmitting}
      >
        {isSubmitting ? 'Enviando...' : 'Enviar Dados'}
        <span className="ml-2 bg-white/20 rounded-full p-1.5 group-hover:bg-white/30 transition-all">
          <CheckIcon className="h-4 w-4 text-white" />
        </span>
      </Button>
    </motion.div>,

    // Step 9: Confirmação
    <motion.div 
      key="confirmation" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-10 mb-10 shadow-2xl">
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg"
        >
          <CheckIcon className="h-14 w-14 text-white" />
        </motion.div>
        <h2 className="text-4xl font-bold text-white mb-6">
          Parabéns!
        </h2>
        <p className="text-xl text-white/90 mb-8 leading-relaxed">
          {isSubmitting ? (
            "Enviando seus dados..."
          ) : submitError ? (
            <>Erro ao enviar: {submitError}</>
          ) : (
            "Sua demonstração foi agendada! Iremos analisar sua ficha e entrar em contato em breve para confirmar os detalhes."
          )}
        </p>
        {submitError && (
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all border-none shadow-lg mt-6 px-8 py-6 text-lg rounded-xl"
            variant="default"
            onClick={submitFormData}
            disabled={isSubmitting}
          >
            Tentar novamente
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 flex flex-col relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl -z-10" />

      {/* Botão de sair */}
      <button 
        onClick={() => router.push('/auth/signin')}
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors flex items-center text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"
      >
        <span className="mr-1">Sair</span>
        <XMarkIcon className="h-4 w-4" />
      </button>

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="flex justify-center mb-16 pt-8">
          <Logo className="scale-150" variant="light" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <AnimatePresence mode="wait">
            {steps[step]}
          </AnimatePresence>
        </div>

        <div className="mt-auto pb-12 flex justify-center">
          <div className="flex space-x-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div 
                key={i} 
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-white w-8' : i < step ? 'bg-blue-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 