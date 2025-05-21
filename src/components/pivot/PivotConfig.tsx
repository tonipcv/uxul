import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { AVAILABLE_DIMENSIONS, AVAILABLE_METRICS, PivotRequest } from '@/types/pivot';

interface PivotConfigProps {
  config: PivotRequest;
  onChange: (newConfig: PivotRequest) => void;
}

interface DraggableItemProps {
  id: string;
  label: string;
  type: 'dimension' | 'metric';
  index: number;
  onRemove?: () => void;
}

const DraggableItem = ({ id, label, type, index, onRemove }: DraggableItemProps) => (
  <Draggable draggableId={id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`
          flex items-center justify-between p-2 mb-1 rounded
          ${type === 'dimension' ? 'bg-blue-100' : 'bg-green-100'}
          ${snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'}
          transition-all duration-200
        `}
      >
        <span className="text-sm font-medium">{label}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="ml-2 text-gray-500 hover:text-red-500"
          >
            ×
          </button>
        )}
      </div>
    )}
  </Draggable>
);

const DroppableZone = ({ 
  title, 
  items, 
  droppableId 
}: { 
  title: string; 
  items: Array<{ id: string; label: string; type: 'dimension' | 'metric' }>;
  droppableId: string;
}) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-sm font-semibold mb-2 text-gray-700">{title}</h3>
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            min-h-[100px] rounded-md transition-colors duration-200
            ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
          `}
        >
          {items.map((item, index) => (
            <DraggableItem
              key={item.id}
              id={item.id}
              label={item.label}
              type={item.type}
              index={index}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

export function PivotConfig({ config, onChange }: PivotConfigProps) {
  const handleDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid drop zone
    if (!destination) return;

    // Same location drop
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Get the dragged item's type
    const draggedItem = [...AVAILABLE_DIMENSIONS, ...AVAILABLE_METRICS].find(
      item => item.key === draggableId
    );
    
    if (!draggedItem) return;

    const isMetric = AVAILABLE_METRICS.some(m => m.key === draggableId);

    // Validate drops
    if (isMetric && destination.droppableId !== 'metrics') {
      return; // Metrics can only go to metrics zone
    }
    if (!isMetric && destination.droppableId === 'metrics') {
      return; // Dimensions cannot go to metrics zone
    }

    // Create new config
    const newConfig = {
      ...config,
      rows: [...config.rows],
      columns: [...config.columns],
      metrics: [...config.metrics]
    };

    // Remove from source if it's not the available zone
    if (source.droppableId !== 'available') {
      switch (source.droppableId) {
        case 'rows':
          newConfig.rows = newConfig.rows.filter(id => id !== draggableId);
          break;
        case 'columns':
          newConfig.columns = newConfig.columns.filter(id => id !== draggableId);
          break;
        case 'metrics':
          newConfig.metrics = newConfig.metrics.filter(id => id !== draggableId);
          break;
      }
    }

    // Add to destination
    switch (destination.droppableId) {
      case 'rows':
        if (!newConfig.rows.includes(draggableId)) {
          newConfig.rows.push(draggableId);
        }
        break;
      case 'columns':
        if (!newConfig.columns.includes(draggableId)) {
          newConfig.columns.push(draggableId);
        }
        break;
      case 'metrics':
        if (!newConfig.metrics.includes(draggableId)) {
          newConfig.metrics.push(draggableId);
        }
        break;
    }

    onChange(newConfig);
  };

  // Filter available items
  const availableDimensions = AVAILABLE_DIMENSIONS.filter(
    dim => !config.rows.includes(dim.key) && !config.columns.includes(dim.key)
  ).map(dim => ({
    id: dim.key,
    label: dim.label,
    type: 'dimension' as const
  }));

  const availableMetrics = AVAILABLE_METRICS.filter(
    metric => !config.metrics.includes(metric.key)
  ).map(metric => ({
    id: metric.key,
    label: metric.label,
    type: 'metric' as const
  }));

  // Prepare configured items
  const rowItems = config.rows.map(row => ({
    id: row,
    label: AVAILABLE_DIMENSIONS.find(d => d.key === row)?.label || row,
    type: 'dimension' as const
  }));

  const columnItems = config.columns.map(col => ({
    id: col,
    label: AVAILABLE_DIMENSIONS.find(d => d.key === col)?.label || col,
    type: 'dimension' as const
  }));

  const metricItems = config.metrics.map(metric => ({
    id: metric,
    label: AVAILABLE_METRICS.find(m => m.key === metric)?.label || metric,
    type: 'metric' as const
  }));

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <DroppableZone
          title="Dimensões Disponíveis"
          items={[...availableDimensions, ...availableMetrics]}
          droppableId="available"
        />
        <DroppableZone
          title="Linhas"
          items={rowItems}
          droppableId="rows"
        />
        <DroppableZone
          title="Colunas"
          items={columnItems}
          droppableId="columns"
        />
        <DroppableZone
          title="Métricas"
          items={metricItems}
          droppableId="metrics"
        />
      </div>
    </DragDropContext>
  );
} 