'use client';

import { useState } from 'react';
import { Service } from '@/types/service';
import { formatCurrency } from '@/lib/format';

interface ServiceListProps {
  initialServices: Service[];
}

export default function ServiceList({ initialServices }: ServiceListProps) {
  const [services, setServices] = useState(initialServices);

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
        setServices(services.map(service => 
          service.id === serviceId 
            ? { ...service, isActive: !currentStatus }
            : service
        ));
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preço
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {services.map((service) => (
            <tr key={service.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{service.name}</div>
                {service.description && (
                  <div className="text-sm text-gray-500">{service.description}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {service.category || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(service.price)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    service.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {service.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleToggleActive(service.id, service.isActive)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  {service.isActive ? 'Desativar' : 'Ativar'}
                </button>
                <a
                  href={`/dashboard/services/${service.id}/edit`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Editar
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {services.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum serviço cadastrado ainda.
        </div>
      )}
    </div>
  );
} 