'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CheckSquare, ChevronDown, ChevronRight, Plane, Plus, Route, Settings2, Trash2, Users } from 'lucide-react';
import { runSimulation } from '@/services/simulationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

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

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Selected process for detail view (instead of accordion)
  const [selectedProcessIndex, setSelectedProcessIndex] = useState<number | null>(null);
  
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

  // Zones가 설정된 프로세스가 있는지 체크 (zustand 기준)
  const hasZonesConfigured = useMemo(() => {
    return processFlow.some((process) =>
      process.zones && Object.keys(process.zones).length > 0
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

  // Select process for detail view
  const handleProcessSelect = (index: number) => {
    setSelectedProcessIndex(prev => prev === index ? null : index);
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

  // 수평 드래그앤드롭 함수들
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    // 수평 드래그에서는 마우스 x 위치를 기준으로 drop 위치 결정
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const mouseX = e.clientX;
    
    // 마우스가 요소의 왼쪽 절반에 있으면 앞에 삽입, 오른쪽 절반에 있으면 뒤에 삽입
    if (mouseX < midpoint && index > 0) {
      setDragOverIndex(index - 1);
    } else {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 실제 drop 위치 계산 (수평 기준)
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const mouseX = e.clientX;
    
    let actualDropIndex = dropIndex;
    if (mouseX < midpoint && dropIndex > 0) {
      actualDropIndex = dropIndex;
    } else if (mouseX >= midpoint) {
      actualDropIndex = dropIndex + 1;
    }

    // 드래그된 요소보다 앞에 있는 요소들의 인덱스 조정
    if (actualDropIndex > draggedIndex) {
      actualDropIndex--;
    }

    if (actualDropIndex === draggedIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 배열 재배열
    const newProcessFlow = [...processFlow];
    const [draggedItem] = newProcessFlow.splice(draggedIndex, 1);
    newProcessFlow.splice(actualDropIndex, 0, draggedItem);

    // step 재정렬 (0부터 시작)
    const reorderedProcessFlow = newProcessFlow.map((step, i) => ({
      ...step,
      step: i,
    }));

    setProcessFlow(reorderedProcessFlow);

    // 선택된 인덱스 업데이트
    if (selectedProcessIndex === draggedIndex) {
      setSelectedProcessIndex(actualDropIndex);
    } else if (selectedProcessIndex !== null) {
      if (draggedIndex < selectedProcessIndex && actualDropIndex >= selectedProcessIndex) {
        setSelectedProcessIndex(selectedProcessIndex - 1);
      } else if (draggedIndex > selectedProcessIndex && actualDropIndex <= selectedProcessIndex) {
        setSelectedProcessIndex(selectedProcessIndex + 1);
      }
    }

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

  // 첫 번째 프로세스를 기본으로 선택
  useEffect(() => {
    if (processFlow.length > 0 && selectedProcessIndex === null) {
      setSelectedProcessIndex(0);
    } else if (processFlow.length === 0) {
      setSelectedProcessIndex(null);
    }
  }, [processFlow.length, selectedProcessIndex]);

  // visible이 false이면 null 반환 (모든 hooks 실행 후)
  if (!visible) return null;

  return (
    <div className="space-y-6 pt-8">


      {/* Horizontal Process Flow Layout */}
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
                  <React.Fragment key={index}>
                    {/* Travel Time + Arrow */}
                    <div className="flex flex-col items-center flex-shrink-0 relative">
                      {(step.travel_time_minutes ?? 0) > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full whitespace-nowrap mb-1">
                          {step.travel_time_minutes}min
                        </span>
                      )}
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </div>

                    {/* Process Card */}
                    <div
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`group relative rounded-lg border cursor-pointer shadow-sm transition-all duration-300 ease-in-out min-w-fit flex-shrink-0 ${
                        isSelected 
                          ? 'bg-primary/15 border-primary/40 shadow-lg ring-2 ring-primary/20' 
                          : 'bg-primary/5 border-primary/10'
                      } ${
                        draggedIndex === index ? 'opacity-50' : ''
                      } ${
                        dragOverIndex === index && draggedIndex !== index ? 'border-primary/40 bg-primary/15' : ''
                      } ${
                        draggedIndex === null && !isSelected ? 'hover:border-primary/20 hover:shadow-md hover:bg-primary/10' : ''
                      }`}
                      onClick={() => handleProcessSelect(index)}
                    >
                      <div className="flex items-center gap-2 px-3 py-2">
                        {/* Drag Handle */}
                        <div
                          className="cursor-move text-primary hover:text-primary/80"
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => e.stopPropagation()}
                          title="Drag to reorder"
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
                              removeProcedure(index);
                            }}
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
                onClick={handleOpenCreateModal}
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
                      onClick={() => handleOpenEditModal(selectedProcessIndex)}
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
                        onClick={handleOpenCreateModal}
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

      {/* Process Configuration Modal */}
      <ProcessConfigurationModal
        isOpen={showProcessModal}
        onClose={handleCloseModal}
        processData={editingProcessData}
        onSave={handleSaveProcess}
        mode={modalMode}
      />

      {/* Operating Schedule Editor - Zones가 설정되면 자동 표시 (zustand 기준) */}
      {hasZonesConfigured && <OperatingScheduleEditor processFlow={processFlow} />}

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
              className={`flex items-center gap-2 ${hasZonesConfigured ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {hasZonesConfigured ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded border" />
              )}
              Zones Configured
            </div>
            <div
              className={`flex items-center gap-2 ${
                processFlow.every((p) => (p.travel_time_minutes ?? 0) >= 0) && processFlow.length > 0
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {processFlow.every((p) => (p.travel_time_minutes ?? 0) >= 0) && processFlow.length > 0 ? (
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
