'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';
import { ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from "next/navigation";

export default function BloqueadoPage() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleContinue = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.push('/inside-sales');
    }, 300);
  };

  const handleExit = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 flex flex-col relative">
      {/* Botão de sair */}
      <button 
        onClick={handleExit}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-8 max-w-2xl text-center"
          >
            <h1 className="text-3xl font-light text-white mb-6">
              Libere seu acesso
            </h1>
            
            <p className="text-xl text-white/80 mb-6 leading-relaxed">
              Para ter acesso a MED1 é necessário conversar com nosso time e iniciar o Onboarding, nossa solução é personalizada para sua situação atual e nosso foco é no mínimo duplicar seu faturamento.
            </p>
            
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              O Onboarding é feito por ordem de chegando para agendar o seu, clica no botão de continuar e preencha os dados.
            </p>
            
            <Button 
              className="bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg px-8 py-6 text-lg mx-auto"
              variant="default"
              onClick={handleContinue}
              disabled={isAnimating}
            >
              Continuar
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 