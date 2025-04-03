'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function InsideSalesPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    area: '',
    employees: '',
    revenue: '',
    useTechnology: ''
  });
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1 && formData.name.trim() !== '') {
      setStep(2);
    } else if (step === 2 && formData.email.trim() !== '') {
      setStep(3);
    } else if (step === 3 && formData.whatsapp.trim() !== '') {
      setStep(4);
    } else if (step === 4 && formData.area !== '') {
      setStep(5);
    } else if (step === 5 && formData.employees !== '') {
      setStep(6);
    } else if (step === 6 && formData.revenue.trim() !== '') {
      setStep(7);
    } else if (step === 7 && formData.useTechnology.trim() !== '') {
      setStep(8);
    } else if (step === 8) {
      // Enviar dados do formulário ou redirecionar
      router.push('/pricing');
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
      <h1 className="text-3xl md:text-4xl font-light text-white mb-6 leading-tight">
        Duplique a quantidade de pacientes em 1 mês utilizando o CRM mais avançado de Indicações
      </h1>
      <Button 
        className="bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg px-8 py-6 text-lg"
        variant="default"
        onClick={handleNext}
      >
        Continuar
        <ChevronRightIcon className="h-5 w-5 ml-2" />
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
      <h2 className="text-3xl font-light text-white mb-12">
        Qual é o seu nome?
      </h2>
      <div className="mb-10 px-4">
        <Input 
          type="text" 
          name="name"
          value={formData.name} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-3xl py-8 px-6 placeholder:text-white/60 placeholder:text-3xl w-full focus:ring-2 focus:ring-white/50 focus:border-transparent"
          placeholder="Digite seu nome"
          autoFocus
          style={{ fontSize: '1.875rem' }}
        />
      </div>
      <Button 
        className="bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg mt-6 px-8 py-6 text-xl"
        variant="default"
        onClick={handleNext}
        disabled={formData.name.trim() === ''}
      >
        Continuar
        <ChevronRightIcon className="h-5 w-5 ml-2" />
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
      <h2 className="text-3xl font-light text-white mb-12">
        Qual seu e-mail?
      </h2>
      <div className="mb-10 px-4">
        <Input 
          type="email" 
          name="email"
          value={formData.email} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-3xl py-8 px-6 placeholder:text-white/60 placeholder:text-3xl w-full focus:ring-2 focus:ring-white/50 focus:border-transparent"
          placeholder="Digite seu e-mail"
          autoFocus
          style={{ fontSize: '1.875rem' }}
        />
      </div>
      <Button 
        className="bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg mt-6 px-8 py-6 text-xl"
        variant="default"
        onClick={handleNext}
        disabled={formData.email.trim() === ''}
      >
        Continuar
        <ChevronRightIcon className="h-5 w-5 ml-2" />
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
      <h2 className="text-3xl font-light text-white mb-12">
        Qual seu WhatsApp?
      </h2>
      <div className="mb-10 px-4">
        <Input 
          type="tel" 
          name="whatsapp"
          value={formData.whatsapp} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-3xl py-8 px-6 placeholder:text-white/60 placeholder:text-3xl w-full focus:ring-2 focus:ring-white/50 focus:border-transparent"
          placeholder="(00) 00000-0000"
          autoFocus
          style={{ fontSize: '1.875rem' }}
        />
      </div>
      <Button 
        className="bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg mt-6 px-8 py-6 text-xl"
        variant="default"
        onClick={handleNext}
        disabled={formData.whatsapp.trim() === ''}
      >
        Continuar
        <ChevronRightIcon className="h-5 w-5 ml-2" />
      </Button>
    </motion.div>,

    // Step 4: Qual sua área
    <motion.div 
      key="area" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-light text-white mb-12">
        Qual sua área?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-10">
        {['Odontologia', 'Medicina', 'Psicologia', 'Outra'].map((option) => (
          <button
            key={option}
            onClick={() => {
              handleSelectChange(option, 'area');
              setTimeout(handleNext, 300);
            }}
            className={`text-left text-2xl py-6 px-6 rounded-lg backdrop-blur-sm border-2 transition-all ${
              formData.area === option
                ? 'bg-white/30 border-white text-white'
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

    // Step 5: Quantos funcionários
    <motion.div 
      key="employees" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-light text-white mb-12">
        Quantos funcionários?
      </h2>
      <div className="grid grid-cols-1 gap-4 px-4 mb-10">
        {[
          'Somente eu',
          '1-10',
          '10-50',
          'Mais de 50'
        ].map((option) => (
          <button
            key={option}
            onClick={() => {
              handleSelectChange(option, 'employees');
              setTimeout(handleNext, 300);
            }}
            className={`text-left text-2xl py-6 px-6 rounded-lg backdrop-blur-sm border-2 transition-all ${
              formData.employees === option
                ? 'bg-white/30 border-white text-white'
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

    // Step 6: Qual seu faturamento mensal
    <motion.div 
      key="revenue" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-light text-white mb-12">
        Qual seu faturamento mensal?
      </h2>
      <div className="mb-10 px-4">
        <Input 
          type="text" 
          name="revenue"
          value={formData.revenue} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-3xl py-8 px-6 placeholder:text-white/60 placeholder:text-3xl w-full focus:ring-2 focus:ring-white/50 focus:border-transparent"
          placeholder="R$ 0,00"
          autoFocus
          style={{ fontSize: '1.875rem' }}
        />
      </div>
      <Button 
        className="bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg mt-6 px-8 py-6 text-xl"
        variant="default"
        onClick={handleNext}
        disabled={formData.revenue.trim() === ''}
      >
        Continuar
        <ChevronRightIcon className="h-5 w-5 ml-2" />
      </Button>
    </motion.div>,

    // Step 7: Já utiliza alguma tecnologia
    <motion.div 
      key="technology" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-light text-white mb-12">
        Já utiliza alguma tecnologia?
      </h2>
      <div className="mb-10 px-4">
        <Input 
          type="text" 
          name="useTechnology"
          value={formData.useTechnology} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-3xl py-8 px-6 placeholder:text-white/60 placeholder:text-3xl w-full focus:ring-2 focus:ring-white/50 focus:border-transparent"
          placeholder="Digite aqui"
          autoFocus
          style={{ fontSize: '1.875rem' }}
        />
      </div>
      <Button 
        className="bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg mt-6 px-8 py-6 text-xl"
        variant="default"
        onClick={handleNext}
        disabled={formData.useTechnology.trim() === ''}
      >
        Continuar
        <ChevronRightIcon className="h-5 w-5 ml-2" />
      </Button>
    </motion.div>,

    // Step 8: Confirmação
    <motion.div 
      key="confirmation" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-8 mb-10">
        <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckIcon className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-3xl font-light text-white mb-4">
          Parabéns!
        </h2>
        <p className="text-xl text-white/80 mb-8">
          Sua aplicação foi enviada, iremos analisar sua ficha para começarmos o Onboarding!
        </p>
      </div>
    </motion.div>
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 flex flex-col relative">
      {/* Botão de sair */}
      <button 
        onClick={() => router.push('/auth/signin')}
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors flex items-center text-xs"
      >
        <span className="mr-1">Sair</span>
        <XMarkIcon className="h-4 w-4" />
      </button>

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="flex justify-center mb-16 pt-8">
          <Logo className="scale-150" variant="light" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <AnimatePresence mode="wait">
            {steps[step]}
          </AnimatePresence>
        </div>

        <div className="mt-auto pb-12 flex justify-center">
          <div className="flex space-x-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div 
                key={i} 
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-white w-8' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 