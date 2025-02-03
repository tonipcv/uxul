'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, getDaysInMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, CheckIcon, TrashIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Pomodoro from '@/components/Pomodoro';

interface Task {
  id: string;
  userId: string;
  title: string;
  dueDate: string | Date;
  isCompleted: boolean;
  importance: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface DayStars {
  [key: string]: number;
}

const importanceEmojis = {
  1: '||||',
  2: '|||',
  3: '||',
  4: '|',
};

const importanceLabels = {
  1: 'Urgent and Important',
  2: 'Important not Urgent',
  3: 'Urgent not Important',
  4: 'Neither Urgent nor Important',
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayStars, setDayStars] = useState<DayStars>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    importance: 1
  });

  // Calcular progresso da semana
  const calculateWeekProgress = () => {
    const startDate = startOfWeek(new Date());
    const endDate = endOfWeek(new Date());
    
    const weekTasks = tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= startDate && taskDate <= endDate;
    });

    if (weekTasks.length === 0) return 0;

    const completedTasks = weekTasks.filter(task => task.isCompleted).length;
    return Math.round((completedTasks / weekTasks.length) * 100);
  };

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const [tasksResponse, starsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/pomodoro-stars')
      ]);
      
      const [tasksData, starsData] = await Promise.all([
        tasksResponse.json(),
        starsResponse.json()
      ]);

      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      }
      
      setDayStars(starsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Função para adicionar estrela ao dia
  const addStarToDay = async (date: string) => {
    try {
      const response = await fetch('/api/pomodoro-stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });

      if (!response.ok) {
        throw new Error('Failed to save pomodoro star');
      }

      const { totalStars } = await response.json();
      
      setDayStars(prev => ({
        ...prev,
        [date]: totalStars
      }));
    } catch (error) {
      console.error('Error saving pomodoro star:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      if (editingTask) {
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          return;
        }

        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? updatedTask : task
        ));
      } else {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          return;
        }

        const task = await response.json();
        setTasks(prev => [...prev, task]);
      }

      setNewTask({
        title: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        importance: 1
      });
      setEditingTask(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    const taskDate = new Date(task.dueDate);
    setSelectedMonth(taskDate);
    setNewTask({
      title: task.title,
      dueDate: format(taskDate, 'yyyy-MM-dd'),
      importance: task.importance
    });
    setIsModalOpen(true);
  };

  const toggleTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
        ));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Ordenar tarefas por importância e data
  const sortedTasks = [...tasks].sort((a, b) => {
    // Primeiro, ordenar por status de conclusão
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    // Depois, ordenar por importância
    if (a.importance !== b.importance) {
      return a.importance - b.importance;
    }
    // Por fim, ordenar por data
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 pb-2 lg:pb-4 sticky top-0 bg-background z-20 pt-[72px] lg:pt-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xs font-normal text-white/70">Eisenhower Matrix</CardTitle>
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              if (!open) {
                setEditingTask(null);
                setSelectedMonth(new Date());
                setNewTask({
                  title: '',
                  dueDate: format(new Date(), 'yyyy-MM-dd'),
                  importance: 1
                });
              }
              setIsModalOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-base font-medium">
                    {editingTask ? 'Edit Task' : 'New Task'}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {editingTask ? 'Edit your task details' : 'Add a new task to your Eisenhower matrix'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm">Task title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Ex: Prepare presentation"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-sm">Due date</Label>
                    <div className="grid grid-cols-7 gap-[2px] lg:gap-1 border border-white/10 rounded-md p-2">
                      {Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => {
                        const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1);
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isSelected = dateStr === newTask.dueDate;

                        return (
                          <Button
                            key={i}
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1);
                              setNewTask(prev => ({
                                ...prev,
                                dueDate: format(newDate, 'yyyy-MM-dd')
                              }));
                            }}
                            className={cn(
                              "aspect-square p-0 h-auto flex items-center justify-center text-[10px] lg:text-xs border-white/10 rounded-sm",
                              isSelected && "bg-turquoise border-turquoise text-background hover:bg-turquoise/90",
                              !isSelected && "hover:border-turquoise/50 bg-transparent"
                            )}
                          >
                            <span>{i + 1}</span>
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const newDate = new Date(selectedMonth);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setSelectedMonth(newDate);
                          // Se a data selecionada não estiver no mês atual, atualizar para o primeiro dia do novo mês
                          const currentSelectedDate = new Date(newTask.dueDate);
                          if (currentSelectedDate.getMonth() !== newDate.getMonth()) {
                            setNewTask(prev => ({
                              ...prev,
                              dueDate: format(new Date(newDate.getFullYear(), newDate.getMonth(), 1), 'yyyy-MM-dd')
                            }));
                          }
                        }}
                      >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Previous Month
                      </Button>
                      <span className="text-xs text-white/70">
                        {format(selectedMonth, 'MMMM yyyy', { locale: enUS })}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const newDate = new Date(selectedMonth);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setSelectedMonth(newDate);
                          // Se a data selecionada não estiver no mês atual, atualizar para o primeiro dia do novo mês
                          const currentSelectedDate = new Date(newTask.dueDate);
                          if (currentSelectedDate.getMonth() !== newDate.getMonth()) {
                            setNewTask(prev => ({
                              ...prev,
                              dueDate: format(new Date(newDate.getFullYear(), newDate.getMonth(), 1), 'yyyy-MM-dd')
                            }));
                          }
                        }}
                      >
                        Next Month
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm">Quadrant</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {[1, 2, 3, 4].map((level) => (
                        <Button
                          key={level}
                          type="button"
                          variant={newTask.importance === level ? 'default' : 'outline'}
                          className={cn(
                            "text-sm justify-start h-auto py-3 w-full",
                            newTask.importance === level 
                              ? "border-turquoise bg-turquoise/10 hover:bg-turquoise/20 text-white" 
                              : "text-muted-foreground hover:text-white"
                          )}
                          onClick={() => setNewTask({ ...newTask, importance: level })}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base font-mono text-turquoise">
                              {importanceEmojis[level as keyof typeof importanceEmojis]}
                            </span>
                            <span className="text-sm leading-tight">
                              {importanceLabels[level as keyof typeof importanceLabels]}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-sm border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                  >
                    {editingTask ? 'Save Changes' : 'Add Task'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                  onClick={() => setSelectedWeek(prev => {
                    const newDate = new Date(prev);
                    newDate.setDate(newDate.getDate() - 7);
                    return newDate;
                  })}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-transparent hover:bg-white/5 h-8 px-3"
                  onClick={() => setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                >
                  <span className="text-xs">Today</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                  onClick={() => setSelectedWeek(prev => {
                    const newDate = new Date(prev);
                    newDate.setDate(newDate.getDate() + 7);
                    return newDate;
                  })}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-white/70 flex items-center gap-2">
                <span>Weekly progress</span>
                <span className="text-turquoise font-medium">
                  {calculateWeekProgress()}%
                </span>
              </div>
            </div>
            <Pomodoro onComplete={() => addStarToDay(format(new Date(), 'yyyy-MM-dd'))} />
          </div>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8 px-0 lg:px-6">
          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-xs text-muted-foreground">No tasks registered</span>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="inline-flex gap-4 lg:gap-6 px-4 lg:px-0 min-w-full">
                {weekDays.map((day, index) => {
                  const currentDate = new Date(selectedWeek);
                  currentDate.setDate(currentDate.getDate() + index);
                  const dateKey = format(currentDate, 'yyyy-MM-dd');
                  const formattedDate = format(currentDate, 'MMM d');
                  const dayTasks = sortedTasks.filter(task => 
                    format(new Date(task.dueDate), 'yyyy-MM-dd') === dateKey
                  );
                  const stars = dayStars[dateKey] || 0;
                  const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;

                  return (
                    <div 
                      key={day} 
                      className={cn(
                        "flex-1 min-w-[calc(100vw-2rem)] lg:min-w-[300px] lg:max-w-[350px] first:pl-0 last:pr-6",
                        isToday && "lg:min-w-[350px]"
                      )}
                    >
                      <div className={cn(
                        "bg-background border-b border-white/10 mb-3",
                        isToday && "bg-turquoise/5"
                      )}>
                        <div className="flex items-center justify-between px-2 py-2">
                          <div className="flex items-center gap-2">
                            <h2 className={cn(
                              "text-sm font-medium capitalize",
                              isToday ? "text-turquoise" : "text-white/90"
                            )}>
                              {day}
                            </h2>
                            <div className="flex items-center gap-0.5">
                              {stars > 0 && (
                                <>
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs text-yellow-400">{stars}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={cn(
                            "text-xs",
                            isToday ? "text-turquoise" : "text-white/50"
                          )}>
                            {formattedDate}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {dayTasks.map((task) => (
                          <Card key={task.id} className="border border-white/10 group">
                            <CardContent 
                              className="p-3 lg:p-4 cursor-pointer"
                              onDoubleClick={() => handleEditTask(task)}
                            >
                              <div className="flex items-start justify-between gap-3 lg:gap-4">
                                <div className="flex items-start gap-2 lg:gap-3 flex-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                      "h-5 w-5 lg:h-6 lg:w-6 rounded-full shrink-0",
                                      task.isCompleted 
                                        ? "bg-turquoise border-turquoise text-background hover:bg-turquoise/90" 
                                        : "hover:border-turquoise/50"
                                    )}
                                    onClick={() => toggleTask(task.id)}
                                  >
                                    {task.isCompleted && <CheckIcon className="h-3 w-3" />}
                                  </Button>
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={cn(
                                        "text-sm font-light break-words flex-1",
                                        task.isCompleted && "line-through text-white/50"
                                      )}>
                                        {task.title}
                                      </p>
                                      <span className="text-base font-mono text-turquoise/90 shrink-0">
                                        {importanceEmojis[task.importance as keyof typeof importanceEmojis]}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
                                  onClick={() => deleteTask(task.id)}
                                >
                                  <TrashIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
