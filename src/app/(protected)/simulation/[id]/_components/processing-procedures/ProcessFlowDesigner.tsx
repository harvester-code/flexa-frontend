'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeftRight,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2 as Edit,
  Filter,
  GripVertical,
  MapPin,
  Plane,
  Play,
  Plus,
  Route,
  Settings2,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { runSimulation } from '@/services/simulationService';
import { useToast } from '@/hooks/useToast';
import { ProcessStep, APIRequestLog } from '@/types/simulationTypes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatProcessName } from '@/lib/utils';
import { useSimulationStore } from '../../_stores';
import ScheduleEditor from './ScheduleEditor';
import FlightCriteriaSelector from '../flight-schedule/FlightCriteriaSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { getBadgeColor, getZoneGradient, getZoneGradientStyle } from '@/styles/colors';

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
  apiRequestLog: APIRequestLog | null;
  setApiRequestLog: (log: APIRequestLog | null) => void;

  // Event Handlers
  onProcessSelect: (index: number) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (index: number) => void;
  onRemoveProcess: (index: number) => void;
  onUpdateProcess?: (index: number, updatedProcess: ProcessStep) => void; // New prop for direct updates
  onReorderProcesses?: (newProcessFlow: ProcessStep[]) => void; // New prop for reordering
  onCreateProcess?: (newProcess: ProcessStep) => void; // New prop for creating process
}

