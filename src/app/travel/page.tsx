'use client';
import { useState } from "react";
import { PlusIcon, TrashIcon, MapPinIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Activity {
  id: number;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  notes: string;
}

interface DayPlan {
  id: number;
  date: string;
  activities: Activity[];
  isExpanded: boolean;
}

interface Trip {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  dayPlans: DayPlan[];
  isExpanded: boolean;
}

export default function TravelPlanner() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [newTrip, setNewTrip] = useState({
    title: '',
    startDate: '',
    endDate: '',
    destination: ''
  });
  const [newActivity, setNewActivity] = useState({
    title: '',
    location: '',
    startTime: '09:00',
    endTime: '10:00',
    notes: ''
  });
  const [selectedTripDay, setSelectedTripDay] = useState<{tripId: number, dayId: number} | null>(null);

  const addTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.title.trim() || !newTrip.startDate || !newTrip.endDate || !newTrip.destination) return;

    const start = new Date(newTrip.startDate);
    const end = new Date(newTrip.endDate);
    const dayPlans: DayPlan[] = [];

    // Criar um plano para cada dia da viagem
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dayPlans.push({
        id: Date.now() + dayPlans.length,
        date: date.toISOString().split('T')[0],
        activities: [],
        isExpanded: false
      });
    }

    const trip: Trip = {
      id: Date.now(),
      ...newTrip,
      dayPlans,
      isExpanded: true
    };

    setTrips([...trips, trip]);
    setNewTrip({
      title: '',
      startDate: '',
      endDate: '',
      destination: ''
    });
  };

  const addActivity = (tripId: number, dayId: number) => {
    if (!newActivity.title.trim()) return;

    setTrips(trips.map(trip => {
      if (trip.id === tripId) {
        return {
          ...trip,
          dayPlans: trip.dayPlans.map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                activities: [...day.activities, { id: Date.now(), ...newActivity }]
              };
            }
            return day;
          })
        };
      }
      return trip;
    }));

    setNewActivity({
      title: '',
      location: '',
      startTime: '09:00',
      endTime: '10:00',
      notes: ''
    });
    setSelectedTripDay(null);
  };

  const toggleTripExpand = (tripId: number) => {
    setTrips(trips.map(trip => 
      trip.id === tripId ? { ...trip, isExpanded: !trip.isExpanded } : trip
    ));
  };

  const toggleDayExpand = (tripId: number, dayId: number) => {
    setTrips(trips.map(trip => {
      if (trip.id === tripId) {
        return {
          ...trip,
          dayPlans: trip.dayPlans.map(day => 
            day.id === dayId ? { ...day, isExpanded: !day.isExpanded } : day
          )
        };
      }
      return trip;
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="h-full px-6 py-8">
        <div className="bg-[#111111] rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 border-b border-gray-800">
            <h1 className="text-3xl font-bold text-white">Travel Planner</h1>
            <p className="mt-2 text-cyan-100">Planeje suas viagens e itinerários</p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-6 border-b border-gray-800">
            <form onSubmit={addTrip} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Nome da Viagem
                </label>
                <input
                  type="text"
                  value={newTrip.title}
                  onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                  placeholder="Ex: Férias em Paris"
                  className="w-full h-12 rounded-lg bg-gray-800 border-gray-700 text-white 
                    placeholder-gray-400 text-lg px-4
                    shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Destino
                </label>
                <input
                  type="text"
                  value={newTrip.destination}
                  onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                  placeholder="Ex: Paris, França"
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
                  value={newTrip.startDate}
                  onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
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
                  value={newTrip.endDate}
                  onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
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

          {/* Trips List */}
          <div className="px-8 py-6">
            <div className="space-y-6">
              {trips.map(trip => (
                <div key={trip.id} className="bg-[#1a1a1a] rounded-lg border border-gray-800">
                  {/* Trip Header */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTripExpand(trip.id)}
                        className="text-gray-400 hover:text-cyan-400 transition-colors"
                      >
                        <PlusIcon className={`w-5 h-5 transform transition-transform ${trip.isExpanded ? 'rotate-45' : ''}`} />
                      </button>
                      <div>
                        <h3 className="text-lg font-medium text-white">{trip.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{trip.destination}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {new Date(trip.startDate).toLocaleDateString('pt-BR')} - {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Day Plans */}
                  {trip.isExpanded && (
                    <div className="p-4 space-y-4">
                      {trip.dayPlans.map(day => (
                        <div key={day.id} className="bg-gray-800 rounded-lg">
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => toggleDayExpand(trip.id, day.id)}
                                className="text-gray-400 hover:text-cyan-400 transition-colors"
                              >
                                <PlusIcon className={`w-5 h-5 transform transition-transform ${day.isExpanded ? 'rotate-45' : ''}`} />
                              </button>
                              <h4 className="text-white font-medium">
                                {formatDate(day.date)}
                              </h4>
                            </div>
                            <button
                              onClick={() => setSelectedTripDay({ tripId: trip.id, dayId: day.id })}
                              className="px-4 py-2 bg-gray-700 text-cyan-400 rounded-lg 
                                hover:bg-gray-600 transition-colors text-sm"
                            >
                              + Atividade
                            </button>
                          </div>

                          {day.isExpanded && (
                            <div className="px-4 pb-4">
                              {selectedTripDay?.tripId === trip.id && selectedTripDay?.dayId === day.id && (
                                <div className="mb-4 p-4 bg-gray-700 rounded-lg space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <input
                                      type="text"
                                      value={newActivity.title}
                                      onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                      placeholder="Título da Atividade"
                                      className="h-10 rounded-lg bg-gray-600 border-gray-500 text-white 
                                        placeholder-gray-400 px-3"
                                    />
                                    <input
                                      type="text"
                                      value={newActivity.location}
                                      onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                                      placeholder="Localização"
                                      className="h-10 rounded-lg bg-gray-600 border-gray-500 text-white 
                                        placeholder-gray-400 px-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex gap-4">
                                      <input
                                        type="time"
                                        value={newActivity.startTime}
                                        onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
                                        className="h-10 rounded-lg bg-gray-600 border-gray-500 text-white px-3"
                                      />
                                      <input
                                        type="time"
                                        value={newActivity.endTime}
                                        onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
                                        className="h-10 rounded-lg bg-gray-600 border-gray-500 text-white px-3"
                                      />
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => addActivity(trip.id, day.id)}
                                        className="px-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                                      >
                                        Adicionar
                                      </button>
                                    </div>
                                  </div>
                                  <textarea
                                    value={newActivity.notes}
                                    onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                                    placeholder="Notas e observações..."
                                    className="w-full h-20 rounded-lg bg-gray-600 border-gray-500 text-white 
                                      placeholder-gray-400 px-3 py-2"
                                  />
                                </div>
                              )}

                              <div className="space-y-3">
                                {day.activities.map(activity => (
                                  <div key={activity.id} className="bg-gray-700 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h5 className="font-medium text-white">{activity.title}</h5>
                                        <div className="mt-1 space-y-1 text-sm">
                                          <div className="flex items-center gap-2 text-gray-300">
                                            <MapPinIcon className="w-4 h-4" />
                                            <span>{activity.location}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-gray-300">
                                            <ClockIcon className="w-4 h-4" />
                                            <span>{activity.startTime} - {activity.endTime}</span>
                                          </div>
                                          {activity.notes && (
                                            <p className="text-gray-400 mt-2">{activity.notes}</p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setTrips(trips.map(t => {
                                            if (t.id === trip.id) {
                                              return {
                                                ...t,
                                                dayPlans: t.dayPlans.map(d => {
                                                  if (d.id === day.id) {
                                                    return {
                                                      ...d,
                                                      activities: d.activities.filter(a => a.id !== activity.id)
                                                    };
                                                  }
                                                  return d;
                                                })
                                              };
                                            }
                                            return t;
                                          }));
                                        }}
                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                      >
                                        <TrashIcon className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Empty State */}
              {trips.length === 0 && (
                <div className="text-center py-12 px-4">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-200">Nenhuma viagem planejada</h3>
                  <p className="mt-1 text-sm text-gray-400">Comece adicionando uma nova viagem.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 