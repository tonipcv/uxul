'use client';

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const [email] = useState(session?.user?.email || '');

  const handleSave = async () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 pt-20 lg:pt-10">
      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                <Button onClick={handleSave}>Salvar</Button>
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