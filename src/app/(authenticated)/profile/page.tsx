'use client';

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ArrowRightOnRectangleIcon, CameraIcon, LinkIcon, UserIcon, UserGroupIcon, ClipboardDocumentIcon, SparklesIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useUserPlan } from "@/hooks/use-user-plan";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { isPremium, isLoading: isPlanLoading, planExpiresAt, daysRemaining } = useUserPlan();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const [email] = useState(session?.user?.email || '');
  const [image, setImage] = useState(session?.user?.image || '');
  const [specialty, setSpecialty] = useState('');
  const [slug, setSlug] = useState('');
  const [leadCount, setLeadCount] = useState(0);
  const [indicationCount, setIndicationCount] = useState(0);
  const [baseUrl, setBaseUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    if (session?.user?.id) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/profile?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setName(data.name || '');
        setImage(data.image || '');
        setSpecialty(data.specialty || '');
        setSlug(data.slug || '');
        setLeadCount(data._count?.leads || 0);
        setIndicationCount(data._count?.indications || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
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
          specialty
        }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar perfil');

      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          image: newImage || image,
          specialty
        },
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso",
      });

      setIsEditing(false);
      fetchUserProfile();
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
    const profileUrl = `${baseUrl}/${slug}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Link copiado",
      description: "Seu link de perfil foi copiado para a área de transferência",
    });
  };

  return (
    <div className="container max-w-3xl mx-auto p-4 pt-20 lg:pt-10">
      <Card className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-blue-500/20 pb-4">
          <CardTitle className="text-xl font-medium text-white">Seu Perfil</CardTitle>
          <div className="flex items-center gap-2">
            {isPremium ? (
              <Badge className="bg-blue-500/30 text-blue-100 border-blue-400/30 mr-2">
                <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                Premium
              </Badge>
            ) : (
              <Badge className="bg-white/20 text-white/80 border-white/30 mr-2">
                Free
              </Badge>
            )}
            {!isEditing && (
              <Button 
                variant="outline" 
                className="bg-white text-blue-700 hover:bg-white/90 transition-colors border-none"
                onClick={() => setIsEditing(true)}
              >
                Editar Perfil
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {/* Profile Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-blue-300/40 bg-blue-900/30">
                  {image ? (
                    <Image
                      src={image}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-800/30">
                      <CameraIcon className="h-12 w-12 text-blue-200" />
                    </div>
                  )}
                </div>
                <label 
                  className="absolute inset-0 flex items-center justify-center bg-blue-600/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                  htmlFor="image-upload"
                >
                  <CameraIcon className="h-8 w-8 text-white" />
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
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-600/50 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-blue-100/80">
                Clique na imagem para alterar sua foto
              </p>
            </div>

            {/* Profile Info */}
            <div className="md:col-span-2 space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-blue-100 font-medium">Nome</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-blue-100 font-medium">Especialidade</label>
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
                      placeholder="Ex: Cardiologista, Nutricionista..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-blue-100 font-medium">Email</label>
                    <p className="text-lg text-white">{email}</p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={() => handleSave()}
                      className="bg-white text-blue-700 hover:bg-white/90 border-none"
                    >
                      Salvar Alterações
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="bg-blue-700/30 border-blue-500/30 text-blue-100 hover:bg-blue-600/40"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-light text-white">{name}</h2>
                    <p className="text-blue-200">{specialty}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-blue-100/80">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>Username: <span className="text-white font-medium">{slug}</span></span>
                    </div>
                    
                    <div className="flex items-center text-blue-100/80">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      <span>Seu link: <span className="text-white">{baseUrl}/{slug}</span></span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-6 w-6 p-0 hover:bg-blue-600/30 text-blue-200"
                        onClick={copyProfileLinkToClipboard}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-blue-100/80">
                      <span className="mr-4">
                        <UserGroupIcon className="h-4 w-4 inline mr-1" />
                        {leadCount} leads
                      </span>
                      <span>
                        <LinkIcon className="h-4 w-4 inline mr-1" />
                        {indicationCount} indicações
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Plano do Usuário */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/30">
            <CardHeader className="border-b border-blue-500/20">
              <CardTitle className="text-lg font-medium text-white">Seu Plano</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="space-y-2">
                  {isPremium ? (
                    <>
                      <div className="flex items-center">
                        <SparklesIcon className="h-5 w-5 text-blue-300 mr-2" />
                        <h3 className="text-xl font-medium text-blue-200">Plano Premium</h3>
                      </div>
                      <p className="text-blue-100/80">
                        Acesso total a todos os recursos da plataforma
                      </p>
                      {planExpiresAt && (
                        <p className="text-sm text-blue-100/60">
                          Expira em: {format(planExpiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {daysRemaining !== null && daysRemaining <= 30 && (
                            <span className="ml-2 text-amber-300">
                              ({daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes)
                            </span>
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-blue-200/70 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-medium text-blue-200">Plano Gratuito</h3>
                      </div>
                      <p className="text-blue-100/80">
                        Acesso básico com recursos limitados
                      </p>
                    </>
                  )}
                </div>
                <div className="mt-4 md:mt-0">
                  <Button 
                    onClick={() => router.push('/pricing')}
                    className={isPremium ? "bg-blue-600/30 border border-blue-400/30 text-blue-100 hover:bg-blue-600/40" : "bg-white text-blue-700 hover:bg-white/90 border-none"}
                  >
                    <ShoppingCartIcon className="h-4 w-4 mr-2" />
                    {isPremium ? "Gerenciar Assinatura" : "Fazer Upgrade"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Estatísticas e Resumo */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/30">
            <CardHeader className="border-b border-blue-500/20">
              <CardTitle className="text-lg font-medium text-white">Resumo da Atividade</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-600/20 backdrop-blur-sm p-4 rounded-lg text-center border border-blue-500/30">
                  <p className="text-2xl font-light text-white">{leadCount}</p>
                  <p className="text-sm text-blue-100/80">Leads Totais</p>
                </div>
                <div className="bg-blue-600/20 backdrop-blur-sm p-4 rounded-lg text-center border border-blue-500/30">
                  <p className="text-2xl font-light text-white">{indicationCount}</p>
                  <p className="text-sm text-blue-100/80">Links de Indicação</p>
                </div>
                <div className="bg-blue-600/20 backdrop-blur-sm p-4 rounded-lg text-center border border-blue-500/30">
                  <p className="text-2xl font-light text-white">0</p>
                  <p className="text-sm text-blue-100/80">Taxa de Conversão</p>
                </div>
                <div className="bg-blue-600/20 backdrop-blur-sm p-4 rounded-lg text-center border border-blue-500/30">
                  <p className="text-2xl font-light text-white">0</p>
                  <p className="text-sm text-blue-100/80">Cliques Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botão de Logout */}
          <div className="pt-4">
            <Button 
              variant="outline" 
              className="w-full bg-red-500/20 border-red-400/30 text-red-100 hover:bg-red-500/30 transition-colors"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 