// Sortable Process Card Component
function SortableProcessCard({
  step,
  index,
  isSelected,
  onSelect,
  onRemove,
}: {
  step: ProcessStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.step });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isConfigured = Object.values(step.zones || {}).every(
    (zone: any) => zone.facilities && zone.facilities.length > 0
  );

  // Group entry condition values by field
  const entryConditionBadges: string[] = [];
  if (step.entry_conditions && step.entry_conditions.length > 0) {
    step.entry_conditions.forEach((condition: any) => {
      // Join multiple values from same field with |
      if (condition.values && condition.values.length > 0) {
        entryConditionBadges.push(condition.values.join(' | '));
      }
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative w-full flex-shrink-0 cursor-pointer rounded-lg border shadow-sm transition-all duration-200 ease-in-out ${
        isSelected
          ? 'border-primary/40 bg-primary/15 shadow-lg ring-2 ring-primary/20'
          : 'border-primary/10 bg-primary/5 hover:border-primary/20 hover:bg-primary/10 hover:shadow-md'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-1.5 px-3 py-2">
        {/* Top row with drag handle, process name, and action buttons */}
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <div
            className="text-primary/60 cursor-grab hover:text-primary"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Process Info */}
          <div className="flex items-center gap-2 flex-1">
            <h3 className="whitespace-nowrap text-sm font-medium text-gray-900">
              {formatProcessNameForDisplay(step.name)}
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove this process"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>

        {/* Entry condition badges row */}
        <div className="flex flex-wrap gap-1 pl-6">
          {entryConditionBadges.length > 0 ? (
            <>
              {entryConditionBadges.slice(0, 3).map((badge, idx) => {
                const color = getBadgeColor(idx);
                return (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px]"
                    style={color.style}
                  >
                    {badge}
                  </Badge>
                );
              })}
              {entryConditionBadges.length > 3 && (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 text-[10px] bg-gray-100 text-gray-700 border border-gray-200"
                >
                  +{entryConditionBadges.length - 3}
                </Badge>
              )}
            </>
          ) : (
            <Badge
              variant="outline"
              className="px-1.5 py-0 text-[10px] bg-gray-100 text-gray-600 border border-gray-200"
            >
              All
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Format process name for storage (lowercase with underscores)
function formatProcessNameForStorage(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\-]+/g, '_') // Replace spaces and hyphens with underscores
    .replace(/[^a-z0-9_]/g, '') // Remove special characters except underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

// Format process name for display (Title Case)
function formatProcessNameForDisplay(name: string): string {
  if (!name) return '';

  // Split by underscore, hyphen, or space
  const words = name.split(/[\s_\-]+/);

  // Capitalize first letter of each word
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function ProcessFlowDesigner({
  processFlow,
  selectedProcessIndex,
  parquetMetadata = [],
  paxDemographics = {},
  simulationId,
  apiRequestLog,
  setApiRequestLog,
  onProcessSelect,
  onOpenCreateModal,
  onOpenEditModal,
  onRemoveProcess,
  onUpdateProcess,
  onReorderProcesses,
  onCreateProcess,
}: ProcessFlowDesignerProps) {
  const { toast } = useToast();
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);

  // 🆕 step3Completed 상태 가져오기
  const step3Completed = useSimulationStore((s) => s.workflow.step3Completed);
  const paxDemographicsFromStore = useSimulationStore((s) => s.passenger.pax_demographics);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Inline editing state - always keep a copy of the current process for editing
  const [editedProcess, setEditedProcess] = useState<(ProcessStep & { process_time_seconds?: number }) | null>(null);
  const [defaultFacilityCount, setDefaultFacilityCount] = useState<number | null>(null);
  const [zoneNamesInput, setZoneNamesInput] = useState<string>('');
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);


  // Entry Conditions state
  const [selectedCriteriaItems, setSelectedCriteriaItems] = useState<Record<string, boolean>>({});
  const [isEntryConditionDialogOpen, setIsEntryConditionDialogOpen] = useState(false);
  const [tempSelectedCriteriaItems, setTempSelectedCriteriaItems] = useState<Record<string, boolean>>({});

  // Zone facility count editing functions
  const startEditingZone = useCallback((zoneName: string) => {
    const zone = editedProcess?.zones?.[zoneName];
    const currentCount = zone?.facilities?.length || defaultFacilityCount || 1;
    setEditingZone(zoneName);
    setEditingValue(currentCount.toString());
  }, [editedProcess, defaultFacilityCount]);

  const finishEditingZone = useCallback(() => {
    if (editingZone && editedProcess) {
      const newCount = editingValue === '' ? (defaultFacilityCount || 1) : parseInt(editingValue);
      const count = Math.max(1, Math.min(50, newCount));

      // Update the specific zone's facility count
      const updatedZones = { ...editedProcess.zones };
      const facilities: any[] = [];
      for (let i = 1; i <= count; i++) {
        const existingSchedule = editedProcess.zones[editingZone]?.facilities?.[i-1]?.operating_schedule;
        facilities.push({
          id: `${editingZone}_${i}`,
          operating_schedule: existingSchedule || {
            yesterday: {
              time_blocks: []
            },
            today: {
              time_blocks: []
            }
          }
        });
      }
      updatedZones[editingZone] = { facilities };
      setEditedProcess({ ...editedProcess, zones: updatedZones });
    }
    setEditingZone(null);
    setEditingValue('');
  }, [editingZone, editingValue, editedProcess, defaultFacilityCount]);

  const cancelEditingZone = useCallback(() => {
    setEditingZone(null);
    setEditingValue('');
  }, []);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditingZone();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingZone();
    }
  }, [finishEditingZone, cancelEditingZone]);

  // Zone name expansion function (same as ProcessConfigModal)
  const expandZoneNames = useCallback((input: string): string[] => {
    let expanded = input.toUpperCase(); // Convert to uppercase

    // Handle numeric range patterns (e.g., Gate1~5)
    expanded = expanded.replace(/(.*?)(\d+)~(\d+)/g, (match, beforeLastNum, startNum, endNum) => {
      const start = parseInt(startNum);
      const end = parseInt(endNum);

      if (start > end) return '';

      const items: string[] = [];
      for (let i = start; i <= end; i++) {
        items.push(beforeLastNum + i);
      }
      return items.join(',');
    });

    // Handle alphabetic patterns (e.g., A~E)
    expanded = expanded.replace(/([A-Za-z]*)([A-Z])~([A-Z])/g, (match, prefix, start, end) => {
      const startCode = start.charCodeAt(0);
      const endCode = end.charCodeAt(0);

      if (startCode > endCode) return match;

      const items: string[] = [];
      for (let i = startCode; i <= endCode; i++) {
        items.push(prefix + String.fromCharCode(i));
      }
      return items.join(',');
    });

    // Split and clean the result
    return expanded
      .split(',')
      .map((z) => z.trim())
      .filter((z) => z.length > 0);
  }, []);
  
  // Initialize edited process when selection changes
  React.useEffect(() => {
    if (!isCreatingNew && selectedProcessIndex !== null && processFlow[selectedProcessIndex]) {
      const currentProcess = processFlow[selectedProcessIndex];

      // Get process_time_seconds from the first facility's first time_block
      let processTimeSeconds: number | undefined = undefined;
      const zoneKeys = Object.keys(currentProcess.zones || {});
      if (zoneKeys.length > 0) {
        const firstZone = currentProcess.zones[zoneKeys[0]];
        if (firstZone && firstZone.facilities && firstZone.facilities.length > 0) {
          const firstFacility = firstZone.facilities[0];
          if (firstFacility.operating_schedule?.today?.time_blocks?.length > 0) {
            processTimeSeconds = firstFacility.operating_schedule.today.time_blocks[0].process_time_seconds || undefined;
          }
        }
      }

      setEditedProcess({
        ...currentProcess,
        process_time_seconds: processTimeSeconds
      });
      setZoneNamesInput(Object.keys(currentProcess.zones || {}).join(', '));

      // Set defaultFacilityCount based on the first zone's facility count
      if (zoneKeys.length > 0) {
        const firstZone = currentProcess.zones[zoneKeys[0]];
        if (firstZone && firstZone.facilities) {
          setDefaultFacilityCount(firstZone.facilities.length);
        }
      }

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
    } else if (!isCreatingNew) {
      setEditedProcess(null);
      setZoneNamesInput('');
      setDefaultFacilityCount(null);
      setSelectedCriteriaItems({});
    }
  }, [selectedProcessIndex, processFlow, isCreatingNew]);

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
    // Clear selection and reset all states
    setIsCreatingNew(false);
    setEditedProcess(null);
    setZoneNamesInput('');
    setDefaultFacilityCount(null);
    setSelectedCriteriaItems({});
    setEditingZone(null);
    onProcessSelect(-1); // Deselect any selected process
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = processFlow.findIndex((p) => p.step === active.id);
      const newIndex = processFlow.findIndex((p) => p.step === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFlow = arrayMove(processFlow, oldIndex, newIndex);

        // Update step numbers (0-based) with correct key order
        const updatedFlow = newFlow.map((process, index) => ({
          step: index,
          name: process.name,
          travel_time_minutes: process.travel_time_minutes || 0,
          entry_conditions: process.entry_conditions || [],
          zones: process.zones || {},
        }));

        // Call the reorder handler if provided
        if (onReorderProcesses) {
          onReorderProcesses(updatedFlow);
        }

        // Update selected index if needed
        if (selectedProcessIndex !== null && processFlow[selectedProcessIndex]) {
          const selectedProcess = processFlow[selectedProcessIndex];
          const newSelectedIndex = updatedFlow.findIndex(p => p.name === selectedProcess.name);
          if (newSelectedIndex !== -1) {
            onProcessSelect(newSelectedIndex);
          }
        }

        toast({
          title: 'Process Order Updated',
          description: 'The process flow has been reordered successfully.',
        });
      }
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
      // Format the process name for storage
      const processToUpdate = {
        ...editedProcess,
        name: formatProcessNameForStorage(editedProcess.name)
      };

      // If direct update handler is provided, use it
      if (onUpdateProcess) {
        onUpdateProcess(selectedProcessIndex, processToUpdate);
      } else {
        // Fallback to opening edit modal with current data
        onOpenEditModal(selectedProcessIndex);
      }

      // Reset to initial state
      setEditedProcess(null);
      setZoneNamesInput('');
      setDefaultFacilityCount(null);
      setSelectedCriteriaItems({});
      setEditingZone(null);
      setEditingValue('');
      onProcessSelect(-1); // Deselect any selected process

      toast({
        title: 'Process Updated',
        description: 'Process has been updated and reset to initial state.',
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

      // Reorder process flow keys to match backend format (raw_v24.json)
      const sanitizedProcessFlow = processFlow.map((step) => {
        // Create a new object with the specific key order that backend expects
        const orderedStep = {
          step: step.step,
          name: step.name,
          travel_time_minutes: Math.max(step.travel_time_minutes || 0, 1), // 최소 1분 보장
          entry_conditions: step.entry_conditions || [],
          zones: step.zones || {}
        };

        return orderedStep;
      });

      // Set API request log
      const requestData = {
        process_flow: sanitizedProcessFlow
      };

      setApiRequestLog({
        timestamp: new Date().toISOString(),
        request: requestData,
        status: 'loading'
      });

      const response = await runSimulation(simulationId, sanitizedProcessFlow);

      // Update with success response
      setApiRequestLog({
        timestamp: new Date().toISOString(),
        request: requestData,
        response: response.data,
        status: 'success'
      });

      toast({
        title: 'Simulation Started',
        description: 'Your simulation is now running. You can check the results in the Home tab.',
      });
    } catch (error: any) {
      // Update with error - using the same key ordering as raw_v24.json
      setApiRequestLog({
        timestamp: new Date().toISOString(),
        request: {
          process_flow: processFlow.map((step) => ({
            step: step.step,
            name: step.name,
            travel_time_minutes: Math.max(step.travel_time_minutes || 0, 1),
            entry_conditions: step.entry_conditions || [],
            zones: step.zones || {}
          }))
        },
        status: 'error',
        error: error.response?.data?.message || error.message || 'Failed to start simulation'
      });

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
          </div>

          {/* Left-Right Split Layout */}
          <div className="flex gap-6 h-[44rem]">
            {/* Left Panel: Vertical Flow - 4/10 ratio */}
            <div className="flex-[4] flex">
              <div className="rounded-lg border bg-white p-4 flex flex-col flex-1">
                <div className="mb-4 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900">Process Flow</h3>
                  <p className="text-sm text-gray-500">Passenger journey sequence</p>
                </div>

                {/* Scrollable Container for processes */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-visible px-4">
                    {/* Entry (Fixed) */}
                    <div className="flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 shadow-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-gray-900">Entry</span>
                    </div>

                    {/* Sortable Process Cards */}
                    <SortableContext
                      items={processFlow.map(p => p.step)}
                      strategy={verticalListSortingStrategy}
                    >
                      {processFlow.map((step, index) => {
                        const isSelected = selectedProcessIndex === index;

                        return (
                          <React.Fragment key={`${step.name}-${step.step}`}>
                            {/* Travel Time + Arrow */}
                            <div className="relative flex flex-shrink-0 justify-center">
                              <ChevronDown className="h-5 w-5 flex-shrink-0 text-primary" />
                              {step.travel_time_minutes != null && step.travel_time_minutes > 0 && (
                                <span className="absolute left-1/2 top-1/2 -translate-x-[calc(100%+1.5rem)] -translate-y-1/2 whitespace-nowrap rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                                  {step.travel_time_minutes}min
                                </span>
                              )}
                            </div>

                            {/* Sortable Process Card */}
                            <SortableProcessCard
                              step={step}
                              index={index}
                              isSelected={isSelected}
                              onSelect={() => onProcessSelect(index)}
                              onRemove={() => onRemoveProcess(index)}
                            />
                          </React.Fragment>
                        );
                      })}
                    </SortableContext>

                    {/* New Process Placeholder - Show when creating */}
                    {isCreatingNew && editedProcess && (
                      <>
                        {/* Arrow before new process */}
                        <div className="flex justify-center">
                          <ChevronDown className="h-5 w-5 flex-shrink-0 text-primary" />
                        </div>

                        {/* New Process Card Placeholder */}
                        <div className="group relative w-full flex-shrink-0 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 shadow-sm animate-pulse">
                          <div className="flex items-center gap-2 px-3 py-2">
                            <div className="text-primary/40">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              <h3 className="whitespace-nowrap text-sm font-medium text-gray-700">
                                {editedProcess.name ? formatProcessNameForDisplay(editedProcess.name) : 'Enter process name...'}
                              </h3>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Arrow before Gate - Always show */}
                    <div className="flex justify-center">
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-primary" />
                    </div>

                    {/* Gate (Fixed) */}
                    <div className="flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 shadow-sm">
                      <Plane className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-gray-900">Gate</span>
                    </div>
                  </div>
                </DndContext>

                {/* Divider and Add Process Button */}
                <div className="mt-4 border-t pt-4 flex-shrink-0">
                  <Button
                    onClick={() => {
                      setIsCreatingNew(true);
                      setEditedProcess({
                        name: '',
                        step: processFlow.length + 1,
                        zones: {},
                        travel_time_minutes: null,
                        process_time_seconds: null,
                        entry_conditions: []
                      } as ProcessStep);
                      setZoneNamesInput('');
                      setDefaultFacilityCount(null);
                      setSelectedCriteriaItems({});
                      onProcessSelect(-1); // Deselect any selected process
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Process
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Panel: Process Details - 6/10 ratio */}
            <div className="min-w-0 flex-[6] flex h-full">
              {(isCreatingNew || (selectedProcessIndex !== null && processFlow[selectedProcessIndex])) && editedProcess ? (
                <div className="rounded-lg border bg-white flex-1 h-full flex flex-col">
                  {/* Header - Fixed */}
                  <div className="px-6 py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        <Route className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={editedProcess.name}
                          onChange={(e) => setEditedProcess({ ...editedProcess, name: e.target.value })}
                          placeholder="Enter process name"
                          className="text-lg font-semibold border border-gray-300 bg-white px-3 py-1.5 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-400 transition-colors"
                          autoFocus={isCreatingNew}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {isCreatingNew ? 'Create New Process' : 'Process Details'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Process Form - Always Editable */}
                    <div className="space-y-6">
                    <>
                        {/* Zone Names and Facilities/Zone - One row */}
                        <div className="grid grid-cols-12 gap-3">
                          {/* Zone Names - 6/12 */}
                          <div className="col-span-6">
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                              <MapPin className="h-4 w-4" />
                              Zone Names
                              <div className={`h-2 w-2 rounded-full ${
                                Object.keys(editedProcess.zones || {}).length > 0 ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                            </label>
                            <Input
                              value={zoneNamesInput}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                setZoneNamesInput(inputValue);

                                // Expand zone names when input changes
                                if (inputValue.trim()) {
                                  const expandedZones = expandZoneNames(inputValue);
                                  const newZones: any = {};

                                  expandedZones.forEach(name => {
                                    // Create facilities based on defaultFacilityCount
                                    const existingZone = editedProcess.zones?.[name];
                                    if (existingZone && existingZone.facilities && existingZone.facilities.length > 0) {
                                      // Keep existing facilities
                                      newZones[name] = existingZone;
                                    } else {
                                      // Create new facilities
                                      const facilities: any[] = [];
                                      for (let i = 1; i <= (defaultFacilityCount || 1); i++) {
                                        facilities.push({
                                          id: `${name}_${i}`,
                                          operating_schedule: {
                                            yesterday: {
                                              time_blocks: []
                                            },
                                            today: {
                                              time_blocks: []
                                            }
                                          }
                                        });
                                      }
                                      newZones[name] = { facilities };
                                    }
                                  });
                                  setEditedProcess({ ...editedProcess, zones: newZones });
                                } else {
                                  setEditedProcess({ ...editedProcess, zones: {} });
                                }
                              }}
                              placeholder="e.g., A~E, Gate1~5"
                              className="w-full"
                            />
                          </div>

                          {/* Facilities per zone - 6/12 */}
                          <div className="col-span-6">
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                              <Building2 className="h-4 w-4" />
                              Facilities/Zone
                              <div className={`h-2 w-2 rounded-full ${
                                defaultFacilityCount && defaultFacilityCount > 0 ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                            </label>
                            <div className="relative">
                              <Input
                                type="text"
                                value={defaultFacilityCount || ''}
                                onChange={(e) => {
                                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                  const count = numericValue === '' ? 0 : Math.min(50, Math.max(1, parseInt(numericValue)));
                                  setDefaultFacilityCount(count);

                                  // Update all zones with new facility count
                                  if (editedProcess.zones) {
                                    const updatedZones: any = {};
                                    Object.keys(editedProcess.zones).forEach(zoneName => {
                                      const facilities: any[] = [];
                                      for (let i = 1; i <= count; i++) {
                                        const existingSchedule = editedProcess.zones[zoneName]?.facilities?.[i-1]?.operating_schedule;
                                        facilities.push({
                                          id: `${zoneName}_${i}`,
                                          operating_schedule: existingSchedule || {
                                            yesterday: {
                                              time_blocks: []
                                            },
                                            today: {
                                              time_blocks: []
                                            }
                                          }
                                        });
                                      }
                                      updatedZones[zoneName] = { facilities };
                                    });
                                    setEditedProcess({ ...editedProcess, zones: updatedZones });
                                  }
                                }}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                className="pr-8 text-center"
                                placeholder="10"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">EA</span>
                            </div>
                          </div>
                        </div>

                        {/* Zone Grid Configuration */}
                        <div className="min-h-[80px] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-3">
                          {Object.keys(editedProcess.zones || {}).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {Object.keys(editedProcess.zones || {}).map((zoneName, index) => {
                                const zone = editedProcess.zones[zoneName];
                                const facilityCount = zone?.facilities?.length || defaultFacilityCount;
                                const zoneStyle = getZoneGradientStyle(index);

                                const isEditing = editingZone === zoneName;
                                // Truncate zone name to max 3 characters for display
                                const displayName = zoneName.length > 3 ? zoneName.substring(0, 3) : zoneName;

                                return (
                                  <div
                                    key={zoneName}
                                    className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-md p-1.5 text-white shadow-sm transition-all duration-200 ${!isEditing && 'hover:scale-105 hover:shadow-md cursor-pointer'} ${isEditing && 'ring-2 ring-white ring-offset-2'}`}
                                    style={zoneStyle}
                                    onClick={() => !isEditing && startEditingZone(zoneName)}
                                    title={zoneName}
                                  >
                                    <div className="text-[10px] font-semibold leading-tight">{displayName}</div>
                                    <div className="flex items-center justify-center">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editingValue}
                                          onChange={(e) => {
                                            const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                            if (numericValue === '' || (parseInt(numericValue) >= 0 && parseInt(numericValue) <= 50)) {
                                              setEditingValue(numericValue);
                                            }
                                          }}
                                          onKeyDown={handleEditKeyDown}
                                          onBlur={finishEditingZone}
                                          onFocus={(e) => e.target.select()}
                                          className="w-8 rounded border-2 border-white bg-white/90 text-center text-xs font-bold text-gray-800 outline-none"
                                          autoFocus
                                        />
                                      ) : (
                                        <span className="text-xs font-bold cursor-pointer" title="Double-click to edit">{facilityCount}</span>
                                      )}
                                    </div>
                                    {!isEditing && (
                                      <>
                                        <div className="absolute inset-0 rounded-lg bg-white/0 transition-all duration-200 group-hover:bg-white/10"></div>
                                        <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white/30 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex h-full min-h-[60px] items-center justify-center">
                              <p className="text-sm text-gray-500">Enter zone names to configure facilities</p>
                            </div>
                          )}
                        </div>

                        {/* Walking Time and Processing Time - One row */}
                        <div className="grid grid-cols-12 gap-3">
                          {/* Walking Time - 6/12 */}
                          <div className="col-span-6">
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                              <Clock className="h-4 w-4" />
                              Walking time
                              <div className={`h-2 w-2 rounded-full ${
                                editedProcess.travel_time_minutes != null && editedProcess.travel_time_minutes > 0 ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                            </label>
                            <div className="relative">
                              <Input
                                type="text"
                                value={editedProcess.travel_time_minutes || ''}
                                onChange={(e) => setEditedProcess({
                                  ...editedProcess,
                                  travel_time_minutes: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                                })}
                                placeholder="5"
                                className="w-full pr-10 text-center"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">min</span>
                            </div>
                          </div>

                          {/* Processing Time - 6/12 */}
                          <div className="col-span-6">
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                              <Clock className="h-4 w-4" />
                              Processing Time
                              <div className={`h-2 w-2 rounded-full ${
                                editedProcess.process_time_seconds != null && editedProcess.process_time_seconds > 0 ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                            </label>
                            <div className="relative">
                              <Input
                                type="text"
                                value={editedProcess.process_time_seconds || ''}
                                onChange={(e) => {
                                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                  const processTime = numericValue === '' ? undefined : Math.min(300, Math.max(0, parseInt(numericValue)));
                                  setEditedProcess({ ...editedProcess, process_time_seconds: processTime });
                                }}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                placeholder=""
                                className="w-full pr-10 text-center"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">sec</span>
                            </div>
                          </div>
                        </div>

                        {/* Entry Conditions - Separate row */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              <Filter className="mr-2 inline h-4 w-4" />
                              Entry Conditions
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTempSelectedCriteriaItems(selectedCriteriaItems);
                                setIsEntryConditionDialogOpen(true);
                              }}
                              disabled={!parquetMetadata || parquetMetadata.length === 0}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Condition
                            </Button>
                          </div>

                          {/* Selected Entry Conditions Container */}
                          <div className="min-h-[80px] max-h-[120px] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-3 overflow-y-auto">
                            {Object.keys(selectedCriteriaItems).filter(key => selectedCriteriaItems[key]).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  // Group selected items by field
                                  const groupedByField: Record<string, string[]> = {};
                                  Object.entries(selectedCriteriaItems)
                                    .filter(([_, isSelected]) => isSelected)
                                    .forEach(([itemKey]) => {
                                      const [field, value] = itemKey.split(':');
                                      if (!groupedByField[field]) {
                                        groupedByField[field] = [];
                                      }
                                      groupedByField[field].push(value);
                                    });

                                  return Object.entries(groupedByField).map(([field, values], index) => {
                                    const color = getBadgeColor(index);
                                    const displayValue = values.join(' | ');
                                    return (
                                      <Badge
                                        key={field}
                                        variant="outline"
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm h-fit transition-colors"
                                        style={color.style}
                                      >
                                        <span>{displayValue}</span>
                                        <button
                                          onClick={() => {
                                            const newItems = { ...selectedCriteriaItems };
                                            // Remove all items for this field
                                            values.forEach(value => {
                                              delete newItems[`${field}:${value}`];
                                            });
                                            handleCriteriaSelectionChange(newItems);
                                          }}
                                          className="ml-2 hover:text-red-500 transition-colors"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </Badge>
                                    );
                                  });
                                })()}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant="outline"
                                  className="px-3 py-1.5 text-sm h-fit bg-gray-100 text-gray-600 border border-gray-200"
                                >
                                  All
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                      </>
                    </div>
                  </div>

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="border-t px-6 py-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (isCreatingNew) {
                          // Create new process directly
                          if (editedProcess && editedProcess.name && Object.keys(editedProcess.zones).length > 0) {
                            if (onCreateProcess) {
                              // Format the process name for storage
                              const processToCreate = {
                                ...editedProcess,
                                name: formatProcessNameForStorage(editedProcess.name)
                              };
                              onCreateProcess(processToCreate);
                            }
                            setIsCreatingNew(false);
                            setEditedProcess(null);
                            setZoneNamesInput('');
                            setDefaultFacilityCount(null);
                            setSelectedCriteriaItems({});
                            toast({
                              title: 'Process Created',
                              description: 'New process has been added successfully.',
                            });
                          }
                        } else {
                          // Update existing process
                          handleUpdateProcess();
                        }
                      }}
                      disabled={
                        !editedProcess?.name ||
                        Object.keys(editedProcess?.zones || {}).length === 0 ||
                        !defaultFacilityCount || defaultFacilityCount <= 0 ||
                        editedProcess?.travel_time_minutes == null ||
                        editedProcess?.process_time_seconds == null || editedProcess?.process_time_seconds <= 0
                      }
                    >
                      {isCreatingNew ? 'Create' : 'Update'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 h-full">
                  <div className="text-center p-8">
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

          {/* Operating Schedule Editor - Only show when there are processes */}
          {processFlow.length > 0 && (
            <>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Entry Conditions Dialog */}
      <Dialog open={isEntryConditionDialogOpen} onOpenChange={setIsEntryConditionDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Entry Conditions
            </DialogTitle>
          </DialogHeader>

          {parquetMetadata && parquetMetadata.length > 0 ? (
            <div className="space-y-4">
              <FlightCriteriaSelector
                title=""
                icon={null}
                parquetMetadata={parquetMetadata}
                additionalMetadata={paxDemographics || paxDemographicsFromStore}
                onSelectionChange={setTempSelectedCriteriaItems}
                onClearAll={() => setTempSelectedCriteriaItems({})}
                initialSelectedItems={tempSelectedCriteriaItems}
              />

              {/* Dialog Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEntryConditionDialogOpen(false);
                    setTempSelectedCriteriaItems(selectedCriteriaItems);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleCriteriaSelectionChange(tempSelectedCriteriaItems);
                    setIsEntryConditionDialogOpen(false);
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Conditions
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">
                Parquet metadata is required to configure entry conditions. Please provide flight data to enable this feature.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
