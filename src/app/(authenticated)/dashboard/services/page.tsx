'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PlusIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/outline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ServiceModal from '@/components/services/ServiceModal';
import { Service } from '@/types/service';
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);

  useEffect(() => {
    if (status !== 'loading') {
      fetchServices();
    }
  }, [status]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.map((service: any) => ({
          ...service,
          description: service.description || undefined,
          category: service.category || undefined
        })));
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchServices();
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(
        selectedService 
          ? `/api/services/${selectedService.id}`
          : '/api/services',
        {
          method: selectedService ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        await fetchServices();
        setIsModalOpen(false);
        setSelectedService(undefined);
      }
    } catch (error) {
      console.error('Error submitting service:', error);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Serviços</h2>
              <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">
                Gerencie os serviços oferecidos em sua clínica
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedService(undefined);
                setIsModalOpen(true);
              }}
              className="w-full md:w-auto mt-2 md:mt-0 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </div>

          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center text-gray-400">Carregando serviços...</div>
            ) : services.length === 0 ? (
              <div className="text-center">
                <p className="mt-1 text-sm text-gray-400">
                  Nenhum serviço cadastrado ainda. Comece adicionando seu primeiro serviço.
                </p>
              </div>
            ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-gray-500">{service.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {service.category || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(service.price)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              service.isActive
                                ? "bg-green-50 text-green-600 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            )}
                          >
                            {service.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-gray-100"
                            onClick={() => handleToggleActive(service.id, service.isActive)}
                          >
                              {service.isActive ? (
                                <XCircleIcon className="h-4 w-4 text-gray-500" />
                              ) : (
                                <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-gray-100"
                            onClick={() => handleEdit(service)}
                            >
                              <PencilIcon className="h-4 w-4 text-gray-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedService(undefined);
        }}
        onSubmit={handleSubmit}
        service={selectedService}
      />
    </div>
  );
} 