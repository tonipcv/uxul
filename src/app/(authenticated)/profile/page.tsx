'use client';

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ArrowRightOnRectangleIcon, CameraIcon, LinkIcon, UserIcon, UserGroupIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
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
      <Card className="bg-background/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Seu Perfil</CardTitle>
          {!isEditing && (
            <Button 
              variant="outline" 
              className="bg-white/5 hover:bg-white/10 border-white/10"
              onClick={() => setIsEditing(true)}
            >
              Editar Perfil
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Profile Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-turquoise/30 bg-white/5">
                  {image ? (
                    <Image
                      src={image}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <CameraIcon className="h-12 w-12 text-white/30" />
                    </div>
                  )}
                </div>
                <label 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-white/50">
                Clique na imagem para alterar sua foto
              </p>
            </div>

            {/* Profile Info */}
            <div className="md:col-span-2 space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/70 font-medium">Nome</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-white/70 font-medium">Especialidade</label>
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="bg-white/5 border-white/10"
                      placeholder="Ex: Cardiologista, Nutricionista..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-white/70 font-medium">Email</label>
                    <p className="text-lg text-white/80">{email}</p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={() => handleSave()}
                      className="bg-gradient-to-r from-turquoise/80 to-turquoise/60"
                    >
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-light">{name}</h2>
                    <p className="text-turquoise/80">{specialty}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-white/70">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>Username: <span className="text-white font-medium">{slug}</span></span>
                    </div>
                    
                    <div className="flex items-center text-white/70">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      <span>Seu link: <span className="text-white">{baseUrl}/{slug}</span></span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-6 w-6 p-0"
                        onClick={copyProfileLinkToClipboard}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-white/70">
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
          
          {/* Estatísticas e Resumo */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-light">Resumo da Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-4 rounded-lg text-center">
                  <p className="text-2xl font-light text-turquoise">{leadCount}</p>
                  <p className="text-xs text-white/50">Leads Totais</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg text-center">
                  <p className="text-2xl font-light text-turquoise">{indicationCount}</p>
                  <p className="text-xs text-white/50">Links de Indicação</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg text-center">
                  <p className="text-2xl font-light text-turquoise/80">0</p>
                  <p className="text-xs text-white/50">Taxa de Conversão</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg text-center">
                  <p className="text-2xl font-light text-turquoise/80">0</p>
                  <p className="text-xs text-white/50">Cliques Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botão de Logout */}
          <div className="pt-4">
            <Button 
              variant="ghost" 
              className="w-full text-white/70 hover:text-white"
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