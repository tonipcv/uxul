"use client"

import React, { useState, useEffect } from 'react'
import { Address } from './address-manager'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'

interface LocationMapProps {
  addresses: Address[] | undefined
  address?: string  // Compatibilidade com endereço único
  height?: string
  width?: string
  primaryColor?: string
}

export function LocationMap({ 
  addresses = [],
  address,  // Compatibilidade com versão anterior
  height = '250px',
  width = '100%',
  primaryColor = '#0070df'
}: LocationMapProps) {
  // Se temos apenas o endereço único antigo, convertemos para o formato novo
  const allAddresses = addresses?.length 
    ? addresses 
    : address 
      ? [{ id: 'legacy', name: 'Endereço', address, isDefault: true }] 
      : []

  // Estado para controlar qual endereço está sendo exibido
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Inicializar com o endereço padrão quando carregamos os endereços
  useEffect(() => {
    if (allAddresses.length > 0) {
      // Encontrar o endereço padrão ou usar o primeiro
      const defaultAddress = allAddresses.find(addr => addr.isDefault) || allAddresses[0]
      setSelectedAddress(defaultAddress)
    } else {
      setSelectedAddress(null)
    }
  }, [allAddresses])

  // Se não houver endereço selecionado, mostramos mensagem
  if (!selectedAddress) {
    return (
      <div 
        className="rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-gray-100 text-gray-500"
        style={{ width, height }}
      >
        Endereço não fornecido
      </div>
    )
  }

  // Encode address for URL
  const encodedAddress = encodeURIComponent(selectedAddress.address)
  
  return (
    <div className="space-y-2">
      {/* Seletor de endereço - mostrar apenas se houver mais de um */}
      {allAddresses.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex justify-between items-center p-2 border rounded-lg"
            style={{ borderColor: primaryColor + '40' }}
          >
            <div className="flex items-center">
              <MapPin size={16} style={{ color: primaryColor }} className="mr-2" />
              <span className="text-sm font-medium">{selectedAddress.name}</span>
            </div>
            {isDropdownOpen ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
              {allAddresses.map(addr => (
                <button
                  key={addr.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    setSelectedAddress(addr)
                    setIsDropdownOpen(false)
                  }}
                >
                  <div 
                    className={`w-2 h-2 rounded-full mr-2 ${addr.id === selectedAddress.id ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div>
                    <div className="font-medium text-sm">{addr.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[250px]">{addr.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Mapa */}
      <div className="rounded-lg overflow-hidden shadow-md" style={{ width, height }}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          allowFullScreen
          loading="lazy"
          title={`Localização: ${selectedAddress.name}`}
          className="w-full h-full"
        />
      </div>
    </div>
  )
} 