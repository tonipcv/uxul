'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrashIcon } from "@heroicons/react/24/outline";

interface Thought {
  id: string;
  content: string;
  createdAt: string;
}

export default function ThoughtsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [newThought, setNewThought] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingThought, setEditingThought] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadThoughts();
  }, []);

  const loadThoughts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/thoughts');
      const data = await response.json();
      if (Array.isArray(data)) {
        setThoughts(data);
      }
    } catch (error) {
      console.error('Error loading thoughts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThought.trim()) return;

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newThought })
      });

      if (response.ok) {
        const thought = await response.json();
        setThoughts(prev => [thought, ...prev]);
        setNewThought('');
      }
    } catch (error) {
      console.error('Error creating thought:', error);
    }
  };

  const handleEdit = async (thoughtId: string) => {
    if (!editContent.trim()) {
      setEditingThought(null);
      return;
    }

    try {
      const response = await fetch(`/api/thoughts/${thoughtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });

      if (response.ok) {
        const updatedThought = await response.json();
        setThoughts(prev => prev.map(t => 
          t.id === thoughtId ? updatedThought : t
        ));
        setEditingThought(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error updating thought:', error);
    }
  };

  const handleDelete = async (thoughtId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pensamento?')) return;

    try {
      const response = await fetch(`/api/thoughts/${thoughtId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setThoughts(prev => prev.filter(t => t.id !== thoughtId));
      }
    } catch (error) {
      console.error('Error deleting thought:', error);
    }
  };

  const startEditing = (thought: Thought) => {
    setEditingThought(thought.id);
    setEditContent(thought.content);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset hours to compare only dates
    const thoughtDate = new Date(date);
    thoughtDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - thoughtDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, "'Hoje às' HH:mm", { locale: ptBR });
    } else if (diffDays === 1) {
      return format(date, "'Ontem às' HH:mm", { locale: ptBR });
    } else if (diffDays === 2) {
      return format(date, "'2 dias atrás às' HH:mm", { locale: ptBR });
    } else if (diffDays === 3) {
      return format(date, "'3 dias atrás às' HH:mm", { locale: ptBR });
    }
    return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-col space-y-4 pb-4 lg:pb-7 sticky top-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10 pt-[72px] lg:pt-4">
          <CardTitle className="text-xs font-normal text-white/70">Pensamentos</CardTitle>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8 space-y-6 px-4 lg:px-6">
          {/* Form for new thought */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
              placeholder="O que você está pensando?"
              className="min-h-[100px] text-sm resize-none w-full"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="text-xs border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                disabled={!newThought.trim() || isLoading}
              >
                Publicar
              </Button>
            </div>
          </form>

          {/* List of thoughts */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <span className="text-xs text-muted-foreground">Carregando...</span>
              </div>
            ) : thoughts.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-xs text-muted-foreground">Nenhum pensamento registrado</span>
              </div>
            ) : (
              thoughts.map((thought) => (
                <Card key={thought.id} className="border border-white/10">
                  <CardContent className="p-4 space-y-2">
                    {editingThought === thought.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[100px] text-sm resize-none w-full"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingThought(null);
                              setEditContent('');
                            }}
                            className="text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEdit(thought.id)}
                            className="text-xs border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                            disabled={!editContent.trim()}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group">
                        <div className="flex justify-between items-start">
                          <p 
                            className="text-sm whitespace-pre-wrap cursor-pointer hover:text-white/90 transition-colors flex-1"
                            onDoubleClick={() => startEditing(thought)}
                          >
                            {thought.content}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                            onClick={() => handleDelete(thought.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(thought.createdAt)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 