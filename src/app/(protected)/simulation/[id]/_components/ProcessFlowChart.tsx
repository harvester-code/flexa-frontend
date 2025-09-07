'use client';

import React from 'react';
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Edit2 as Edit,
  Plane,
  Play,
  Plus,
  Route,
  Settings2,
  Trash2,
  Users,
} from 'lucide-react';
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

  // Event Handlers
  onProcessSelect: (index: number) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (index: number) => void;
  onRemoveProcess: (index: number) => void;
}

export default function ProcessFlowChart({
  processFlow,
  selectedProcessIndex,
  onProcessSelect,
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

          {/* Left-Right Split Layout */}
          <div className="flex min-h-[400px] gap-6">
            {/* Left Panel: Vertical Flow */}
            <div className="max-w-md flex-1">
              <div className="flex flex-col items-center gap-3">
                {/* Entry (Fixed) */}
                <div className="flex min-w-[200px] flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 shadow-sm">
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
                          <span className="mb-2 whitespace-nowrap rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                            {step.travel_time_minutes}min
                          </span>
                        )}
                        <ChevronDown className="h-5 w-5 text-primary" />
                      </div>

                      {/* Process Card */}
                      <div
                        className={`group relative w-full max-w-[200px] flex-shrink-0 cursor-pointer rounded-lg border shadow-sm transition-all duration-200 ease-in-out ${
                          isSelected
                            ? 'border-primary/40 bg-primary/15 shadow-lg ring-2 ring-primary/20'
                            : 'border-primary/10 bg-primary/5 hover:border-primary/20 hover:bg-primary/10 hover:shadow-md'
                        }`}
                        onClick={() => onProcessSelect(index)}
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
                    <ChevronDown className="mt-2 h-5 w-5 flex-shrink-0 text-gray-300" />

                    {/* Process Placeholder - 곧 채워질 프로세스 */}
                    <div className="flex w-full max-w-[200px] flex-shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-400">
                      <div className="h-3 w-3 rounded-full border border-dashed border-gray-300"></div>
                      <span className="text-sm">Process will be added here</span>
                    </div>

                    {/* Placeholder 뒤 화살표 */}
                    <ChevronDown className="mt-2 h-5 w-5 flex-shrink-0 text-gray-300" />
                  </>
                )}

                {/* 프로세스가 있을 때는 마지막 프로세스 뒤에만 화살표 */}
                {processFlow.length > 0 && <ChevronDown className="mt-2 h-5 w-5 flex-shrink-0 text-primary" />}

                {/* Gate (Fixed) */}
                <div className="flex w-full max-w-[200px] flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 shadow-sm">
                  <Plane className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-gray-900">Gate</span>
                </div>
              </div>
            </div>

            {/* Right Panel: Process Details */}
            <div className="min-w-0 flex-1">
              {selectedProcessIndex !== null && processFlow[selectedProcessIndex] ? (
                <div className="rounded-lg border bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Route className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {processFlow[selectedProcessIndex].name}
                        </h3>
                        <p className="text-sm text-gray-500">Process Details</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenEditModal(selectedProcessIndex)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveProcess(selectedProcessIndex)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Process Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Travel Time</label>
                        <p className="text-sm text-gray-900">
                          {processFlow[selectedProcessIndex].travel_time_minutes || 0} minutes
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Zones</label>
                        <p className="text-sm text-gray-900">
                          {Object.keys(processFlow[selectedProcessIndex].zones || {}).length}
                        </p>
                      </div>
                    </div>

                    {/* Zone Details */}
                    {Object.keys(processFlow[selectedProcessIndex].zones || {}).length > 0 && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Zone Details</label>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.keys(processFlow[selectedProcessIndex].zones || {}).map((zoneName) => (
                            <div
                              key={zoneName}
                              className="flex items-center justify-center rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {zoneName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Operating Schedule Editor */}
                    <div className="border-t pt-4">
                      <div className="mb-4 border-l-4 border-primary pl-4">
                        <h3 className="text-lg font-semibold text-default-900">Operating Schedule Editor</h3>
                        <p className="text-sm text-default-500">Configure time-based facility operations</p>
                      </div>
                      <OperatingScheduleEditor processFlow={processFlow} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Route className="h-8 w-8 text-primary/40" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Select a Process</h3>
                    <p className="text-sm text-gray-500">Click on a process card to view and edit its details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
