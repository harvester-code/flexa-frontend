'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Plane, Settings2 } from 'lucide-react';
import { runSimulation } from '@/services/simulationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';
import { useSimulationStore } from '../_stores';
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import NextButton from './NextButton';
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
  // 🆕 통합 Store에서 직접 데이터 가져오기
  const processFlow = useSimulationStore((s) => s.process_flow);
  const isCompleted = useSimulationStore((s) => s.workflow.step3Completed);
  const setProcessFlow = useSimulationStore((s) => s.setProcessFlow);
  const setIsCompleted = useSimulationStore((s) => s.setProcessCompleted);
  const setFacilitiesForZone = useSimulationStore((s) => s.setFacilitiesForZone);
  const updateTravelTime = useSimulationStore((s) => s.updateTravelTime);

  const { toast } = useToast();

  // 더 이상 변환 함수가 필요없음 - zustand의 process_flow를 직접 사용

  // 더 이상 필요없음 - zustand의 process_flow를 직접 조작

  // zustand의 process_flow를 직접 사용


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
    return processFlow.some((process) => process.zones && Object.keys(process.zones).length > 0);
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
    setSelectedProcessIndex((prev) => (prev === index ? null : index));
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
    zoneFacilityCounts?: Record<string, number>;
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

      const updatedProcessFlow = [...processFlow, newStep];
      setProcessFlow(updatedProcessFlow);

      // 🆕 Zone별 시설 개수 자동 설정
      if (data.zoneFacilityCounts) {
        const processIndex = processFlow.length; // 새로 추가된 프로세스의 인덱스
        // 시설 개수 즉시 설정
        Object.entries(data.zoneFacilityCounts!).forEach(([zoneName, count]) => {
          if (activeFacilities.includes(zoneName)) {
            setFacilitiesForZone(processIndex, zoneName, count);
          }
        });
      }
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

        // 🆕 편집 모드에서도 Zone별 시설 개수 업데이트
        if (data.zoneFacilityCounts) {
          setTimeout(() => {
            Object.entries(data.zoneFacilityCounts!).forEach(([zoneName, count]) => {
              if (activeFacilities.includes(zoneName)) {
                setFacilitiesForZone(editingProcessData.index, zoneName, count);
              }
            });
          }, 100);
        }
      }
    }

    handleCloseModal();
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
          onProcessSelect={handleProcessSelect}
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
        processFlow={processFlow} // 🆕 현재 프로세스 플로우 전달
      />

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
    </div>
  );
}
