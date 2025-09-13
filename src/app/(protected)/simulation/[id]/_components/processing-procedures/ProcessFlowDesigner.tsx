'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeftRight,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2 as Edit,
  Filter,
  MapPin,
  Plane,
  Play,
  Plus,
  Route,
  Settings2,
  Trash2,
  Users,
} from 'lucide-react';
import { runSimulation } from '@/services/simulationService';
import { useToast } from '@/hooks/useToast';
import { ProcessStep } from '@/types/simulationTypes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatProcessName } from '@/lib/utils';
import { useSimulationStore } from '../../_stores';
import ScheduleEditor from './ScheduleEditor';
import FlightCriteriaSelector from '../flight-schedule/FlightCriteriaSelector';

// Parquet Metadata 타입 정의 (ScheduleEditor와 동일)
interface ParquetMetadataItem {
  column: string;
  values: Record<
    string,
    {
      flights: string[];
      indices: number[];
    }
  >;
}

interface ProcessFlowDesignerProps {
  // Data
  processFlow: ProcessStep[];
  selectedProcessIndex: number | null;
  parquetMetadata?: ParquetMetadataItem[]; // 🆕 동적 데이터 추가
  paxDemographics?: Record<string, any>; // 🆕 승객 정보 추가
  simulationId: string; // 🆕 시뮬레이션 ID 추가

  // Event Handlers
  onProcessSelect: (index: number) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (index: number) => void;
  onRemoveProcess: (index: number) => void;
  onUpdateProcess?: (index: number, updatedProcess: ProcessStep) => void; // New prop for direct updates
}

