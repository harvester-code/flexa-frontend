'use client';

import React from 'react';
import { ArrowLeftRight, ChevronRight, Plane, Play, Plus, Settings2, Trash2, Users } from 'lucide-react';
import { Route } from 'lucide-react';
import { ProcessStep } from '@/types/simulationTypes';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatProcessName } from '@/lib/utils';
import { useSimulationStore } from '../_stores';
import OperatingScheduleEditor from './OperatingScheduleEditor';

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
  onRemoveProcess,
}: ProcessFlowChartProps) {
  // 🆕 step3Completed 상태 가져오기
  const step3Completed = useSimulationStore((s) => s.workflow.step3Completed);

  // 🆕 Run simulation 핸들러 (일단 빈 함수)
  const handleRunSimulation = () => {
    console.log('Run simulation clicked');
    // TODO: 시뮬레이션 실행 로직 추가 예정
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
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
            {/* 🆕 Run Simulation Button */}
            <Button
              onClick={handleRunSimulation}
              disabled={!step3Completed}
              className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
            >
              <Play size={16} />
              Run Simulation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Divider */}
          <hr className="border-gray-200" />

          {/* 🆕 Process Configuration Description */}
          <div className="flex items-start justify-between border-l-4 border-primary pl-4">
            <div>
              <h3 className="text-lg font-semibold text-default-900">Process Configuration</h3>
              <p className="text-sm text-default-500">Define the passenger flow sequence and facility requirements</p>
            </div>
            <Button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Process
            </Button>
          </div>

          {/* Horizontal Flow Container */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4">
            {/* Entry (Fixed) */}
            <div className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 shadow-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-gray-900">Entry</span>
            </div>

            {/* Process Cards */}
            {processFlow.map((step, index) => {
              const isSelected = selectedProcessIndex === index;
              const isConfigured = Object.values(step.zones || {}).every(
                (zone: any) => zone.facilities && zone.facilities.length > 0
              );

              return (
                <React.Fragment key={`${step.name}-${step.step}`}>
                  {/* Travel Time + Arrow */}
                  <div className="relative flex flex-shrink-0 flex-col items-center">
                    {step.travel_time_minutes != null && step.travel_time_minutes > 0 && (
                      <span className="mb-1 whitespace-nowrap rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
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
                    className={`group relative min-w-fit flex-shrink-0 cursor-move rounded-lg border shadow-sm transition-all duration-200 ease-in-out ${
                      isSelected
                        ? 'border-primary/40 bg-primary/15 shadow-lg ring-2 ring-primary/20'
                        : 'border-primary/10 bg-primary/5'
                    } ${draggedIndex === index ? 'rotate-2 scale-95 opacity-30' : ''} ${
                      dragOverIndex === index && draggedIndex !== index && draggedIndex !== null
                        ? 'scale-105 border-2 border-dashed border-primary bg-primary/20 shadow-lg'
                        : ''
                    } ${
                      draggedIndex === null && !isSelected
                        ? 'hover:border-primary/20 hover:bg-primary/10 hover:shadow-md'
                        : ''
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
                      if (e.detail > 1) {
                        // 더블클릭 이상일 때
                        e.preventDefault();
                      }
                    }}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                    }} // 모든 브라우저에서 텍스트 선택 방지
                    title="Drag to reorder or click to select"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      {/* Drag Handle Visual */}
                      <div className="text-primary/60" onClick={(e) => e.stopPropagation()}>
                        <ArrowLeftRight className="h-3 w-3" />
                      </div>

                      {/* Process Info */}
                      <div className="flex items-center gap-2">
                        <h3 className="whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatProcessName(step.name)}
                        </h3>
                        <div
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${
                            isConfigured ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="ml-auto flex items-center gap-1">
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

            {/* Process Placeholder - 프로세스가 없을 때만 표시 */}
            {processFlow.length === 0 && (
              <>
                {/* Arrow before Placeholder */}
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300" />

                {/* Process Placeholder - 곧 채워질 프로세스 */}
                <div className="flex flex-shrink-0 items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                  <div className="h-3 w-3 rounded-full border border-dashed border-gray-300"></div>
                  <span className="text-sm">Process will be added here</span>
                </div>

                {/* Placeholder 뒤 화살표 */}
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300" />
              </>
            )}

            {/* 프로세스가 있을 때는 마지막 프로세스 뒤에만 화살표 */}
            {processFlow.length > 0 && <ChevronRight className="h-5 w-5 flex-shrink-0 text-primary" />}

            {/* Gate (Fixed) */}
            <div className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 shadow-sm">
              <Plane className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-gray-900">Gate</span>
            </div>
          </div>

          {/* 🆕 Operating Schedule Editor Section - 프로세스가 있을 때만 표시 */}
          {processFlow.length > 0 && (
            <div>
              <div className="mb-6 border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold text-default-900">Operating Schedule Editor</h3>
                <p className="text-sm text-default-500">Configure time-based facility operations</p>
              </div>

              <OperatingScheduleEditor processFlow={processFlow} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
