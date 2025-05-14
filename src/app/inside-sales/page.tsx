'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";

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
      submitFormData();
    }
  };

  const submitFormData = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      
      const response = await fetch('/api/form-submission', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao enviar dados');
      }
      
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

  const renderStep = () => {
    const commonInputClasses = "bg-white text-black w-full";
    const commonButtonClasses = "w-full bg-[#0070df] text-white hover:bg-[#0070df]/90 transition-colors border-none rounded-full mt-6";

    switch (step) {
      case 0:
        return (
          <motion.div 
            key="intro" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <h1 className="text-2xl font-semibold text-gray-800">
              Agende sua demonstração gratuita
            </h1>
            <p className="text-gray-600">
              Conheça como o Med1 pode aumentar em até 3x o número de pacientes do seu consultório
            </p>
            <Button 
              className={commonButtonClasses}
              onClick={handleNext}
            >
              Agendar agora
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        );

      case 1:
        return (
          <motion.div 
            key="name" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Qual é o seu nome?
              </h2>
              <p className="text-gray-600">Nos diga como devemos te chamar</p>
            </div>
            <Input 
              type="text" 
              name="name"
              value={formData.name} 
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite seu nome completo"
              className={commonInputClasses}
              autoFocus
            />
            <Button 
              className={commonButtonClasses}
              onClick={handleNext}
              disabled={!formData.name.trim()}
            >
              Continuar
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            key="email" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Qual é o seu email?
              </h2>
              <p className="text-gray-600">Para enviarmos informações importantes</p>
            </div>
            <Input 
              type="email" 
              name="email"
              value={formData.email} 
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite seu email profissional"
              className={commonInputClasses}
              autoFocus
            />
            <Button 
              className={commonButtonClasses}
              onClick={handleNext}
              disabled={!formData.email.trim()}
            >
              Continuar
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            key="whatsapp" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Qual é o seu WhatsApp?
              </h2>
              <p className="text-gray-600">Para agilizar nossa comunicação</p>
            </div>
            <Input 
              type="tel" 
              name="whatsapp"
              value={formData.whatsapp} 
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="+55 (00) 00000-0000"
              className={commonInputClasses}
              autoFocus
            />
            <Button 
              className={commonButtonClasses}
              onClick={handleNext}
              disabled={formData.whatsapp.length < 8}
            >
              Continuar
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            key="instagram" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Qual é o seu Instagram?
              </h2>
              <p className="text-gray-600">Para conhecermos melhor seu trabalho</p>
            </div>
            <Input 
              type="text" 
              name="instagram"
              value={formData.instagram} 
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="@seuperfil"
              className={commonInputClasses}
              autoFocus
            />
            <Button 
              className={commonButtonClasses}
              onClick={handleNext}
              disabled={!formData.instagram.trim()}
            >
              Continuar
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        );

      case 5:
        return (
          <motion.div 
            key="area" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Qual é sua área de atuação?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {['Clínica', 'Consultório', 'Hospital', 'Outro'].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className={`w-full p-4 ${formData.area === option ? 'bg-blue-50 border-blue-500' : ''}`}
                  onClick={() => handleSelectChange(option, 'area')}
                >
                  {option}
                </Button>
              ))}
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div 
            key="employees" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Quantos funcionários você tem?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {['1-5', '6-10', '11-20', '21+'].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className={`w-full p-4 ${formData.employees === option ? 'bg-blue-50 border-blue-500' : ''}`}
                  onClick={() => handleSelectChange(option, 'employees')}
                >
                  {option}
                </Button>
              ))}
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div 
            key="revenue" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Qual seu faturamento mensal?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                'Até R$ 30 mil',
                'R$ 30 mil a R$ 50 mil',
                'R$ 50 mil a R$ 100 mil',
                'Mais de R$ 100 mil'
              ].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className={`w-full p-4 ${formData.revenue === option ? 'bg-blue-50 border-blue-500' : ''}`}
                  onClick={() => handleSelectChange(option, 'revenue')}
                >
                  {option}
                </Button>
              ))}
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div 
            key="technology" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Você já usa algum software médico?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {['Sim', 'Não'].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className={`w-full p-4 ${formData.useTechnology === option ? 'bg-blue-50 border-blue-500' : ''}`}
                  onClick={() => {
                    handleSelectChange(option, 'useTechnology');
                    setTimeout(submitFormData, 500);
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>
          </motion.div>
        );

      case 9:
        return (
          <motion.div 
            key="success" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Agendamento realizado!
            </h2>
            <p className="text-gray-600">
              Em breve nossa equipe entrará em contato para agendar sua demonstração.
            </p>
            <Link href="/auth/signin">
              <Button 
                className={commonButtonClasses}
              >
                Voltar para o login
              </Button>
            </Link>
          </motion.div>
        );

      default:
        return null;
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
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {submitError && (
            <div className="mt-4 text-red-600 text-sm text-center">
              {submitError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 