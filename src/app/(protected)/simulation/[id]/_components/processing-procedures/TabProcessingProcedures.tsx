'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { EntryCondition } from '@/types/simulationTypes';
import { useToast } from '@/hooks/useToast';
import { useSimulationStore } from '../../_stores';
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import NavigationButton from '../shared/NavigationButton';
import ProcessConfigModal from './ProcessConfigModal';
import ProcessFlowDesigner from './ProcessFlowDesigner';

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
  const appliedFilterResult = useSimulationStore((s) => s.flight.appliedFilterResult);
  const setProcessFlow = useSimulationStore((s) => s.setProcessFlow);
  const setIsCompleted = useSimulationStore((s) => s.setProcessCompleted);
  const setFacilitiesForZone = useSimulationStore((s) => s.setFacilitiesForZone);
  const updateTravelTime = useSimulationStore((s) => s.updateTravelTime);

  // 🆕 parquet metadata 및 pax_demographics 추출
  const parquetMetadata = (appliedFilterResult as any)?.parquet_metadata || [];
  const paxDemographics = useSimulationStore((s) => s.passenger.pax_demographics);

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
    entryConditions?: EntryCondition[];
  } | null>(null);


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
      entryConditions: step.entry_conditions || [],
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
    entryConditions: EntryCondition[];
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
        entry_conditions: data.entryConditions,
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
          entry_conditions: data.entryConditions,
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

  // Direct update handler for inline editing
  const handleDirectUpdateProcess = (index: number, updatedProcess: any) => {
    const newProcessFlow = [...processFlow];
    newProcessFlow[index] = {
      ...updatedProcess,
      step: index, // Ensure step is correct
    };
    setProcessFlow(newProcessFlow);
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
      <ProcessFlowDesigner
        processFlow={processFlow as any}
        selectedProcessIndex={selectedProcessIndex}
        parquetMetadata={parquetMetadata}
        paxDemographics={paxDemographics}
        simulationId={simulationId}
        onProcessSelect={handleProcessSelect}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenEditModal={handleOpenEditModal}
        onRemoveProcess={removeProcedure}
        onUpdateProcess={handleDirectUpdateProcess}
      />

      {/* Process Configuration Modal */}
      <ProcessConfigModal
        isOpen={showProcessModal}
        onClose={handleCloseModal}
        processData={editingProcessData}
        onSave={handleSaveProcess}
        mode={modalMode}
        processFlow={processFlow} // 🆕 현재 프로세스 플로우 전달
        parquetMetadata={parquetMetadata} // 🆕 동적 조건 데이터 전달
      />

      {/* Navigation */}
      <div className="mt-8">
        <NavigationButton showPrevious={true} disabled={!isCompleted} />
      </div>
    </div>
  );
}
