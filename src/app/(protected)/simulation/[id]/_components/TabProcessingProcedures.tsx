'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, CheckSquare, ChevronDown, Plane, Plus, Route, Settings2, Trash2, Users } from 'lucide-react';
import { runSimulation } from '@/services/simulationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { formatProcessName } from '@/lib/utils';
import { useProcessingProceduresStore } from '../_stores';
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import NextButton from './NextButton';
import OperatingScheduleEditor from './OperatingScheduleEditor';
import ProcessConfigurationModal from './ProcessConfigurationModal';

// 시설 타입 정의
type FacilityItem = {
  name: string;
  isActive: boolean;
};

interface TabProcessingProceduresProps {
  simulationId: string;
  visible: boolean;
}

export default function TabProcessingProcedures({ simulationId, visible }: TabProcessingProceduresProps) {
  // 개별 store에서 필요한 데이터만 직접 가져오기
  const processFlow = useProcessingProceduresStore((s) => s.process_flow);
  const isCompleted = useProcessingProceduresStore((s) => s.isCompleted);
  const setProcessFlow = useProcessingProceduresStore((s) => s.setProcessFlow);
  const setIsCompleted = useProcessingProceduresStore((s) => s.setCompleted);
  const setFacilitiesForZone = useProcessingProceduresStore((s) => s.setFacilitiesForZone);
  const updateTravelTime = useProcessingProceduresStore((s) => s.updateTravelTime);

  const { toast } = useToast();

  // 더 이상 변환 함수가 필요없음 - zustand의 process_flow를 직접 사용

  // 더 이상 필요없음 - zustand의 process_flow를 직접 조작

  // zustand의 process_flow를 직접 사용
  const [entryType, setEntryType] = useState('Airline'); // 사용자가 선택 가능하도록 변경

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Accordion state for each process
  const [expandedProcesses, setExpandedProcesses] = useState<Set<number>>(new Set());
  
  // Modal state
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProcessData, setEditingProcessData] = useState<{
    index: number;
    name: string;
    facilities: string[];
    travelTime: number;
  } | null>(null);



  // 시뮬레이션 실행 상태
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);

  // Complete 조건 체크: 모든 시설에 operating_schedule이 설정되고 travel_time_minutes가 설정되어야 함
  const canComplete = useMemo(() => {
    if (processFlow.length === 0) return false;

    // 모든 프로세스의 travel_time_minutes가 설정되고, 모든 시설이 operating_schedule을 가져야 함
    return processFlow.every((process) => {
      // travel_time_minutes 체크 (0 이상이어야 함)
      const hasTravelTime = process.travel_time_minutes >= 0;

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

  // Facility가 설정된 프로세스가 있는지 체크
  const hasFacilitiesConfigured = useMemo(() => {
    return processFlow.some((process) =>
      Object.values(process.zones).some((zone: any) => zone.facilities && zone.facilities.length > 0)
    );
  }, [processFlow]);



  // 시설명 확장 함수 (범용적 처리: DG12_3-4-6-2~5 → DG12_3-4-6-2,DG12_3-4-6-3,DG12_3-4-6-4,DG12_3-4-6-5)
  const expandFacilityNames = (input: string): FacilityItem[] => {
    let expanded = input.toUpperCase(); // 모든 입력을 대문자로 변환

    // 범용적 숫자 범위 패턴 처리 - ~ 앞의 모든 부분을 prefix로 인식
    // 예: DG12_3-4-6-2~5 → DG12_3-4-6-2, DG12_3-4-6-3, DG12_3-4-6-4, DG12_3-4-6-5
    expanded = expanded.replace(/(.*?)(\d+)~(\d+)/g, (match, beforeLastNum, startNum, endNum) => {
      const start = parseInt(startNum);
      const end = parseInt(endNum);

      // 유효하지 않은 범위 (시작이 끝보다 큼)는 제거
      if (start > end) return '';

      const items: string[] = [];
      for (let i = start; i <= end; i++) {
        items.push(beforeLastNum + i);
      }
      return items.join(',');
    });

    // 알파벳 패턴 처리 (예: A~E, Counter_A~Counter_E)
    expanded = expanded.replace(/([A-Za-z]*)([A-Z])~([A-Z])/g, (match, prefix, start, end) => {
      const startCode = start.charCodeAt(0);
      const endCode = end.charCodeAt(0);

      if (startCode > endCode) return match; // 잘못된 범위는 그대로 반환

      const items: string[] = [];
      for (let i = startCode; i <= endCode; i++) {
        items.push(prefix + String.fromCharCode(i));
      }
      return items.join(',');
    });

    // 최종 시설 목록 생성 (모든 시설이 기본적으로 활성화됨)
    const facilities = expanded
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0)
      .map((name) => ({
        name,
        isActive: true,
      }));

    return facilities;
  };

  // Modal 열기/닫기 함수들
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingProcessData(null);
    setShowProcessModal(true);
  };

  const handleOpenEditModal = (index: number) => {
    const step = processFlow[index];
    setModalMode('edit');
    setEditingProcessData({
      index,
      name: step.name,
      facilities: Object.keys(step.zones || {}),
      travelTime: step.travel_time_minutes || 0,
    });
    setShowProcessModal(true);
  };

  const handleCloseModal = () => {
    setShowProcessModal(false);
    setEditingProcessData(null);
  };

  // Toggle accordion for individual process
  const toggleProcessExpanded = (index: number) => {
    setExpandedProcesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Modal에서 프로세스 저장
  const handleSaveProcess = (data: {
    name: string;
    facilities: FacilityItem[];
    travelTime: number;
  }) => {
    const activeFacilities = data.facilities.filter((f) => f.isActive).map((f) => f.name);

    if (modalMode === 'create') {
      // 새로운 프로세스 생성
      const newStep = {
        step: processFlow.length,
        name: data.name,
        travel_time_minutes: data.travelTime,
        entry_conditions: [],
        zones: {} as Record<string, any>,
      };

      // activeFacilities를 zones로 변환
      activeFacilities.forEach((facilityName: string) => {
        newStep.zones[facilityName] = {
          facilities: [],
        };
      });

      setProcessFlow([...processFlow, newStep]);
    } else {
      // 기존 프로세스 수정
      if (editingProcessData) {
        const newProcessFlow = [...processFlow];
        newProcessFlow[editingProcessData.index] = {
          ...newProcessFlow[editingProcessData.index],
          name: data.name,
          travel_time_minutes: data.travelTime,
          zones: {} as Record<string, any>,
        };

        // activeFacilities를 zones로 변환
        activeFacilities.forEach((facilityName: string) => {
          newProcessFlow[editingProcessData.index].zones[facilityName] = {
            facilities: [],
          };
        });

        setProcessFlow(newProcessFlow);
      }
    }
  };





  const removeProcedure = (index: number) => {
    const newProcessFlow = processFlow.filter((_, i) => i !== index);

    // step 재정렬 (0부터 시작)
    const reorderedProcessFlow = newProcessFlow.map((step, i) => ({
      ...step,
      step: i,
    }));

    setProcessFlow(reorderedProcessFlow);


  };

  // 드래그앤드롭 함수들
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 배열 재배열
    const newProcessFlow = [...processFlow];
    const [draggedItem] = newProcessFlow.splice(draggedIndex, 1);
    newProcessFlow.splice(dropIndex, 0, draggedItem);

    // step 재정렬 (0부터 시작)
    const reorderedProcessFlow = newProcessFlow.map((step, i) => ({
      ...step,
      step: i,
    }));

    setProcessFlow(reorderedProcessFlow);



    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 시뮬레이션 실행 함수
  const handleRunSimulation = async () => {
    if (!canComplete) {
      // 구체적인 미완료 사항 확인
      const missingTravelTimes = processFlow.some((p) => p.travel_time_minutes < 0);
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
      console.error('Simulation failed:', error);
      toast({
        title: 'Simulation Failed',
        description: error.response?.data?.message || 'Failed to start simulation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningSimulation(false);
    }
  };

  // visible이 false이면 null 반환 (모든 hooks 실행 후)
  if (!visible) return null;

  return (
    <div className="space-y-6 pt-8">


      {/* Process Flow Layout */}
      <div className="grid h-[600px] grid-cols-1 gap-6">
        {/* Process Flow - Full Width */}
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
          <CardContent className="h-[500px] space-y-4 overflow-y-auto">
            {/* Entry (Fixed) */}
            <div className="flex items-center gap-4 rounded-lg bg-primary/5 border border-primary/10 p-3 shadow-sm">
              <div className="flex items-center text-sm font-medium text-gray-900">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Entry
              </div>
              <div className="flex flex-1 justify-end">
                <Select value={entryType} onValueChange={setEntryType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select entry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airline">Airline</SelectItem>
                    <SelectItem value="International/Domestic">International/Domestic</SelectItem>
                    <SelectItem value="Passenger Type">Passenger Type</SelectItem>
                    <SelectItem value="Entry Point">Entry Point</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vertical arrow */}
            <div className="flex justify-center">
              <ChevronDown className="h-6 w-6 text-primary" />
            </div>

            {/* Procedures with Accordion */}
            {processFlow.map((step, index) => {
              const isExpanded = expandedProcesses.has(index);
              const isConfigured = Object.values(step.zones || {}).every((zone: any) => 
                zone.facilities && zone.facilities.length > 0
              );

              return (
                <div key={index}>
                  <div
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`group rounded-lg border bg-primary/5 border-primary/10 shadow-sm transition-all duration-300 ease-in-out ${draggedIndex === index ? 'border-primary/30 opacity-50' : ''} ${dragOverIndex === index && draggedIndex !== index ? 'border-primary/40 bg-primary/10' : ''} ${draggedIndex === null ? 'hover:border-primary/20 hover:shadow-md hover:bg-primary/10' : ''} `}
                  >
                    {/* Compact Header - Always Visible */}
                    <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleProcessExpanded(index)}>
                      {/* Left Side - Basic Info */}
                      <div className="flex items-center space-x-3">
                        <div
                          className="cursor-move text-primary hover:text-primary/80"
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {formatProcessName(step.name)}
                          </h3>
                          <div className="flex items-center space-x-2 text-xs text-gray-900">
                            <span>{Object.keys(step.zones || {}).length} zones</span>
                            <span>•</span>
                            <span>{step.travel_time_minutes || 0} min</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${
                                isConfigured ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              <span>{isConfigured ? 'Configured' : 'Setup needed'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Toggle & Actions */}
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-primary hover:text-primary/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProcessExpanded(index);
                          }}
                          title={isExpanded ? "Collapse details" : "Expand details"}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 text-primary hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(index);
                          }}
                          title="Edit this process"
                        >
                          <Settings2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProcedure(index);
                          }}
                          title="Remove this process"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details - Smooth Slide Animation */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div 
                        className="border-t border-gray-100 bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-all duration-300 ease-in-out"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(index);
                        }}
                        title="Click to edit this process"
                      >
                        <div className="space-y-3">
                          {/* Travel Time Detail */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Travel Time:</span>
                            <span className="text-sm text-gray-900 font-medium">
                              {step.travel_time_minutes || 0} minutes
                            </span>
                          </div>

                          {/* Zone Details */}
                          {Object.keys(step.zones || {}).length > 0 && (
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-gray-700">Zone Details:</span>
                              <div className="flex flex-wrap gap-1">
                                {Object.keys(step.zones || {}).map((zoneName) => (
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

                          {/* Configuration Status Detail */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${
                                isConfigured ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              <span className="text-sm text-gray-700">
                                {isConfigured ? 'All facilities configured' : 'Requires facility setup in Operating Schedule'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vertical arrow after each procedure */}
                  <div className="flex justify-center py-2">
                    <ChevronDown className="h-6 w-6 text-primary" />
                  </div>
                </div>
              );
            })}

            {/* Add Process Button */}
            <Button
              variant="outline"
              className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-primary/30 p-4 text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
              onClick={handleOpenCreateModal}
            >
              <Plus className="h-5 w-5" />
              Add Process
            </Button>

            {/* Vertical arrow to Gate */}
            <div className="flex justify-center">
              <ChevronDown className="h-6 w-6 text-primary" />
            </div>

            {/* Gate (Fixed) */}
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/10 p-3 shadow-sm">
              <div className="flex items-center text-sm font-medium text-gray-900">
                <Plane className="mr-2 h-5 w-5 text-primary" />
                Gate
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Configuration Modal */}
      <ProcessConfigurationModal
        isOpen={showProcessModal}
        onClose={handleCloseModal}
        processData={editingProcessData}
        onSave={handleSaveProcess}
        mode={modalMode}
      />

      {/* Operating Schedule Editor - Facility가 설정되면 자동 표시 */}
      {hasFacilitiesConfigured && <OperatingScheduleEditor processFlow={processFlow} />}

      {/* Navigation */}
      <div className="mt-8">
        <NextButton showPrevious={true} disabled={!isCompleted} />
      </div>

      {/* Run Simulation Button */}
      {canComplete && (
        <div className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Plane className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">Ready to Run Simulation</h3>
                  <p className="text-sm text-muted-foreground">
                    All operating schedules are configured. Start your simulation now!
                  </p>
                </div>
                <Button onClick={handleRunSimulation} disabled={isRunningSimulation}>
                  {isRunningSimulation ? (
                    <>
                      <Settings2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Plane className="mr-2 h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Complete Setup Button - 가장 아래로 이동 */}
      <div className="mt-6 space-y-3">
        {/* 진행상황 표시 */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="mb-2 text-sm font-medium">Setup Progress</div>
          <div className="space-y-2 text-xs">
            <div
              className={`flex items-center gap-2 ${processFlow.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {processFlow.length > 0 ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded border" />
              )}
              Process Flow Configured ({processFlow.length} processes)
            </div>
            <div
              className={`flex items-center gap-2 ${hasFacilitiesConfigured ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {hasFacilitiesConfigured ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded border" />
              )}
              Facilities Configured
            </div>
            <div
              className={`flex items-center gap-2 ${
                processFlow.every((p) => p.travel_time_minutes >= 0) && processFlow.length > 0
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {processFlow.every((p) => p.travel_time_minutes >= 0) && processFlow.length > 0 ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded border" />
              )}
              Travel Times Set
            </div>
            <div className={`flex items-center gap-2 ${canComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
              {canComplete ? <CheckSquare className="h-3 w-3" /> : <div className="h-3 w-3 rounded border" />}
              Operating Schedules Set
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIsCompleted(true)} disabled={!canComplete}>
            {isCompleted ? (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              <>{canComplete ? 'Complete Setup' : 'Complete Operating Schedules to Continue'}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