export default function ProcessFlowDesigner({
  processFlow,
  selectedProcessIndex,
  parquetMetadata = [],
  paxDemographics = {},
  simulationId,
  onProcessSelect,
  onOpenCreateModal,
  onOpenEditModal,
  onRemoveProcess,
  onUpdateProcess,
}: ProcessFlowDesignerProps) {
  const { toast } = useToast();
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  
  // 🆕 step3Completed 상태 가져오기
  const step3Completed = useSimulationStore((s) => s.workflow.step3Completed);
  const paxDemographicsFromStore = useSimulationStore((s) => s.passenger.pax_demographics);
  
  // Inline editing state - always keep a copy of the current process for editing
  const [editedProcess, setEditedProcess] = useState<ProcessStep | null>(null);
  
  // Entry Conditions state
  const [selectedCriteriaItems, setSelectedCriteriaItems] = useState<Record<string, boolean>>({});
  
  // Initialize edited process when selection changes
  React.useEffect(() => {
    if (selectedProcessIndex !== null && processFlow[selectedProcessIndex]) {
      const currentProcess = processFlow[selectedProcessIndex];
      setEditedProcess({ ...currentProcess });
      
      // Initialize entry conditions for the selected process
      const initialSelectedItems: Record<string, boolean> = {};
      if (currentProcess.entry_conditions) {
        currentProcess.entry_conditions.forEach((condition: any) => {
          condition.values.forEach((value: string) => {
            const itemKey = `${condition.field}:${value}`;
            initialSelectedItems[itemKey] = true;
          });
        });
      }
      setSelectedCriteriaItems(initialSelectedItems);
    } else {
      setEditedProcess(null);
      setSelectedCriteriaItems({});
    }
  }, [selectedProcessIndex, processFlow]);

  // Complete 조건 체크: 모든 시설에 operating_schedule이 설정되고 travel_time_minutes가 설정되어야 함
  const canRunSimulation = useMemo(() => {
    if (processFlow.length === 0) return false;

    // 모든 프로세스의 travel_time_minutes가 설정되고, 모든 시설이 operating_schedule을 가져야 함
    return processFlow.every((process) => {
      // travel_time_minutes 체크 (0 이상이어야 함)
      const hasTravelTime = (process.travel_time_minutes ?? 0) >= 0;

      // operating_schedule 체크
      const hasOperatingSchedule = Object.values(process.zones).every(
        (zone: any) =>
          zone.facilities &&
          zone.facilities.length > 0 &&
          zone.facilities.every(
            (facility: any) =>
              facility.operating_schedule &&
              facility.operating_schedule.today &&
              facility.operating_schedule.today.time_blocks &&
              facility.operating_schedule.today.time_blocks.length > 0
          )
      );

      return hasTravelTime && hasOperatingSchedule;
    });
  }, [processFlow]);

  // 🆕 Run simulation 핸들러
  // Handle cancel - reset to original values
  const handleCancel = () => {
    if (selectedProcessIndex !== null && processFlow[selectedProcessIndex]) {
      setEditedProcess({ ...processFlow[selectedProcessIndex] });
    }
  };

  // Handle Entry Conditions selection change
  const handleCriteriaSelectionChange = useCallback((selectedItems: Record<string, boolean>) => {
    setSelectedCriteriaItems(selectedItems);
    
    // Convert selectedItems to entry_conditions format
    const conditionsMap: Record<string, string[]> = {};
    
    Object.entries(selectedItems).forEach(([itemKey, isSelected]) => {
      if (isSelected) {
        const [columnKey, value] = itemKey.split(':');
        if (!conditionsMap[columnKey]) {
          conditionsMap[columnKey] = [];
        }
        conditionsMap[columnKey].push(value);
      }
    });
    
    const newEntryConditions = Object.entries(conditionsMap).map(([field, values]) => ({
      field,
      values,
    }));
    
    if (editedProcess) {
      setEditedProcess({ ...editedProcess, entry_conditions: newEntryConditions });
    }
  }, [editedProcess]);

  const handleCriteriaClearAll = useCallback(() => {
    setSelectedCriteriaItems({});
    if (editedProcess) {
      setEditedProcess({ ...editedProcess, entry_conditions: [] });
    }
  }, [editedProcess]);

  const handleUpdateProcess = () => {
    if (editedProcess && selectedProcessIndex !== null) {
      // If direct update handler is provided, use it
      if (onUpdateProcess) {
        onUpdateProcess(selectedProcessIndex, editedProcess);
      } else {
        // Fallback to opening edit modal with current data
        onOpenEditModal(selectedProcessIndex);
      }
      
      toast({
        title: 'Process Updated',
        description: 'Process has been updated successfully.',
      });
    }
  };

  const handleRunSimulation = async () => {
    if (!canRunSimulation) {
      // 구체적인 미완료 사항 확인
      const missingTravelTimes = processFlow.some((p) => (p.travel_time_minutes ?? 0) < 0);
      const missingSchedules = !processFlow.every((process) =>
        Object.values(process.zones).every(
          (zone: any) =>
            zone.facilities &&
            zone.facilities.length > 0 &&
            zone.facilities.every(
              (facility: any) =>
                facility.operating_schedule &&
                facility.operating_schedule.today &&
                facility.operating_schedule.today.time_blocks &&
                facility.operating_schedule.today.time_blocks.length > 0
            )
        )
      );

      let description = 'Please complete the following before running simulation:\n';
      if (missingTravelTimes) description += '• Set travel times for all processes\n';
      if (missingSchedules) description += '• Configure operating schedules for all facilities';

      toast({
        title: 'Setup Incomplete',
        description: description.trim(),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRunningSimulation(true);

      // travel_time_minutes 값을 안전하게 처리 (최소 1분)
      const sanitizedProcessFlow = processFlow.map((step) => ({
        ...step,
        travel_time_minutes: Math.max(step.travel_time_minutes || 0, 1), // 최소 1분 보장
      }));

      await runSimulation(simulationId, sanitizedProcessFlow);

      toast({
        title: 'Simulation Started',
        description: 'Your simulation is now running. You can check the results in the Home tab.',
      });
    } catch (error: any) {
      toast({
        title: 'Simulation Failed',
        description: error.response?.data?.message || 'Failed to start simulation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningSimulation(false);
    }
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
              disabled={!canRunSimulation || isRunningSimulation}
              className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunningSimulation ? (
                <>
                  <Settings2 className="h-4 w-4 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Simulation
                </>
              )}
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
            {/* Left Panel: Vertical Flow - 3/10 ratio */}
            <div className="max-w-sm flex-[3]">
              <div className="rounded-lg border bg-white p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Process Flow</h3>
                  <p className="text-sm text-gray-500">Passenger journey sequence</p>
                </div>

                {/* Scrollable Container for processes */}
                <div className="flex max-h-[500px] flex-col items-center gap-3 overflow-y-auto">
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
                        <div className="relative flex flex-shrink-0 justify-center">
                          {step.travel_time_minutes != null && step.travel_time_minutes > 0 && (
                            <span className="absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                              {step.travel_time_minutes}min
                            </span>
                          )}
                          <ChevronDown className="mt-2 h-5 w-5 flex-shrink-0 text-primary" />
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
                      <div className="flex w-full max-w-[200px] flex-shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                        <div className="h-2 w-2 rounded-full border border-dashed border-gray-400"></div>
                        <span className="text-xs">Add Process</span>
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
            </div>

            {/* Vertical Divider */}
            <div className="w-px bg-gray-200"></div>

            {/* Right Panel: Process Details - 7/10 ratio */}
            <div className="min-w-0 flex-[7]">
              {selectedProcessIndex !== null && processFlow[selectedProcessIndex] && editedProcess ? (
                <div className="rounded-lg border bg-white p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <Route className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editedProcess.name}
                      </h3>
                      <p className="text-sm text-gray-500">Process Details</p>
                    </div>
                  </div>

                  {/* Process Form - Always Editable */}
                  <div className="space-y-6">
                    <>
                        {/* Process Name */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Process Name
                          </label>
                          <Input
                            value={editedProcess.name}
                            onChange={(e) => setEditedProcess({ ...editedProcess, name: e.target.value })}
                            placeholder="Enter process name"
                            className="w-full"
                          />
                        </div>

                        {/* Zone Names */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Zone Names
                          </label>
                          <Input
                            value={Object.keys(editedProcess.zones || {}).join(', ')}
                            onChange={(e) => {
                              // Parse zone names from comma-separated string
                              const zoneNames = e.target.value.split(',').map(z => z.trim()).filter(z => z);
                              const newZones: any = {};
                              zoneNames.forEach(name => {
                                newZones[name] = editedProcess.zones?.[name] || { facilities: [] };
                              });
                              setEditedProcess({ ...editedProcess, zones: newZones });
                            }}
                            placeholder="e.g., A~E, Gate1~5"
                            className="w-full"
                          />
                        </div>

                        {/* Walking Time */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Walking time
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editedProcess.travel_time_minutes || ''}
                              onChange={(e) => setEditedProcess({ 
                                ...editedProcess, 
                                travel_time_minutes: parseInt(e.target.value) || 0 
                              })}
                              placeholder="5"
                              className="w-24"
                              min="0"
                            />
                            <span className="text-sm text-gray-500">min</span>
                          </div>
                        </div>

                        {/* Processing Time */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Processing Time
                          </label>
                          <div className="relative">
                            <Input
                              type="text"
                              value={editedProcess.process_time_seconds || 12}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                const processTime = numericValue === '' ? 0 : Math.min(300, Math.max(0, parseInt(numericValue)));
                                setEditedProcess({ ...editedProcess, process_time_seconds: processTime });
                              }}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              placeholder="12"
                              className="pr-12 text-center"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">sec</span>
                          </div>
                        </div>

                        {/* Entry Conditions */}
                        <div>
                          {parquetMetadata && parquetMetadata.length > 0 ? (
                            <FlightCriteriaSelector
                              title="Entry Conditions"
                              icon={<Filter className="h-4 w-4" />}
                              parquetMetadata={parquetMetadata}
                              additionalMetadata={paxDemographics || paxDemographicsFromStore}
                              onSelectionChange={handleCriteriaSelectionChange}
                              onClearAll={handleCriteriaClearAll}
                              initialSelectedItems={selectedCriteriaItems}
                            />
                          ) : (
                            <div>
                              <label className="mb-3 block text-sm font-medium text-gray-700">
                                <Filter className="mr-2 inline h-4 w-4" />
                                Entry Conditions
                              </label>
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm text-amber-700">
                                  Parquet metadata is required to configure entry conditions. Please provide flight data to enable
                                  this feature.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleUpdateProcess}
                          >
                            Update
                          </Button>
                        </div>
                      </>
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

          {/* Operating Schedule Editor - Same level as Process Configuration */}
          <div className="flex items-start justify-between border-l-4 border-primary pl-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-default-900">Operating Schedule Editor</h3>
              <p className="text-sm text-default-500">Configure time-based facility operations</p>
            </div>
          </div>

          {/* Operating Schedule Editor Content */}
          <div className="rounded-lg border bg-white p-6">
            <ScheduleEditor
              processFlow={processFlow}
              parquetMetadata={parquetMetadata}
              paxDemographics={paxDemographics}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
