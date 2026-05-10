"use client";

import React, { useEffect, useMemo, useState } from "react";
import { EntryCondition, APIRequestLog } from "@/types/simulationTypes";
import { SimulationTabProps, FacilityItem } from "../types";
import { useToast } from "@/hooks/useToast";
import { useSimulationStore } from "../../_stores";
// useTabReset 제거 - 직접 리셋 로직으로 단순화
import ProcessConfigModal from "./ProcessConfigModal";
import ProcessFlowDesigner from "./ProcessFlowDesigner";
import FacilityPresetModal from "./FacilityPresetModal";
import { remapPresetDates } from "./helpers";

interface TabProcessingProceduresProps extends SimulationTabProps {}

export default function TabProcessingProcedures({
  simulationId,
  visible,
  apiRequestLog,
  setApiRequestLog,
}: TabProcessingProceduresProps) {
  // Selected process for detail view
  const [selectedProcessIndex, setSelectedProcessIndex] = useState<
    number | null
  >(null);
  // 🆕 통합 Store에서 직접 데이터 가져오기
  const processFlow = useSimulationStore((s) => s.process_flow);
  const scenarioDate = useSimulationStore((s) => s.context.date);
  // Process completed state removed as it's no longer needed
  const isCompleted = false; // Always false as step3Completed is removed
  const appliedFilterResult = useSimulationStore(
    (s) => s.flight.appliedFilterResult
  );
  const setProcessFlow = useSimulationStore((s) => s.setProcessFlow);
  const setIsCompleted = useSimulationStore((s) => s.setProcessCompleted);
  const setFacilitiesForZone = useSimulationStore(
    (s) => s.setFacilitiesForZone
  );
  const updateTravelTime = useSimulationStore((s) => s.updateTravelTime);
  const updateProcessTimeForAllZones = useSimulationStore(
    (s) => s.updateProcessTimeForAllZones
  );

  // 🆕 parquet metadata 및 pax_demographics 추출
  const parquetMetadata = (appliedFilterResult as any)?.parquet_metadata || [];
  const paxDemographics = useSimulationStore(
    (s) => s.passenger.pax_demographics
  );

  const { toast } = useToast();


  // 더 이상 변환 함수가 필요없음 - zustand의 process_flow를 직접 사용

  // 더 이상 필요없음 - zustand의 process_flow를 직접 조작

  // zustand의 process_flow를 직접 사용

  // Preset modal state
  const [showPresetModal, setShowPresetModal] = useState(false);

  // Modal state
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingProcessData, setEditingProcessData] = useState<{
    index: number;
    name: string;
    facilities: string[];
    travelTime: number;
    entryConditions?: EntryCondition[];
  } | null>(null);

  // Zones가 설정된 프로세스가 있는지 체크 (zustand 기준)
  const hasZonesConfigured = useMemo(() => {
    return processFlow.some(
      (process) => process.zones && Object.keys(process.zones).length > 0
    );
  }, [processFlow]);

  // Modal 열기/닫기 함수들
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingProcessData(null);
    setShowProcessModal(true);
  };

  const handleCloseModal = () => {
    setShowProcessModal(false);
    setEditingProcessData(null);
  };

  // Name 정규화 함수 (특수문자 → 언더스코어, 소문자 변환)
  const normalizeProcessName = (name: string): string => {
    return name
      .toLowerCase() // 소문자 변환
      .replace(/[^a-z0-9]/g, "_") // 영문, 숫자 외 모든 문자를 언더스코어로
      .replace(/_+/g, "_") // 연속된 언더스코어를 하나로
      .replace(/^_|_$/g, ""); // 앞뒤 언더스코어 제거
  };

  // Modal에서 프로세스 저장
  const handleSaveProcess = (data: {
    name: string;
    facilities: FacilityItem[];
    defaultFacilityCount: number;
    zoneFacilityCounts: Record<string, number>;
  }) => {
    const activeFacilities = data.facilities
      .filter((f) => f.isActive)
      .map((f) => f.name);
    const normalizedName = normalizeProcessName(data.name);

    if (modalMode === "create") {
      // 새로운 프로세스 생성 - 올바른 키 순서
      const newStep = {
        step: processFlow.length,
        name: normalizedName, // 정규화된 이름 사용
        travel_time_minutes: 0,
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
        // 시설 개수 즉시 설정 - process_time_seconds는 undefined로 전달
        Object.entries(data.zoneFacilityCounts!).forEach(
          ([zoneName, count]) => {
            if (activeFacilities.includes(zoneName)) {
              setFacilitiesForZone(processIndex, zoneName, count);
            }
          }
        );
      }
    } else {
      // 기존 프로세스 수정 - 올바른 키 순서
      if (editingProcessData) {
        const newProcessFlow = [...processFlow];
        newProcessFlow[editingProcessData.index] = {
          step: editingProcessData.index,
          name: normalizedName, // 정규화된 이름 사용
          travel_time_minutes:
            newProcessFlow[editingProcessData.index].travel_time_minutes || 0,
          entry_conditions:
            newProcessFlow[editingProcessData.index].entry_conditions || [],
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
            Object.entries(data.zoneFacilityCounts!).forEach(
              ([zoneName, count]) => {
                if (activeFacilities.includes(zoneName)) {
                  setFacilitiesForZone(
                    editingProcessData.index,
                    zoneName,
                    count
                  );
                }
              }
            );
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

  // Handle reordering processes via drag and drop
  const handleReorderProcesses = (newProcessFlow: any[]) => {
    // Ensure step numbers are correct
    const updatedFlow = newProcessFlow.map((process, index) => ({
      ...process,
      step: index, // 0-based indexing
    }));
    setProcessFlow(updatedFlow);
  };

  // Handle direct process creation (bypassing modal)
  const handleDirectCreateProcess = (newProcess: any) => {
    const normalizedName = normalizeProcessName(newProcess.name);
    const processToAdd = {
      ...newProcess,
      name: normalizedName,
      step: processFlow.length,
    };

    const updatedProcessFlow = [...processFlow, processToAdd];
    setProcessFlow(updatedProcessFlow);

    // Set facilities for each zone if they exist
    if (newProcess.zones) {
      const processIndex = processFlow.length;
      // Get process_time_seconds from newProcess
      const processTimeSeconds = newProcess.process_time_seconds;

      Object.entries(newProcess.zones).forEach(
        ([zoneName, zone]: [string, any]) => {
          if (zone.facilities && zone.facilities.length > 0) {
            // Always pass processTimeSeconds, defaulting to 0 if not provided
            setFacilitiesForZone(
              processIndex,
              zoneName,
              zone.facilities.length,
              processTimeSeconds || 0
            );
          }
        }
      );
    }
  };

  // visible이 false이면 null 반환 (모든 hooks 실행 후)
  if (!visible) return null;

  return (
    <div className="space-y-6 pt-8">
      {/* Process Flow Chart */}
      <ProcessFlowDesigner
        processFlow={processFlow as any}
        selectedProcessIndex={selectedProcessIndex}
        onProcessSelect={setSelectedProcessIndex}
        parquetMetadata={parquetMetadata}
        paxDemographics={paxDemographics}
        simulationId={simulationId}
        apiRequestLog={apiRequestLog}
        setApiRequestLog={setApiRequestLog}
        onOpenCreateModal={handleOpenCreateModal}
        onRemoveProcess={removeProcedure}
        onReorderProcesses={handleReorderProcesses}
        setProcessFlow={setProcessFlow}
        onCreateProcess={handleDirectCreateProcess}
        onOpenPresetModal={() => setShowPresetModal(true)}
      />

      {/* Process Configuration Modal */}
      <ProcessConfigModal
        isOpen={showProcessModal}
        onClose={handleCloseModal}
        processData={editingProcessData}
        onSave={handleSaveProcess}
        mode={modalMode}
        processFlow={processFlow}
        parquetMetadata={parquetMetadata}
      />

      {/* Facility Preset Modal */}
      <FacilityPresetModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        currentProcessFlow={processFlow as any}
        referenceDate={scenarioDate}
        onLoadPreset={(newFlow, presetReferenceDate) => {
          // presetReferenceDate → scenarioDate 로 날짜만 shift (조건값/process_time 등 그대로 유지)
          const shifted = remapPresetDates(newFlow, scenarioDate, presetReferenceDate, null);
          setProcessFlow(shifted as any);
          setSelectedProcessIndex(null);
        }}
      />
    </div>
  );
}
