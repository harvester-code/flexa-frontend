'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Plane, Settings2 } from 'lucide-react';
import { runSimulation } from '@/services/simulationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import { useToast } from '@/hooks/useToast';
import { useProcessingProceduresStore } from '../_stores';
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import NextButton from './NextButton';
import OperatingScheduleEditor from './OperatingScheduleEditor';
import ProcessConfigurationModal from './ProcessConfigurationModal';
import ProcessFlowChart from './ProcessFlowChart';



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

  // Name 정규화 함수 (특수문자 → 언더스코어, 소문자 변환)
  const normalizeProcessName = (name: string): string => {
    return name
      .toLowerCase() // 소문자 변환
      .replace(/[^a-z0-9]/g, '_') // 영문, 숫자 외 모든 문자를 언더스코어로
      .replace(/_+/g, '_') // 연속된 언더스코어를 하나로
      .replace(/^_|_$/g, ''); // 앞뒤 언더스코어 제거
  };

  // Modal에서 프로세스 저장
  const handleSaveProcess = (data: {
    name: string;
    facilities: FacilityItem[];
    travelTime: number;
  }) => {
    const activeFacilities = data.facilities.filter((f) => f.isActive).map((f) => f.name);
    const normalizedName = normalizeProcessName(data.name);

    if (modalMode === 'create') {
      // 새로운 프로세스 생성
      const newStep = {
        step: processFlow.length,
        name: normalizedName, // 정규화된 이름 사용
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
          name: normalizedName, // 정규화된 이름 사용
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

  // 간단하고 안정적인 드래그앤드롭 함수들
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 컨테이너를 완전히 벗어날 때만 dragOverIndex 초기화
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 배열 재배열 - 간단한 로직
    const newProcessFlow = [...processFlow];
    const [draggedItem] = newProcessFlow.splice(draggedIndex, 1);
    
    // 드래그된 아이템을 새 위치에 삽입
    newProcessFlow.splice(dropIndex, 0, draggedItem);

    // step 재정렬 (0부터 시작)
    const reorderedProcessFlow = newProcessFlow.map((step, i) => ({
      ...step,
      step: i,
    }));

    setProcessFlow(reorderedProcessFlow);

    // 선택된 인덱스 업데이트
    if (selectedProcessIndex === draggedIndex) {
      setSelectedProcessIndex(dropIndex);
    } else if (selectedProcessIndex !== null) {
      // 선택된 아이템의 새로운 인덱스 계산
      if (selectedProcessIndex > draggedIndex && selectedProcessIndex <= dropIndex) {
        setSelectedProcessIndex(selectedProcessIndex - 1);
      } else if (selectedProcessIndex < draggedIndex && selectedProcessIndex >= dropIndex) {
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


      {/* Process Flow Chart */}
      <ProcessFlowChart
        processFlow={processFlow as any}
        selectedProcessIndex={selectedProcessIndex}
        draggedIndex={draggedIndex}
        dragOverIndex={dragOverIndex}
        onProcessSelect={handleProcessSelect}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenEditModal={handleOpenEditModal}
        onRemoveProcess={removeProcedure}
      />

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
