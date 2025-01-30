'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

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
    setNewTask({
      title: task.title,
      dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd'),
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

  // Agrupar tarefas por data
  const groupedTasks = sortedTasks.reduce((groups, task) => {
    const date = new Date(task.dueDate);
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(task);
    return groups;
  }, {} as Record<string, Task[]>);

  // Ordenar as datas
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 pb-2 lg:pb-4 sticky top-0 bg-background z-20 pt-[72px] lg:pt-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xs font-normal text-white/70">Eisenhower Matrix</CardTitle>
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              if (!open) {
                setEditingTask(null);
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
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="text-sm"
                    />
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
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <Pomodoro />
            <div className="text-xs text-white/70 flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
              <span>Weekly progress</span>
              <span className="text-turquoise font-medium">
                {calculateWeekProgress()}%
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8 px-4 lg:px-6">
          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-xs text-muted-foreground">No tasks registered</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:flex lg:overflow-x-auto lg:gap-6 gap-8">
              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="lg:min-w-[350px] lg:max-w-[350px] lg:first:pl-0 lg:last:pr-6">
                  <div className="bg-background border-b border-white/10 mb-3">
                    <div className="flex items-center justify-between px-2 py-2">
                      <h2 className="text-sm font-medium text-white/90 capitalize">
                        {format(new Date(dateKey), "EEEE", { locale: enUS })}
                      </h2>
                      <span className="text-xs text-white/50">
                        {format(new Date(dateKey), "MMM d", { locale: enUS })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {groupedTasks[dateKey].map((task) => (
                      <Card key={task.id} className="border border-white/10 group">
                        <CardContent 
                          className="p-4 cursor-pointer"
                          onDoubleClick={() => handleEditTask(task)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "h-6 w-6 rounded-full shrink-0",
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
                              className="h-6 w-6 text-muted-foreground hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
                              onClick={() => deleteTask(task.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
