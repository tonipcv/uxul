'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function BloqueadoPage() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleContinue = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.push('/inside-sales');
    }, 300);
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
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm"
        >
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              Libere seu acesso
            </h1>
            
            <p className="text-gray-600 leading-relaxed">
              Para ter acesso a MED1 é necessário conversar com nosso time e iniciar o Onboarding, nossa solução é personalizada para sua situação atual e nosso foco é no mínimo duplicar seu faturamento.
            </p>
            
            <p className="text-gray-600 leading-relaxed">
              O Onboarding é feito por ordem de chegada. Para agendar o seu, clique no botão abaixo e preencha os dados.
            </p>
            
            <Button 
              className="w-full bg-[#0070df] text-white hover:bg-[#0070df]/90 transition-colors border-none rounded-full"
              onClick={handleContinue}
              disabled={isAnimating}
            >
              Continuar
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin" 
              className="text-gray-600 hover:text-black text-sm"
            >
              Voltar para o login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 