"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusIcon, TrashIcon, CheckIcon } from 'lucide-react'

export interface Address {
  id?: string
  name: string
  address: string
  isDefault: boolean
}

interface AddressManagerProps {
  addresses: Address[]
  onChange: (addresses: Address[]) => void
  primaryColor?: string
}

export function AddressManager({
  addresses = [],
  onChange,
  primaryColor = '#0070df'
}: AddressManagerProps) {
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    name: '',
    address: '',
    isDefault: addresses.length === 0 // Se não houver endereços, o primeiro será o padrão
  })

  const handleAddAddress = () => {
    if (!newAddress.name || !newAddress.address) return

    // Se o novo endereço for padrão, remova o status de padrão dos outros
    const updatedAddresses = newAddress.isDefault
      ? addresses.map(addr => ({ ...addr, isDefault: false }))
      : [...addresses]

    // Adicionar novo endereço com ID temporário
    const tempId = `temp-${Date.now()}`
    onChange([...updatedAddresses, { ...newAddress, id: tempId }])

    // Limpar o formulário
    setNewAddress({
      name: '',
      address: '',
      isDefault: false
    })
  }

  const handleRemoveAddress = (indexToRemove: number) => {
    const newAddresses = addresses.filter((_, index) => index !== indexToRemove)
    
    // Se removemos o endereço padrão e ainda há outros, defina o primeiro como padrão
    if (addresses[indexToRemove].isDefault && newAddresses.length > 0) {
      newAddresses[0].isDefault = true
    }
    
    onChange(newAddresses)
  }

  const handleSetDefault = (indexToDefault: number) => {
    const newAddresses = addresses.map((addr, index) => ({
      ...addr,
      isDefault: index === indexToDefault
    }))
    
    onChange(newAddresses)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {addresses.map((address, index) => (
          <div 
            key={address.id || index} 
            className="flex flex-col gap-2 p-3 border rounded-lg relative"
            style={{ borderColor: address.isDefault ? primaryColor : 'rgb(229, 231, 235)' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-sm">{address.name}</h4>
                <p className="text-sm text-gray-600">{address.address}</p>
              </div>
              <div className="flex gap-1">
                {!address.isDefault && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => handleSetDefault(index)}
                    style={{ color: primaryColor }}
                  >
                    Definir como padrão
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleRemoveAddress(index)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {address.isDefault && (
              <div 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <CheckIcon className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="text-sm font-medium mb-2">Adicionar novo endereço</h3>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="name">Nome do local</Label>
            <Input
              id="name"
              placeholder="Ex: Consultório Principal"
              value={newAddress.name}
              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="address">Endereço completo</Label>
            <Input
              id="address"
              placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo/SP"
              value={newAddress.address}
              onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={newAddress.isDefault}
              onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isDefault" className="text-sm">Definir como endereço padrão</Label>
          </div>
          <Button
            onClick={handleAddAddress}
            disabled={!newAddress.name || !newAddress.address}
            className="mt-2 w-full"
            style={{ backgroundColor: primaryColor, color: 'white' }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar endereço
          </Button>
        </div>
      </div>
    </div>
  )
} 