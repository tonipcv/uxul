'use client';

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import { ArrowRightOnRectangleIcon, CameraIcon } from '@heroicons/react/24/outline';
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const [email] = useState(session?.user?.email || '');
  const [image, setImage] = useState(session?.user?.image || '');
  const [isUploading, setIsUploading] = useState(false);

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
          image: newImage || image 
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
        },
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 pt-20 lg:pt-10">
      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
              Clique na imagem para alterar sua foto de perfil
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Nome</label>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5"
              />
            ) : (
              <p className="text-lg">{name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Email</label>
            <p className="text-lg">{email}</p>
          </div>

          <div className="pt-4 space-y-4">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={() => handleSave()}>Salvar</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
            )}

            <Button 
              variant="ghost" 
              className="w-full text-white/70 hover:text-white"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 