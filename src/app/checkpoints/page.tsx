'use client';

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { format, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DayProgress {
  id: number;
  date: string;
  isCompleted: boolean;
}

export default function CheckpointDaysPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1));
  const [progress, setProgress] = useState<DayProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const months = Array.from({ length: 12 }, (_, i) => new Date(2025, i, 1));

  const loadCheckpoints = useCallback(async () => {
    try {
      setIsLoading(true);
      const month = format(currentDate, 'yyyy-MM');
      const response = await fetch(`/api/checkpoints?month=${month}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProgress(data);
      }
    } catch (error) {
      console.error('Error loading checkpoints:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadCheckpoints();
  }, [loadCheckpoints]);

  const toggleDay = async (date: string) => {
    try {
      const response = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });

      if (response.ok) {
        const updatedCheckpoint = await response.json();
        setProgress(prev => {
          const existing = prev.find(p => p.date === date);
          if (existing) {
            return prev.map(p => p.date === date ? updatedCheckpoint : p);
          }
          return [...prev, updatedCheckpoint];
        });
      }
    } catch (error) {
      console.error('Error toggling checkpoint:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Calculate total days in year and completed days
  const totalDaysInYear = months.reduce((acc, month) => acc + getDaysInMonth(month), 0);
  const totalCompletedDays = progress.filter(p => p.isCompleted).length;
  const yearProgress = (totalCompletedDays / totalDaysInYear) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-col space-y-4 pb-4 lg:pb-7 sticky top-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10 pt-[72px] lg:pt-4">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-normal text-white/70">Checkpoints 2025</CardTitle>
            <div className="flex items-center gap-2 lg:gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 lg:h-9 lg:w-9"
                onClick={() => navigateMonth('prev')}
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
                onClick={() => navigateMonth('next')}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] lg:text-xs text-muted-foreground">
              <span>Progresso anual</span>
              <span>{totalCompletedDays} de {totalDaysInYear} dias ({yearProgress.toFixed(1)}%)</span>
            </div>
            <Progress value={yearProgress} className="h-1.5" />
          </div>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8 px-2 lg:px-6">
          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-xs text-muted-foreground">Carregando...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {months.map((month) => {
                const daysInMonth = getDaysInMonth(month);
                const monthProgress = progress.filter(p => p.date.startsWith(format(month, 'yyyy-MM')));
                const completedDays = monthProgress.filter(p => p.isCompleted).length;
                
                return (
                  <Card key={month.toString()} className={cn(
                    "p-3 lg:p-4 border border-white/10",
                    month.getMonth() === currentDate.getMonth() && "border-turquoise"
                  )}>
                    <CardHeader className="p-0 pb-3 lg:pb-4">
                      <CardTitle className="text-sm font-normal">
                        {format(month, 'MMMM', { locale: ptBR })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xl lg:text-2xl font-light">
                          {daysInMonth}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] lg:text-xs text-muted-foreground">
                            dias
                          </span>
                          <span className="text-[10px] lg:text-xs text-turquoise">
                            {completedDays} completos
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 lg:mt-4 grid grid-cols-7 gap-[2px] lg:gap-1">
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const checkpoint = progress.find(p => p.date === dateStr);

                          return (
                            <Button
                              key={i}
                              variant="outline"
                              size="icon"
                              onClick={() => toggleDay(dateStr)}
                              className={cn(
                                "aspect-square p-0 h-auto flex items-center justify-center text-[10px] lg:text-xs border-white/10 rounded-sm",
                                checkpoint?.isCompleted && "bg-turquoise border-turquoise text-background hover:bg-turquoise/90",
                                !checkpoint?.isCompleted && "hover:border-turquoise/50"
                              )}
                            >
                              <div className="flex flex-col items-center">
                                <span>{i + 1}</span>
                                {checkpoint?.isCompleted && (
                                  <CheckIcon className="h-2 w-2 lg:h-3 lg:w-3 mt-0.5" />
                                )}
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 