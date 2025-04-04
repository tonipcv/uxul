/* eslint-disable */
'use client';
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Habit {
  id: number;
  title: string;
  category: string;
  progress: Array<{
    date: string;
    isChecked: boolean;
  }>;
}

export default function ChecklistPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState({ title: '', category: 'personal' });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isTodayColumnSticky, setIsTodayColumnSticky] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const todayColumnRef = useRef<HTMLTableCellElement>(null);

  const categories = [
    { id: 'personal', name: 'Pessoal' },
    { id: 'health', name: 'Saúde' },
    { id: 'work', name: 'Trabalho' },
  ];

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Pegar o primeiro dia da semana (0 = Domingo, 1 = Segunda, etc)
    const firstDayOfWeek = start.getDay();
    
    // Adicionar dias do mês anterior para completar a primeira semana
    const previousMonthDays: Date[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - (i + 1));
      previousMonthDays.push(date);
    }

    // Adicionar dias do próximo mês para completar a última semana
    const lastDayOfWeek = end.getDay();
    const nextMonthDays: Date[] = [];
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      nextMonthDays.push(date);
    }

    return [...previousMonthDays, ...days, ...nextMonthDays];
  };

  const days = getDaysInMonth();

  const loadHabits = useCallback(async () => {
    try {
      setIsLoading(true);
      const month = currentDate.toISOString();
      const response = await fetch(`/api/habits?month=${month}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        // Garantir que cada hábito tenha um array de progress
        const habitsWithProgress = data.map(habit => ({
          ...habit,
          progress: habit.progress || []
        }));
        setHabits(habitsWithProgress);
      } else {
        setHabits([]);
        console.error('Invalid data format:', data);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
      setHabits([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Update isTodayColumnSticky state when the table is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (todayColumnRef.current && tableRef.current) {
        const columnRect = todayColumnRef.current.getBoundingClientRect();
        const tableRect = tableRef.current.getBoundingClientRect();
        
        if (columnRect.left < tableRect.left + 192) {
          setIsTodayColumnSticky(true);
        } else {
          setIsTodayColumnSticky(false);
        }
      }
    };

    if (tableRef.current) {
      tableRef.current.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial call in case today is already out of view
    }

    return () => {
      tableRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleHabit = async (habitId: number, date: string) => {
    try {
      const response = await fetch('/api/habits/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date })
      });
      
      if (response.ok) {
        setHabits(habits.map(habit => {
          if (habit.id === habitId) {
            const existingProgress = habit.progress.find(p => p.date === date);
            if (existingProgress) {
              return {
                ...habit,
                progress: habit.progress.map(p => 
                  p.date === date ? { ...p, isChecked: !p.isChecked } : p
                )
              };
            } else {
              return {
                ...habit,
                progress: [...habit.progress, { date, isChecked: true }]
              };
            }
          }
          return habit;
        }));
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title.trim()) return;

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHabit)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.error) {
          console.error('Server error:', data.error);
          return;
        }
        
        setHabits(prevHabits => [...prevHabits, data]);
        setNewHabit({ title: '', category: 'personal' });
        setIsModalOpen(false);
      } else {
        console.error('Error adding habit:', data.error || data.details || response.statusText);
      }
    } catch (error) {
      console.error('Network error adding habit:', error);
    }
  };

  const handleEditHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabit || !editTitle.trim()) return;

    try {
      const response = await fetch(`/api/habits/${selectedHabit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editTitle,
          category: editCategory 
        })
      });

      if (response.ok) {
        const updatedHabit = await response.json();
        setHabits(prev => prev.map(h => h.id === selectedHabit.id ? updatedHabit : h));
        setIsEditModalOpen(false);
        setSelectedHabit(null);
        setEditTitle('');
        setEditCategory('');
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedHabit) return;
    
    try {
      const response = await fetch(`/api/habits/${selectedHabit.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setHabits(prev => prev.filter(h => h.id !== selectedHabit.id));
        setIsEditModalOpen(false);
        setSelectedHabit(null);
        setEditTitle('');
        setEditCategory('');
        setIsConfirmingDelete(false);
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 lg:pb-7 sticky top-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10 pt-[72px] lg:pt-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xs font-normal text-white/70">Checklist de Hábitos</CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-sm font-normal">Novo Hábito</DialogTitle>
                </DialogHeader>
                <form onSubmit={addHabit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Nome do hábito</Label>
                    <Input
                      id="title"
                      value={newHabit.title}
                      onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                      placeholder="Ex: Meditar"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={newHabit.category}
                      onValueChange={(value) => setNewHabit({ ...newHabit, category: value })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id} className="text-xs">
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-xs border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Adicionando..." : "Adicionar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 lg:h-9 lg:w-9"
              onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-xs lg:text-sm font-light">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 lg:h-9 lg:w-9"
              onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8">
          {/* Tabela de hábitos */}
          <div className="relative overflow-x-auto -mx-4 lg:mx-0" ref={tableRef}>
            {isLoading ? (
              <div className="text-center py-8">
                <span className="text-xs text-muted-foreground">Carregando...</span>
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-xs text-muted-foreground">Nenhum hábito cadastrado</span>
              </div>
            ) : (
              <div className="relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-3 lg:p-4 font-normal text-muted-foreground w-48 lg:w-64 sticky left-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10 text-xs">
                        Hábito
                      </th>
                      {days.map(day => {
                        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        return (
                          <th 
                            key={day.toString()} 
                            data-today={isToday}
                            ref={isToday ? todayColumnRef : null}
                            className={cn(
                              "p-1 lg:p-2 font-light text-center min-w-[36px] lg:min-w-[40px]",
                              day.getMonth() !== currentDate.getMonth() && "text-muted-foreground/50",
                              isToday && "text-turquoise",
                              isToday && isTodayColumnSticky && "sticky-today left-[192px]"
                            )}
                          >
                            <div className="flex flex-col items-center">
                              <span className={cn(
                                "text-[10px] text-muted-foreground",
                                isToday && "text-turquoise"
                              )}>
                                {format(day, 'EEE', { locale: ptBR })}
                              </span>
                              <span className={cn(
                                "text-xs",
                                isToday && "text-turquoise"
                              )}>
                                {format(day, 'd')}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map(habit => (
                      <tr key={habit.id} className="border-t border-border/50 group">
                        <td className="p-3 lg:p-4 sticky left-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                setSelectedHabit(habit);
                                setEditTitle(habit.title);
                                setEditCategory(habit.category);
                                setIsEditModalOpen(true);
                              }}
                              className="flex items-center gap-2 hover:text-turquoise transition-colors"
                            >
                              <span className="font-light text-xs">{habit.title}</span>
                              <span className="hidden lg:inline-block text-[10px] text-muted-foreground">
                                {categories.find(c => c.id === habit.category)?.name}
                              </span>
                            </button>
                          </div>
                        </td>
                        {days.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const progress = habit.progress.find(p => p.date === dateStr);
                          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                          
                          return (
                            <td 
                              key={dateStr} 
                              ref={isToday ? todayColumnRef : null}
                              className={cn(
                                "p-1 lg:p-2 text-center",
                                isToday && "text-turquoise",
                                isToday && isTodayColumnSticky && "sticky-today left-[192px]"
                              )}
                            >
                              <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "w-7 h-7 lg:w-8 lg:h-8 rounded-full",
                                  day.getMonth() !== currentDate.getMonth() && "opacity-50",
                                  progress?.isChecked 
                                    ? "bg-turquoise border-turquoise text-background hover:bg-turquoise/90" 
                                    : "hover:border-turquoise/50",
                                  isToday && !progress?.isChecked && "border-turquoise/50"
                                )}
                                onClick={() => toggleHabit(habit.id, dateStr)}
                              >
                                {progress?.isChecked && <CheckIcon className="h-3 w-3 lg:h-4 lg:w-4" />}
                              </Button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add the Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setSelectedHabit(null);
          setEditTitle('');
          setEditCategory('');
          setIsConfirmingDelete(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm font-normal">
              {isConfirmingDelete ? 'Confirmar exclusão' : 'Editar hábito'}
            </DialogTitle>
          </DialogHeader>
          
          {isConfirmingDelete ? (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir este hábito? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDeleteConfirm}
                  className="text-xs hover:text-white/90"
                >
                  Excluir
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEditHabit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Nome do hábito</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ex: Meditar"
                  className="text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select
                  value={editCategory}
                  onValueChange={setEditCategory}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id} className="text-xs">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-xs text-muted-foreground hover:text-white transition-colors"
                >
                  Excluir hábito
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="text-xs border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                    disabled={!editTitle.trim()}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 