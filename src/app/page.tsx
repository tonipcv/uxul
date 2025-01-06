'use client';
import { useState } from "react";
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Calendar from '@/components/Calendar';

interface Habit {
  id: number;
  name: string;
  completedDates: Set<string>;
  category: string;
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [currentDate, setCurrentDate] = useState(new Date());

  const categories = [
    { id: 'personal', name: 'Pessoal', color: 'bg-cyan-900 text-cyan-200' },
    { id: 'health', name: 'Saúde', color: 'bg-teal-900 text-teal-200' },
    { id: 'work', name: 'Trabalho', color: 'bg-sky-900 text-sky-200' },
  ];

  const getDaysForDisplay = (date: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(date);
      currentDay.setDate(currentDay.getDate() + i);
      days.push({
        weekday: currentDay.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        day: currentDay.getDate(),
        month: currentDay.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        full: currentDay.toISOString().split('T')[0],
      });
    }
    return days;
  };

  const days = getDaysForDisplay(currentDate);

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    
    setHabits([
      ...habits,
      {
        id: Date.now(),
        name: newHabitName,
        completedDates: new Set(),
        category: selectedCategory
      }
    ]);
    setNewHabitName('');
  };

  const toggleHabit = (habitId: number, dateStr: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newCompletedDates = new Set(habit.completedDates);
        if (newCompletedDates.has(dateStr)) {
          newCompletedDates.delete(dateStr);
        } else {
          newCompletedDates.add(dateStr);
        }
        return { ...habit, completedDates: newCompletedDates };
      }
      return habit;
    }));
  };

  const deleteHabit = (habitId: number) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '';
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="h-full px-6 py-8">
        <div className="bg-[#111111] rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 border-b border-gray-800">
            <h1 className="text-3xl font-bold text-white">Habit Tracker</h1>
            <p className="mt-2 text-cyan-100">Acompanhe seus hábitos diários</p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-6 border-b border-gray-800">
            <form onSubmit={addHabit} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Novo Hábito
                </label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Ex: Meditar por 10 minutos"
                  className="w-full h-12 rounded-lg bg-gray-800 border-gray-700 text-white 
                    placeholder-gray-400 text-lg px-4
                    shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div className="w-48 sm:w-64">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-12 rounded-lg bg-gray-800 border-gray-700 text-white 
                    text-lg px-4
                    shadow-sm focus:border-violet-500 focus:ring-violet-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 h-12 bg-cyan-600 text-white rounded-lg 
                  text-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 
                  focus:ring-offset-2 focus:ring-offset-[#111111] transition-colors whitespace-nowrap"
              >
                <PlusIcon className="w-5 h-5" />
                Adicionar
              </button>
            </form>
          </div>

          {/* Habits Grid */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="overflow-x-auto">
                <div className="min-w-[1000px] overflow-hidden rounded-lg border border-gray-800">
                  {/* Grid Header */}
                  <div className="grid grid-cols-[1fr_repeat(7,minmax(80px,1fr))_50px] bg-[#1a1a1a] border-b border-gray-800">
                    <div className="p-4 font-medium text-gray-100">Hábito</div>
                    {days.map((date, index) => (
                      <div key={index} className="p-4 text-center">
                        <div className="font-medium text-gray-100 flex items-center justify-center gap-2">
                          <span className="text-cyan-400">{date.weekday}</span>
                          <span className="text-lg">{date.day}</span>
                        </div>
                      </div>
                    ))}
                    <div className="p-4"></div>
                  </div>

                  {/* Habits List */}
                  {habits.map(habit => (
                    <div key={habit.id} 
                      className="grid grid-cols-[1fr_repeat(7,minmax(80px,1fr))_50px] border-b 
                        border-gray-800 hover:bg-[#1a1a1a]/50 transition-colors"
                    >
                      <div className="p-4 flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(habit.category)}`}>
                          {categories.find(cat => cat.id === habit.category)?.name}
                        </span>
                        <span className="font-medium text-gray-100">{habit.name}</span>
                      </div>
                      {days.map((day, dayIndex) => (
                        <div key={dayIndex} className="p-4 flex items-center justify-center">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleHabit(habit.id, day.full)}
                              className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                                habit.completedDates.has(day.full)
                                  ? 'bg-cyan-600 border-cyan-600 shadow-lg scale-105' 
                                  : 'border-gray-700 hover:border-cyan-400'
                              }`}
                            >
                              {habit.completedDates.has(day.full) && (
                                <svg className="w-5 h-5 mx-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div className="text-sm text-gray-400">
                              {day.weekday} {day.day}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="p-4 flex items-center justify-center">
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {habits.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-200">Nenhum hábito ainda</h3>
                      <p className="mt-1 text-sm text-gray-400">Comece adicionando um novo hábito para acompanhar.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Calendário */}
              <div className="lg:sticky lg:top-24">
                <Calendar
                  onDateSelect={(date) => handleDateChange(date)}
                  selectedDate={currentDate}
                  habits={habits}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
