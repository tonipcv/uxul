'use client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  habits: Array<{
    id: number;
    name: string;
    completedDates: Set<string>;
  }>;
}

export default function Calendar({ onDateSelect, selectedDate, habits }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    // Adicionar dias do mês anterior
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Adicionar dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Adicionar dias do próximo mês
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const days = getDaysInMonth(currentDate);

  const getCompletionCount = (dateStr: string) => {
    return habits.reduce((count, habit) => 
      habit.completedDates.has(dateStr) ? count + 1 : count, 0
    );
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
      {/* Cabeçalho do Calendário */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="p-4">
        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do Mês */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(({ date, isCurrentMonth }, index) => {
            const dateStr = formatDate(date);
            const completionCount = getCompletionCount(dateStr);
            const isSelected = formatDate(selectedDate) === dateStr;
            
            return (
              <button
                key={index}
                onClick={() => onDateSelect(date)}
                className={`
                  relative aspect-square p-2 rounded-lg flex items-center justify-center text-sm
                  transition-all duration-200
                  ${isCurrentMonth ? 'text-white' : 'text-gray-600'}
                  ${isSelected ? 'bg-cyan-600 text-white' : 'hover:bg-gray-800'}
                  ${isToday(date) ? 'ring-2 ring-cyan-500' : ''}
                `}
              >
                <span>{date.getDate()}</span>
                {completionCount > 0 && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 