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
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <CardTitle className="text-xl font-medium text-gray-800">Seu Perfil</CardTitle>
          {!isEditing && (
            <Button 
              variant="outline" 
              className="bg-white border-blue-700 text-blue-700 hover:bg-blue-50 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              Editar Perfil
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {/* Profile Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-blue-200 bg-gray-50">
                  {image ? (
                    <Image
                      src={image}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <CameraIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <label 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Clique na imagem para alterar sua foto
              </p>
            </div>

            {/* Profile Info */}
            <div className="md:col-span-2 space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600 font-medium">Nome</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-gray-200 focus:border-blue-700 focus:ring-blue-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-600 font-medium">Especialidade</label>
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="border-gray-200 focus:border-blue-700 focus:ring-blue-50"
                      placeholder="Ex: Cardiologista, Nutricionista..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600 font-medium">Email</label>
                    <p className="text-lg text-gray-700">{email}</p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={() => handleSave()}
                      className="bg-blue-700 hover:bg-blue-800 text-white transition-colors"
                    >
                      Salvar Alterações
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-light text-gray-800">{name}</h2>
                    <p className="text-blue-700">{specialty}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>Username: <span className="text-gray-800 font-medium">{slug}</span></span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      <span>Seu link: <span className="text-gray-800">{baseUrl}/{slug}</span></span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-700"
                        onClick={copyProfileLinkToClipboard}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-gray-600">
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
          <Card className="bg-white border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-medium text-gray-800">Resumo da Atividade</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-light text-blue-700">{leadCount}</p>
                  <p className="text-sm text-gray-600">Leads Totais</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-light text-blue-700">{indicationCount}</p>
                  <p className="text-sm text-gray-600">Links de Indicação</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-light text-blue-700">0</p>
                  <p className="text-sm text-gray-600">Taxa de Conversão</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-light text-blue-700">0</p>
                  <p className="text-sm text-gray-600">Cliques Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botão de Logout */}
          <div className="pt-4">
            <Button 
              variant="outline" 
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
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