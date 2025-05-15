"use client"

import { forwardRef, useState } from "react"
import ReactDatePicker from "react-datepicker"
import { CalendarIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ptBR } from "date-fns/locale"

import "react-datepicker/dist/react-datepicker.css"

export interface DatePickerProps {
  date: Date | null
  onChange: (date: Date | null) => void
  className?: string
  placeholder?: string
  showTimeSelect?: boolean
  dateFormat?: string
}

export function DatePicker({
  date,
  onChange,
  className,
  placeholder = "Selecione uma data",
  showTimeSelect = false,
  dateFormat = "dd/MM/yyyy",
}: DatePickerProps) {
  const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <Button
        variant="outline"
        onClick={onClick}
        ref={ref}
        className={cn(
          "w-full justify-start text-left font-normal h-11 bg-white border-gray-200",
          !value && "text-gray-400",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value || placeholder}
      </Button>
    )
  )
  
  CustomInput.displayName = "CustomInput"

  return (
    <ReactDatePicker
      locale={ptBR}
      selected={date}
      onChange={onChange}
      customInput={<CustomInput />}
      showTimeSelect={showTimeSelect}
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat={showTimeSelect ? `${dateFormat} HH:mm` : dateFormat}
      fixedHeight
      popperClassName="z-50" // Garantir que o popover apareça acima de outros elementos
      popperPlacement="bottom-start"
      calendarClassName="bg-white border border-gray-200 rounded-md shadow-lg"
    />
  )
}

// Também criamos uma versão que inclui horário (datetime-picker)
export function DateTimePicker({
  date,
  onChange,
  className,
  placeholder = "Selecione data e hora",
}: Omit<DatePickerProps, "showTimeSelect" | "dateFormat">) {
  return (
    <DatePicker
      date={date}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      showTimeSelect={true}
      dateFormat="dd/MM/yyyy"
    />
  )
} 