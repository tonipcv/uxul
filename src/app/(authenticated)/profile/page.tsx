'use client';

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ArrowRightOnRectangleIcon, CameraIcon, LinkIcon, UserIcon, UserGroupIcon, ClipboardDocumentIcon, SparklesIcon, ShoppingCartIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useUserPlan } from "@/hooks/use-user-plan";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isPremium, isLoading: isPlanLoading, planExpiresAt, daysRemaining } = useUserPlan();

  // Estados para os dados do perfil
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [slug, setSlug] = useState('');
  const [pageTemplate, setPageTemplate] = useState('default');
  const [leadCount, setLeadCount] = useState(0);
  const [indicationCount, setIndicationCount] = useState(0);
  const [baseUrl, setBaseUrl] = useState('');
  
  // Estados de UI
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false);
  
  // Estado para garantir renderização no cliente
  const [isClient, setIsClient] = useState(false);

  // Marcar que estamos no cliente
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Efeito para carregar os dados do perfil quando a sessão estiver pronta
  useEffect(() => {
    if (status === 'loading' || !isClient) return;
    
    if (status === 'authenticated' && session?.user?.id && !profileFetched) {
      fetchUserProfile();
    } else if (status === 'unauthenticated') {
      // Redirecionar para login se não estiver autenticado
      router.push('/auth/signin');
    }
  }, [status, session, isClient, profileFetched]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Usar AbortController para poder cancelar a requisição se necessário
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`/api/users/profile?userId=${session.user.id}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        // Atualizar os estados apenas quando os dados forem recebidos
        setName(data.name || '');
        setEmail(data.email || '');
        setImage(data.image || '');
        setSpecialty(data.specialty || '');
        setSlug(data.slug || '');
        setPageTemplate(data.pageTemplate || 'default');
        setLeadCount(data._count?.leads || 0);
        setIndicationCount(data._count?.indications || 0);
        setProfileFetched(true);
      } else {
        console.error('Erro ao buscar perfil:', response.statusText);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao buscar perfil do usuário:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha ao fazer upload da imagem');

      const data = await response.json();
      setImage(data.url);
      
      // Update session and save to database
      await handleSave(data.url);
      
      // Force refresh to update navigation
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer o upload da imagem",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (newImage?: string) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          image: newImage || image,
          specialty,
          pageTemplate
        }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar perfil');

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive"
      });
    }
  };

  const copyProfileLinkToClipboard = () => {
    if (isClient && typeof navigator !== 'undefined' && navigator.clipboard) {
      const profileUrl = `${baseUrl}/${slug}`;
      navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copiado",
        description: "Seu link de perfil foi copiado para a área de transferência",
      });
    }
  };

  // Mostrar um spinner enquanto carrega
  if (!isClient || status === 'loading' || (isLoading && !profileFetched)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-16 md:pt-12 md:pb-12 px-4">
      <div className="container mx-auto pl-1 sm:pl-4 md:pl-8 lg:pl-16 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 sm:mb-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Seu Perfil</h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus dados e configurações</p>
          </div>
          {!isEditing && (
            <div className="flex gap-2 mt-2 md:mt-0">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 h-8 text-xs"
                onClick={() => setIsEditing(true)}
              >
                Editar Perfil
              </Button>
              <Link href="/settings/interest-options">
                <Button 
                  variant="outline"
                  size="sm"
                  className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 h-8 text-xs"
                >
                  Configurações
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Visão geral do perfil */}
        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl mb-4">
          <CardHeader className="px-4 py-3 sm:p-3">
            <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">
              Informações Pessoais
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
              Dados da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-3 sm:p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-gray-300 bg-gray-200">
                    {image ? (
                      <Image
                        src={image}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <CameraIcon className="h-10 w-10 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <label 
                    className="absolute inset-0 flex items-center justify-center bg-gray-800/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                    htmlFor="image-upload"
                  >
                    <CameraIcon className="h-6 w-6 text-white" />
                  </label>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Clique na imagem para alterar sua foto
                </p>
              </div>

              {/* Dados do perfil */}
              <div className="md:col-span-2 space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700 font-medium">Nome</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white shadow-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700 font-medium">Especialidade</Label>
                      <Input
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="bg-white shadow-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-8 text-xs"
                        placeholder="Ex: Cardiologista, Nutricionista..."
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700 font-medium">Email</Label>
                      <p className="text-xs text-gray-900">{email}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-700 font-medium">Template da Página</Label>
                      <Select value={pageTemplate} onValueChange={setPageTemplate}>
                        <SelectTrigger className="bg-white shadow-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-8 text-xs">
                          <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border border-gray-200 shadow-md">
                          <SelectItem value="default" className="focus:bg-blue-50 text-xs">Padrão</SelectItem>
                          <SelectItem value="minimal" className="focus:bg-blue-50 text-xs">Minimalista</SelectItem>
                          <SelectItem value="pro" className="focus:bg-blue-50 text-xs">Profissional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-2 flex gap-2">
                      <Button 
                        type="button" 
                        onClick={() => handleSave()}
                        className="bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-blue-500/20 rounded-xl h-8 text-xs"
                      >
                        Salvar Alterações
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        className="border border-gray-300 bg-white text-gray-700 rounded-xl shadow-sm h-8 text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-[-0.03em] font-inter">{name}</h2>
                      {specialty && (
                        <div className="flex items-center mt-1">
                          <UserIcon className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          <span className="text-gray-700 text-xs">{specialty}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center text-gray-700">
                        <UserIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="text-xs">Username: <span className="font-medium">{slug}</span></span>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="text-xs">Seu link: <span className="text-gray-900">{baseUrl}/{slug}</span></span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-1 h-5 w-5 p-0 hover:bg-gray-100 text-gray-500 rounded-lg"
                          onClick={copyProfileLinkToClipboard}
                        >
                          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-1.5">
                        <div className="text-xs bg-[#f2f1ff] text-[#8b5cf6] px-1.5 py-0.5 rounded-md flex items-center">
                          <UserGroupIcon className="h-3.5 w-3.5 inline mr-1" />
                          {leadCount} leads
                        </div>
                        <div className="text-xs bg-[#def6ff] text-[#6366f1] px-1.5 py-0.5 rounded-md flex items-center">
                          <LinkIcon className="h-3.5 w-3.5 inline mr-1" />
                          {indicationCount} indicações
                        </div>
                        {isPremium && (
                          <div className="text-xs bg-[#d8fffa] text-[#4ade80] px-1.5 py-0.5 rounded-md flex items-center">
                            <SparklesIcon className="h-3.5 w-3.5 inline mr-1" />
                            Premium
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas do usuário */}
        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl mb-4">
          <CardHeader className="px-4 py-3 sm:p-3">
            <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">
              Métricas e Estatísticas
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
              Desempenho da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-3 sm:p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <UserGroupIcon className="h-4 w-4 text-[#8b5cf6]" />
                    <p className="text-xs text-gray-700">Leads Totais</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-gray-900">{leadCount}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <LinkIcon className="h-4 w-4 text-[#6366f1]" />
                    <p className="text-xs text-gray-700">Links de Indicação</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-gray-900">{indicationCount}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <SwatchIcon className="h-4 w-4 text-[#4ade80]" />
                    <p className="text-xs text-gray-700">Taxa de Conversão</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-gray-900">
                    {indicationCount && leadCount
                      ? `${Math.round((leadCount / indicationCount) * 100)}%`
                      : "0%"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCartIcon className="h-4 w-4 text-gray-700" />
                    <p className="text-xs text-gray-700">Status da Conta</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-gray-900">
                    {isPremium ? "Premium" : "Free"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Logout */}
        <div className="pt-1">
          <Button 
            variant="outline" 
            className="w-full bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 h-8 text-xs"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <ArrowRightOnRectangleIcon className="h-3.5 w-3.5 mr-1.5" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
} 