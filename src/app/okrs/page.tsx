'use client';
import { useState } from "react";
import { PlusIcon, TrashIcon, ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface KeyResult {
  id: number;
  title: string;
  target: number;
  current: number;
  unit: string;
}

interface Objective {
  id: number;
  title: string;
  keyResults: KeyResult[];
  isExpanded: boolean;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
}

export default function OKRs() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [newObjective, setNewObjective] = useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [newKR, setNewKR] = useState({
    title: '',
    target: 100,
    unit: '%'
  });
  const [selectedObjective, setSelectedObjective] = useState<number | null>(null);

  const getStatusColor = (status: Objective['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-900 text-gray-300';
      case 'in_progress':
        return 'bg-blue-900 text-blue-300';
      case 'completed':
        return 'bg-green-900 text-green-300';
      case 'expired':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const getStatusText = (status: Objective['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Progresso';
      case 'completed':
        return 'Concluído';
      case 'expired':
        return 'Expirado';
      default:
        return 'Pendente';
    }
  };

  const calculateStatus = (objective: Objective): Objective['status'] => {
    const now = new Date();
    const start = new Date(objective.startDate);
    const end = new Date(objective.endDate);
    const progress = calculateProgress(objective.keyResults);

    if (progress >= 100) return 'completed';
    if (now > end) return 'expired';
    if (now >= start && now <= end) return 'in_progress';
    return 'pending';
  };

  const addObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjective.title.trim() || !newObjective.endDate) return;
    
    const objective: Objective = {
      id: Date.now(),
      title: newObjective.title,
      keyResults: [],
      isExpanded: true,
      startDate: newObjective.startDate,
      endDate: newObjective.endDate,
      status: 'pending'
    };

    setObjectives([...objectives, objective]);
    setNewObjective({
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
  };

  const addKeyResult = (objectiveId: number) => {
    if (!newKR.title.trim()) return;

    setObjectives(objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          keyResults: [
            ...obj.keyResults,
            {
              id: Date.now(),
              title: newKR.title,
              target: newKR.target,
              current: 0,
              unit: newKR.unit
            }
          ]
        };
      }
      return obj;
    }));

    setNewKR({ title: '', target: 100, unit: '%' });
    setSelectedObjective(null);
  };

  const updateProgress = (objectiveId: number, krId: number, value: number) => {
    setObjectives(objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          keyResults: obj.keyResults.map(kr => {
            if (kr.id === krId) {
              return { ...kr, current: value };
            }
            return kr;
          })
        };
      }
      return obj;
    }));
  };

  const toggleExpand = (objectiveId: number) => {
    setObjectives(objectives.map(obj => {
      if (obj.id === objectiveId) {
        return { ...obj, isExpanded: !obj.isExpanded };
      }
      return obj;
    }));
  };

  const calculateProgress = (keyResults: KeyResult[]) => {
    if (keyResults.length === 0) return 0;
    const progress = keyResults.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / keyResults.length;
    return Math.round(progress);
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="h-full px-6 py-8">
        <div className="bg-[#111111] rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 border-b border-gray-800">
            <h1 className="text-3xl font-bold text-white">OKRs</h1>
            <p className="mt-2 text-cyan-100">Defina seus Objetivos e Resultados-Chave</p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-6 border-b border-gray-800">
            <form onSubmit={addObjective} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Novo Objetivo
                </label>
                <input
                  type="text"
                  value={newObjective.title}
                  onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                  placeholder="Ex: Aumentar engajamento dos usuários"
                  className="w-full h-12 rounded-lg bg-gray-800 border-gray-700 text-white 
                    placeholder-gray-400 text-lg px-4
                    shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={newObjective.startDate}
                  onChange={(e) => setNewObjective({ ...newObjective, startDate: e.target.value })}
                  className="w-full h-12 rounded-lg bg-gray-800 border-gray-700 text-white px-4
                    shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={newObjective.endDate}
                  onChange={(e) => setNewObjective({ ...newObjective, endDate: e.target.value })}
                  className="w-full h-12 rounded-lg bg-gray-800 border-gray-700 text-white px-4
                    shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
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

          {/* OKRs List */}
          <div className="px-8 py-6">
            <div className="space-y-6">
              {objectives.map(objective => {
                const status = calculateStatus(objective);
                return (
                  <div key={objective.id} className="bg-[#1a1a1a] rounded-lg border border-gray-800">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => toggleExpand(objective.id)}
                          className="text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                          <ChevronDownIcon className={`w-5 h-5 transform transition-transform ${objective.isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-medium text-white">{objective.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {getStatusText(status)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex-1 h-2 bg-gray-700 rounded-full">
                                <div
                                  className="h-2 bg-cyan-600 rounded-full transition-all duration-300"
                                  style={{ width: `${calculateProgress(objective.keyResults)}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-gray-400">
                              {calculateProgress(objective.keyResults)}%
                            </span>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <CalendarIcon className="w-4 h-4" />
                              <span>
                                {new Date(objective.startDate).toLocaleDateString('pt-BR')} - {new Date(objective.endDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedObjective(objective.id)}
                        className="ml-4 px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg 
                          hover:bg-gray-700 transition-colors text-sm"
                      >
                        + Resultado-Chave
                      </button>
                    </div>

                    {objective.isExpanded && (
                      <div className="px-4 pb-4">
                        {selectedObjective === objective.id && (
                          <div className="mb-4 p-4 bg-gray-800 rounded-lg flex gap-4">
                            <input
                              type="text"
                              value={newKR.title}
                              onChange={(e) => setNewKR({ ...newKR, title: e.target.value })}
                              placeholder="Título do Resultado-Chave"
                              className="flex-1 h-10 rounded-lg bg-gray-700 border-gray-600 text-white 
                                placeholder-gray-400 px-3"
                            />
                            <input
                              type="number"
                              value={newKR.target}
                              onChange={(e) => setNewKR({ ...newKR, target: Number(e.target.value) })}
                              className="w-24 h-10 rounded-lg bg-gray-700 border-gray-600 text-white px-3"
                            />
                            <select
                              value={newKR.unit}
                              onChange={(e) => setNewKR({ ...newKR, unit: e.target.value })}
                              className="w-24 h-10 rounded-lg bg-gray-700 border-gray-600 text-white px-3"
                            >
                              <option value="%">%</option>
                              <option value="un">un</option>
                              <option value="k">k</option>
                            </select>
                            <button
                              onClick={() => addKeyResult(objective.id)}
                              className="px-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                            >
                              Adicionar
                            </button>
                          </div>
                        )}

                        <div className="space-y-3">
                          {objective.keyResults.map(kr => (
                            <div key={kr.id} className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-gray-200">{kr.title}</span>
                                  <span className="text-sm text-gray-400">
                                    {kr.current}/{kr.target}{kr.unit}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max={kr.target}
                                    value={kr.current}
                                    onChange={(e) => updateProgress(objective.id, kr.id, Number(e.target.value))}
                                    className="flex-1 h-2 bg-gray-700 rounded-full appearance-none 
                                      [&::-webkit-slider-thumb]:appearance-none 
                                      [&::-webkit-slider-thumb]:w-4 
                                      [&::-webkit-slider-thumb]:h-4 
                                      [&::-webkit-slider-thumb]:rounded-full 
                                      [&::-webkit-slider-thumb]:bg-cyan-500
                                      [&::-webkit-slider-thumb]:cursor-pointer"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setObjectives(objectives.map(obj => {
                                    if (obj.id === objective.id) {
                                      return {
                                        ...obj,
                                        keyResults: obj.keyResults.filter(k => k.id !== kr.id)
                                      };
                                    }
                                    return obj;
                                  }));
                                }}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty State */}
              {objectives.length === 0 && (
                <div className="text-center py-12 px-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-200">Nenhum OKR definido</h3>
                  <p className="mt-1 text-sm text-gray-400">Comece adicionando um novo objetivo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 