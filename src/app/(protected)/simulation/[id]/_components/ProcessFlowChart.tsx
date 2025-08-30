'use client';

import React from 'react';
import { ArrowLeftRight, ChevronRight, Plus, Trash2, Users, Plane, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Route } from 'lucide-react';
import { formatProcessName } from '@/lib/utils';
import { ProcessStep } from '@/types/simulationTypes';

interface ProcessFlowChartProps {
  // Data
  processFlow: ProcessStep[];
  selectedProcessIndex: number | null;
  
  // Drag & Drop State
  draggedIndex: number | null;
  dragOverIndex: number | null;
  
  // Event Handlers
  onProcessSelect: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (index: number) => void;
  onRemoveProcess: (index: number) => void;
}

export default function ProcessFlowChart({
  processFlow,
  selectedProcessIndex,
  draggedIndex,
  dragOverIndex,
  onProcessSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onOpenCreateModal,
  onOpenEditModal,
  onRemoveProcess
}: ProcessFlowChartProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Route className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Process Flow</CardTitle>
              <p className="text-sm text-default-500">
                Configure passenger flow simulation path through airport facilities
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Horizontal Flow Container */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4">
            {/* Entry (Fixed) */}
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 shadow-sm flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-gray-900">Entry</span>
            </div>

            {/* Process Cards */}
            {processFlow.map((step, index) => {
              const isSelected = selectedProcessIndex === index;
              const isConfigured = Object.values(step.zones || {}).every((zone: any) => 
                zone.facilities && zone.facilities.length > 0
              );

              return (
                <React.Fragment key={`${step.name}-${step.step}`}>
                  {/* Travel Time + Arrow */}
                  <div className="flex flex-col items-center flex-shrink-0 relative">
                    {step.travel_time_minutes != null && step.travel_time_minutes > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full whitespace-nowrap mb-1">
                        {step.travel_time_minutes}min
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </div>

                  {/* Process Card */}
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDragLeave={(e) => onDragLeave(e)}
                    onDrop={(e) => onDrop(e, index)}
                    className={`group relative rounded-lg border cursor-move shadow-sm transition-all duration-200 ease-in-out min-w-fit flex-shrink-0 ${
                      isSelected 
                        ? 'bg-primary/15 border-primary/40 shadow-lg ring-2 ring-primary/20' 
                        : 'bg-primary/5 border-primary/10'
                    } ${
                      draggedIndex === index ? 'opacity-30 scale-95 rotate-2' : ''
                    } ${
                      dragOverIndex === index && draggedIndex !== index && draggedIndex !== null 
                        ? 'border-2 border-primary border-dashed bg-primary/20 shadow-lg scale-105' : ''
                    } ${
                      draggedIndex === null && !isSelected ? 'hover:border-primary/20 hover:shadow-md hover:bg-primary/10' : ''
                    }`}
                    onClick={(e) => {
                      // 드래그 중이 아닐 때만 선택 가능
                      if (draggedIndex === null) {
                        onProcessSelect(index);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      // 텍스트 선택 방지
                      if (e.detail > 1) { // 더블클릭 이상일 때
                        e.preventDefault();
                      }
                    }}
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }} // 모든 브라우저에서 텍스트 선택 방지
                    title="Drag to reorder or click to select"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      {/* Drag Handle Visual */}
                      <div
                        className="text-primary/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                      </div>

                      {/* Process Info */}
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 whitespace-nowrap">
                          {formatProcessName(step.name)}
                        </h3>
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          isConfigured ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onRemoveProcess(index);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          title="Remove this process"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Arrow before Add Process Button */}
            <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />

            {/* Add Process Button */}
            <Button
              variant="outline"
              className="flex items-center gap-1 border-2 border-dashed border-primary/30 px-3 py-2 text-primary transition-colors hover:border-primary/50 hover:bg-primary/5 text-sm flex-shrink-0"
              onClick={onOpenCreateModal}
            >
              <Plus className="h-3 w-3" />
              Add Process
            </Button>

            {/* Add Process Button 뒤 화살표 */}
            <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />

            {/* Gate (Fixed) */}
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 shadow-sm flex-shrink-0">
              <Plane className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-gray-900">Gate</span>
            </div>
          </div>

          {/* Selected Process Details */}
          {selectedProcessIndex !== null && processFlow[selectedProcessIndex] ? (
            <div className="border-t border-gray-200 pt-6">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {formatProcessName(processFlow[selectedProcessIndex].name)} Details
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenEditModal(selectedProcessIndex)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Edit Process
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-900">Basic Information</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Travel Time:</span>
                        <span className="text-sm text-gray-900 font-medium">
                          {processFlow[selectedProcessIndex].travel_time_minutes || 0} minutes
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Zones:</span>
                        <span className="text-sm text-gray-900 font-medium">
                          {Object.keys(processFlow[selectedProcessIndex].zones || {}).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Zone Details */}
                  {Object.keys(processFlow[selectedProcessIndex].zones || {}).length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-gray-900">Zone Details</h5>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(processFlow[selectedProcessIndex].zones || {}).map((zoneName) => (
                          <span
                            key={zoneName}
                            className="inline-flex items-center rounded-md bg-primary/20 px-3 py-1 text-sm font-medium text-primary"
                          >
                            {zoneName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Configuration Status */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-900">Configuration Status</h5>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        Object.values(processFlow[selectedProcessIndex].zones || {}).every((zone: any) => 
                          zone.facilities && zone.facilities.length > 0
                        ) ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-sm text-gray-700">
                        {Object.values(processFlow[selectedProcessIndex].zones || {}).every((zone: any) => 
                          zone.facilities && zone.facilities.length > 0
                        ) ? 'All facilities configured' : 'Requires facility setup in Operating Schedule'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            processFlow.length === 0 && (
              <div className="border-t border-gray-200 pt-6">
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-gray-100 p-3">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">No processes configured</h3>
                      <p className="text-sm text-gray-500">
                        Add your first process to start building the passenger flow
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={onOpenCreateModal}
                      className="mt-2 text-primary hover:bg-primary/5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Process
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
