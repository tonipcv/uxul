'use client';

import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  FormInput, 
  TextCursorInput, // For Text
  Mail,            // For Email
  Phone,           // For Phone
  Hash,            // For Number
  CalendarDays,    // For Date
  List,            // For Select
  ListChecks,      // For MultiSelect
  Star             // For Rating
} from 'lucide-react';

// Expand input types
type InputType = 
  | 'text' 
  | 'longText' 
  | 'email' 
  | 'tel' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'multiSelect' 
  | 'rating';

// Define and EXPORT expected data structure
export interface InputNodeData {
  question: string;
  variableName: string;
  placeholder?: string;
  inputType: InputType;
  options?: { label: string; value: string }[]; // For select/multiSelect
  scale?: number; // For rating
  // Add label for React Flow specific display if needed outside the node itself
  label?: string; 
}

// Map input types to icons
const inputTypeIcons: Record<InputType, React.ElementType> = {
  text: TextCursorInput,
  longText: TextCursorInput, // Using the same for now
  email: Mail,
  tel: Phone,
  number: Hash,
  date: CalendarDays,
  select: List,
  multiSelect: ListChecks,
  rating: Star,
};

export default function InputNode({ id, data, selected }: NodeProps<InputNodeData>) {
  // Get the specific icon based on inputType, default to FormInput if not found
  const Icon = inputTypeIcons[data.inputType] || FormInput;

  // Basic validation for required data fields
  const question = data.question || 'Pergunta não definida';
  const variableName = data.variableName || 'variável não definida';
  const inputTypeName = data.inputType || 'Tipo não definido';

  // We no longer need internal state for editing or field values
  // const [isEditing, setIsEditing] = useState(false);
  // ... other state variables removed ...

  // Handlers like handleSave and handleDelete will be managed externally

  return (
    // Use white background and light gray border, adjust width
    <div className={`bg-white rounded-md border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} p-3 w-[250px] shadow-md`}>
      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Use the dynamic icon */}
          <Icon className="h-4 w-4 text-violet-500" />
          {/* Display the input type name */}
          <span className="text-xs font-medium text-gray-700 capitalize">{inputTypeName}</span>
        </div>
        {/* Trash icon might be added back later via the config panel or context menu */}
      </div>

      {/* Node Content (Display only) */}
      <div className="p-2 bg-gray-50 border border-gray-100 rounded text-sm text-gray-800">
        <div className="mb-1 font-medium break-words">{question}</div>
        {/* Optionally display placeholder or other info if needed */}
        {/* {data.placeholder && <div className="text-xs text-gray-500 mt-1">Placeholder: {data.placeholder}</div>} */}
        <div className="text-xs text-gray-500 mt-1">
          <span>Variável: </span>
          <span className="font-mono bg-gray-200 px-1 rounded">{variableName}</span>
        </div>
        {/* TODO: Add visual indicators for options (select/multiSelect) or scale (rating) later */}
      </div>
      
      {/* Handles remain the same */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" // Use !important Tailwind modifiers if needed
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
} 