'use client';

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ArrowRightOnRectangleIcon, CameraIcon, LinkIcon, UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Estados para os dados do perfil
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  
  // Estados de UI
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false);
  
  // Estado para garantir renderização no cliente
  const [isClient, setIsClient] = useState(false);

  // Efeito para marcar que estamos no cliente
  useEffect(() => {
    setIsClient(true);
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
  }, [status, session, isClient, profileFetched, router]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/profile?userId=${session.user.id}`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Dados do perfil:", data); // Debug: verificar dados recebidos
        
        // Atualizar os estados apenas quando os dados forem recebidos
        setName(data.name || '');
        setEmail(data.email || '');
        setImage(data.image || '');
        setSpecialty(data.specialty || '');
        setSlug(data.slug || '');
        setPhone(data.phone || '');
        setProfileFetched(true);
      } else {
        console.error('Erro ao buscar perfil:', response.statusText);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seu perfil. Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um problema ao carregar seus dados.",
        variant: "destructive"
      });
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
          phone
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

  // Mostrar um spinner enquanto carrega
  if (!isClient || status === 'loading' || (isLoading && !profileFetched)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4 lg:ml-52">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-0 max-w-[95%] lg:max-w-[90%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seu Perfil</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie suas informações pessoais
            </p>
          </div>
          
          {!isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
              className="mt-4 md:mt-0 bg-primary hover:bg-primary/90"
              >
                Editar Perfil
              </Button>
          )}
        </div>

        <Card className="bg-white shadow-md mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Seus dados básicos de contato</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
              {/* Coluna da foto */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="rounded-full overflow-hidden w-full h-full border-2 border-gray-200">
                    {image ? (
                      <Image
                        src={image}
                        alt={name || "Perfil"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <UserIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {!isEditing ? null : (
                    <>
                  <label 
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full text-white"
                        htmlFor="profile-photo"
                  >
                        <CameraIcon className="h-8 w-8" />
                  </label>
                  <input
                    type="file"
                        id="profile-photo"
                        className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                    </>
                  )}
                  
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="w-full mt-2"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>

              {/* Coluna dos dados */}
              <div>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                      <Input
                          id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome completo"
                      />
                    </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                      <Input
                          id="email"
                          value={email}
                          disabled
                          className="bg-gray-50"
                      />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidade</Label>
                        <Input
                          id="specialty"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="Ex: Cardiologista, Dentista..."
                        />
                    </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => handleSave()}
                      >
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Nome</h3>
                        <p className="text-gray-900">{name || "-"}</p>
                      </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                          <p className="text-gray-900">{email || "-"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Especialidade</h3>
                        <p className="text-gray-900">{specialty || "-"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Telefone</h3>
                        {phone ? (
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <p className="text-gray-900">{phone}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">Não informado</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Username</h3>
                      <p className="text-gray-900">{slug || "-"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle>Configurações da Conta</CardTitle>
            <CardDescription>Preferências e opções adicionais</CardDescription>
          </CardHeader>
          
          <CardContent>
            <p className="text-gray-600 mb-4">
              Para alterar sua senha ou informações avançadas, entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 