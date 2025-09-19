'use client';

import React, { Suspense, use, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { Save, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { APIRequestLog } from '@/types/simulationTypes';
import { deleteScenarioMetadata, saveScenarioMetadata } from '@/services/simulationService';
import TheContentHeader from '@/components/TheContentHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { timeToRelativeTime } from '@/lib/utils';
import SimulationLoading from '../_components/SimulationLoading';
import JSONDebugViewer from './_components/shared/DebugViewer';
import TabDefault from './_components/shared/TabDefault';
import TabFlightSchedule from './_components/flight-schedule/TabFlightSchedule';
import TabPassengerSchedule from './_components/passenger-schedule/TabPassengerSchedule';
import TabProcessingProcedures from './_components/processing-procedures/TabProcessingProcedures';
import { useLoadScenarioData } from './_hooks/useLoadScenarioData';
import { useScenarioProfileStore, useSimulationStore } from './_stores';

const tabs: { text: string; number: number }[] = [
  { text: 'Flight Schedule', number: 0 },
  { text: 'Passenger Schedule', number: 1 },
  { text: 'Processing Procedures', number: 2 },
];

// Component that uses useSearchParams for scenario name from URL
function ScenarioNameDisplay({ simulationId, scenarioName }: { simulationId: string; scenarioName: string }) {
  const searchParams = useSearchParams();
  const urlScenarioName = searchParams.get('name');

  return <dd>{urlScenarioName || scenarioName || `Scenario ${simulationId}`}</dd>;
}

export default function SimulationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();

  // ✅ simulationId를 맨 위로 이동 (다른 훅들보다 먼저)
  const simulationId = use(params).id;

  // 개별 store에서 필요한 데이터만 직접 가져오기
  const currentScenarioTab = useScenarioProfileStore((s) => s.currentScenarioTab);
  const scenarioName = useScenarioProfileStore((s) => s.scenarioName);
  const scenarioHistory = useScenarioProfileStore((s) => s.scenarioHistory);
  const setCurrentScenarioTab = useScenarioProfileStore((s) => s.setCurrentScenarioTab);
  const loadScenarioProfileMetadata = useScenarioProfileStore((s) => s.loadMetadata);

  const flightScheduleCompleted = useSimulationStore((s) => s.workflow.step1Completed);
  const passengerScheduleCompleted = useSimulationStore((s) => s.workflow.step2Completed);

  // S3 메타데이터를 모든 modular stores에 로드하는 함수
  const loadCompleteS3Metadata = useCallback((data: any) => {
    try {
      // 🔧 새로운 통합 Store 구조에 맞게 수정
      const metadata = data.metadata || {};
      const tabs = metadata.tabs || {};

      // 🎯 S3에서 받은 데이터를 Zustand에 통째로 갈아끼우기
      if (metadata.context || metadata.flight || metadata.passenger || metadata.process_flow || metadata.workflow) {
        // 현재 Store의 액션들만 보존하고 나머지는 S3 데이터로 교체
        const currentStore = useSimulationStore.getState();

        // S3 데이터 + 액션들 조합
        const newState = {
          // 데이터는 S3에서 받은 것으로 덮어쓰기
          ...metadata,

          // scenarioId는 현재 URL 값으로 보정
          context: {
            ...metadata.context,
            scenarioId: simulationId,
          },

          // 액션들은 현재 store에서 그대로 유지
          resetStore: currentStore.resetStore,
          setScenarioId: currentStore.setScenarioId,
          setAirport: currentStore.setAirport,
          setDate: currentStore.setDate,
          setLastSavedAt: currentStore.setLastSavedAt,
          setFlightFilters: currentStore.setFlightFilters,
          resetFlightData: currentStore.resetFlightData,
          setSelectedConditions: currentStore.setSelectedConditions,
          setFlightType: currentStore.setFlightType,
          addCondition: currentStore.addCondition,
          removeCondition: currentStore.removeCondition,
          updateConditionValues: currentStore.updateConditionValues,
          toggleConditionValue: currentStore.toggleConditionValue,
          clearAllConditions: currentStore.clearAllConditions,
          setAppliedFilterResult: currentStore.setAppliedFilterResult,
          setCurrentStep: currentStore.setCurrentStep,
          setStepCompleted: currentStore.setStepCompleted,
          updateAvailableSteps: currentStore.updateAvailableSteps,
          setSettings: currentStore.setSettings,
          setPaxDemographics: currentStore.setPaxDemographics,
          setNationalityValues: currentStore.setNationalityValues,
          setProfileValues: currentStore.setProfileValues,
          addNationalityRule: currentStore.addNationalityRule,
          addProfileRule: currentStore.addProfileRule,
          removeNationalityRule: currentStore.removeNationalityRule,
          removeProfileRule: currentStore.removeProfileRule,
          updateNationalityDistribution: currentStore.updateNationalityDistribution,
          updateProfileDistribution: currentStore.updateProfileDistribution,
          reorderPaxDemographics: currentStore.reorderPaxDemographics,
          setPaxArrivalPatternRules: currentStore.setPaxArrivalPatternRules,
          addPaxArrivalPatternRule: currentStore.addPaxArrivalPatternRule,
          updatePaxArrivalPatternRule: currentStore.updatePaxArrivalPatternRule,
          removePaxArrivalPatternRule: currentStore.removePaxArrivalPatternRule,
          resetPassenger: currentStore.resetPassenger,
          loadPassengerMetadata: currentStore.loadPassengerMetadata,
          setProcessFlow: currentStore.setProcessFlow,
          convertFromProcedures: currentStore.convertFromProcedures,
          setProcessCompleted: currentStore.setProcessCompleted,
          resetProcessFlow: currentStore.resetProcessFlow,
          loadProcessMetadata: currentStore.loadProcessMetadata,
          setFacilitiesForZone: currentStore.setFacilitiesForZone,
          updateOperatingSchedule: currentStore.updateOperatingSchedule,
          toggleFacilityTimeBlock: currentStore.toggleFacilityTimeBlock,
          updateTravelTime: currentStore.updateTravelTime,
        };

        // 🚀 한 방에 갈아끼우기
        useSimulationStore.setState(newState);
      }

      // 🚧 Legacy tabs 구조 지원 (하위 호환성)
      else if (tabs.passengerSchedule || tabs.processingProcedures) {
        if (tabs.passengerSchedule) {
          useSimulationStore.getState().loadPassengerMetadata(tabs.passengerSchedule);
        }

        if (tabs.processingProcedures) {
          useSimulationStore.getState().loadProcessMetadata(tabs.processingProcedures);
        }
      } else {
      }
    } catch (error) {}
  }, []);

  // 탭 접근성 계산
  const getAvailableTabs = () => {
    const completedStates = [flightScheduleCompleted, passengerScheduleCompleted];

    // Flight Schedule 탭은 항상 접근 가능 + 완료된 탭까지 + 다음 탭 하나까지 활성화
    const lastCompletedIndex = completedStates.lastIndexOf(true);
    // 최소 0, 최대 tabs.length - 1 (모든 탭 접근 가능)
    // 완료된 탭이 없으면 첫 번째 탭(0)만, 모두 완료되면 모든 탭 접근 가능
    return Math.max(0, Math.min(lastCompletedIndex + 2, tabs.length - 1));
  };

  // 🆕 통합 Store에서 메타데이터 수집용 함수
  const getCompleteMetadata = useCallback((scenarioId: string) => {
    try {
      // 통합 Store에서 전체 상태 가져오기
      const simulationState = useSimulationStore.getState();

      // 현재 시간으로 savedAt 업데이트
      const metadata = {
        ...simulationState,
        savedAt: new Date().toISOString(),
        // 날짜가 비어있으면 오늘 날짜로 설정
        context: {
          ...simulationState.context,
          date: simulationState.context.date || new Date().toISOString().split('T')[0],
        },
      };

      return metadata;
    } catch (error) {
      const currentDate = new Date().toISOString().split('T')[0];
      return {
        context: {
          scenarioId: scenarioId,
          airport: '',
          date: currentDate,
          lastSavedAt: null,
        },
        flight: {
          total_flights: null,
          airlines: null,
          filters: null,
          selectedConditions: null,
          appliedFilterResult: null,
        },
        passenger: { settings: {}, demographics: {}, arrivalPatterns: {}, showUpResults: null },
        process: { flow: [] },
        workflow: {
          currentStep: 1,
          step1Completed: false,
          step2Completed: false,
          availableSteps: [1],
        },
        savedAt: new Date().toISOString(),
      };
    }
  }, []);

  const [isInitialized, setIsInitialized] = useState(false);
  const [apiRequestLog, setApiRequestLog] = useState<APIRequestLog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🆕 통합 Store 액션들
  const setLastSavedAt = useSimulationStore((s) => s.setLastSavedAt);
  const setDate = useSimulationStore((s) => s.setDate);
  const setCurrentStep = useSimulationStore((s) => s.setCurrentStep);
  const currentDate = useSimulationStore((s) => s.context.date);

  // ✅ 클라이언트 측에서만 날짜 초기화 (hydration mismatch 방지)
  useEffect(() => {
    if (!currentDate) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [currentDate, setDate]);

  // 🔧 초기화 완료 후 workflow 기반 초기 탭 설정 (한 번만 실행)
  useEffect(() => {
    if (isInitialized) {
      const workflow = useSimulationStore.getState().workflow;
      const availableSteps = workflow.availableSteps || [1];

      // availableSteps의 마지막(최고) 단계로 초기 탭 설정
      const lastAvailableStep = Math.max(...availableSteps);
      const targetTab = lastAvailableStep - 1; // 0-based 탭 인덱스

      // 현재 탭이 기본값(0)이고, 마지막 사용 가능한 탭이 다르면 업데이트
      if (currentScenarioTab === 0 && targetTab !== 0 && targetTab <= 2) {
        useScenarioProfileStore.getState().setCurrentScenarioTab(targetTab);
      }
    }
  }, [isInitialized]); // 🔧 isInitialized만 dependency로 유지 (안정성 확보)

  // 🔧 탭 변경 시 currentStep 동기화 (별도 useEffect)
  useEffect(() => {
    if (isInitialized) {
      const newStep = currentScenarioTab + 1;
      useSimulationStore.getState().setCurrentStep(newStep);
    }
  }, [currentScenarioTab, isInitialized]); // 🔧 함수 호출을 getState()로 안정화

  // 임시저장 함수
  const handleTempSave = async () => {
    try {
      setIsSaving(true);

      const completeMetadata = getCompleteMetadata(simulationId);

      const { data: saveResult } = await saveScenarioMetadata(simulationId, completeMetadata);

      // 🆕 저장 성공 시 lastSavedAt 업데이트
      const savedTimestamp = new Date().toISOString();
      setLastSavedAt(savedTimestamp);

      toast({
        title: '🆕 통합 Store 저장 완료',
        description: `시나리오 메타데이터가 성공적으로 저장되었습니다.\n저장 위치: ${saveResult.s3_key}\n저장 시간: ${new Date().toLocaleString()}`,
      });
    } catch (error) {
      toast({
        title: '임시저장 실패',
        description: '메타데이터 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 메타데이터 삭제 함수
  const handleDeleteMetadata = async () => {
    try {
      setIsDeleting(true);

      await deleteScenarioMetadata(simulationId);

      toast({
        title: 'Metadata Deleted',
        description: 'Scenario metadata has been successfully deleted.',
      });
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'An error occurred while deleting the metadata.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 🆕 탭 변경 시 두 store 모두 업데이트하는 통합 함수
  const handleTabChange = useCallback(
    (tabIndex: number) => {
      setCurrentScenarioTab(tabIndex);
      // 탭 인덱스를 step 번호로 변환 (0-based → 1-based)
      setCurrentStep(tabIndex + 1);
    },
    [setCurrentScenarioTab, setCurrentStep]
  );

  // ✅ S3 메타데이터 로드 기능 활성화 (초기 로드용)
  useLoadScenarioData(simulationId, {
    loadCompleteS3Metadata,
    loadScenarioProfileMetadata,
    setCurrentScenarioTab, // 🔧 초기 로드는 기존 함수 사용
    setIsInitialized,
  });

  const latestHistory = useMemo(() => {
    return scenarioHistory && scenarioHistory?.length > 0
      ? { checkpoint: scenarioHistory[scenarioHistory?.length - 1] }
      : null;
  }, [scenarioHistory]);

  return (
    <div className="mx-auto max-w-page px-page-x pb-page-b">
      <TheContentHeader text="Simulation" />

      <div className="mt-[15px] flex justify-between">
        <div className="flex items-center gap-3">
          <dl className="sub-title">
            <Suspense fallback={<dd>{scenarioName || `Scenario ${simulationId}`}</dd>}>
              <ScenarioNameDisplay simulationId={simulationId} scenarioName={scenarioName} />
            </Suspense>
          </dl>
          {latestHistory?.checkpoint && (
            <span className="rounded-md bg-gray-100 px-2 py-1 text-sm text-default-500">
              {timeToRelativeTime(latestHistory?.checkpoint)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 size={16} />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Metadata</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this scenario's metadata?
                  <br />
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteMetadata}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <TabDefault
        className={`mt-[40px]`}
        currentTab={currentScenarioTab}
        availableTabs={getAvailableTabs()}
        tabCount={tabs.length}
        tabs={tabs.map((tab) => ({ text: tab.text }))}
        onTabChange={handleTabChange}
      />

      {isInitialized ? (
        <React.Fragment key={simulationId}>
          <TabFlightSchedule
            visible={currentScenarioTab === 0}
            simulationId={simulationId}
            apiRequestLog={apiRequestLog}
            setApiRequestLog={setApiRequestLog}
          />
          <TabPassengerSchedule
            visible={currentScenarioTab === 1}
            simulationId={simulationId}
            apiRequestLog={apiRequestLog}
            setApiRequestLog={setApiRequestLog}
          />
          <TabProcessingProcedures
            visible={currentScenarioTab === 2}
            simulationId={simulationId}
            apiRequestLog={apiRequestLog}
            setApiRequestLog={setApiRequestLog}
          />
        </React.Fragment>
      ) : (
        <SimulationLoading minHeight="min-h-[200px]" />
      )}

      {/* 개발 환경에서만 Debug Viewer 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <JSONDebugViewer visible={true} simulationId={simulationId} apiRequestLog={apiRequestLog} />
      )}
    </div>
  );
}
