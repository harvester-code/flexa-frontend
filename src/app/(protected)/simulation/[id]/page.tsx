'use client';

import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
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
import JSONDebugViewer from './_components/JSONDebugViewer';
import TabDefault from './_components/TabDefault';
import TabFlightSchedule from './_components/TabFlightSchedule';
import TabPassengerSchedule from './_components/TabPassengerSchedule';
import TabProcessingProcedures from './_components/TabProcessingProcedures';
import { useLoadScenarioData } from './_hooks/useLoadScenarioData';
import { useScenarioProfileStore, useSimulationStore } from './_stores';

const tabs: { text: string; number: number }[] = [
  { text: 'Flight Schedule', number: 0 },
  { text: 'Passenger Schedule', number: 1 },
  { text: 'Processing Procedures', number: 2 },
];

export default function SimulationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const urlScenarioName = searchParams.get('name');

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
  const processingProceduresCompleted = useSimulationStore((s) => s.workflow.step3Completed);

  // S3 메타데이터를 모든 modular stores에 로드하는 함수
  const loadCompleteS3Metadata = useCallback((data: any) => {
    console.log('🔍 S3 metadata 로드 시작 - 전체 데이터:', data);
    console.log('🔍 data.metadata:', data.metadata);

    try {
      // 🔧 새로운 통합 Store 구조에 맞게 수정
      const metadata = data.metadata || {};
      const tabs = metadata.tabs || {};

      console.log('🔍 tabs 구조:', tabs);
      console.log('🔍 metadata 직접 구조:', metadata);

      // 🎯 S3에서 받은 데이터를 Zustand에 통째로 갈아끼우기
      if (metadata.context || metadata.flight || metadata.passenger || metadata.process_flow || metadata.workflow) {
        console.log('🚀 S3에서 데이터를 발견했습니다. Zustand에 갈아끼우기 시작:', metadata);

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
        console.log('✅ Zustand 통째로 교체 완료! 이제 모든 컴포넌트가 업데이트됩니다.');
      }

      // 🚧 Legacy tabs 구조 지원 (하위 호환성)
      else if (tabs.passengerSchedule || tabs.processingProcedures) {
        console.log('🔧 Legacy tabs 구조 감지, 기존 방식으로 로드');

        if (tabs.passengerSchedule) {
          console.log('Passenger Schedule 데이터 로드:', tabs.passengerSchedule);
          useSimulationStore.getState().loadPassengerMetadata(tabs.passengerSchedule);
        }

        if (tabs.processingProcedures) {
          console.log('Processing Procedures 데이터 로드:', tabs.processingProcedures);
          useSimulationStore.getState().loadProcessMetadata(tabs.processingProcedures);
        }

        console.log('✅ Legacy 메타데이터 로드 완료');
      } else {
        console.log('⚠️ 로드할 메타데이터가 없습니다');
      }
    } catch (error) {
      console.error('S3 메타데이터 로드 중 오류 발생:', error);
    }
  }, []);

  // 탭 접근성 계산
  const getAvailableTabs = () => {
    const completedStates = [flightScheduleCompleted, passengerScheduleCompleted, processingProceduresCompleted];

    // Flight Schedule 탭은 항상 접근 가능 + 완료된 탭까지 + 다음 탭 하나까지 활성화
    const lastCompletedIndex = completedStates.lastIndexOf(true);
    return Math.max(0, Math.min(lastCompletedIndex + 1, tabs.length - 1));
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
      };

      console.log('🆕 통합 Store 메타데이터 수집 완료:', metadata);
      return metadata;
    } catch (error) {
      console.error('🆕 통합 Store 메타데이터 수집 중 오류 발생:', error);
      return {
        context: {
          scenarioId: scenarioId,
          airport: '',
          date: '',
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
          step3Completed: false,
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

  // ✅ scenarioId는 loadCompleteS3Metadata에서 직접 설정하므로 별도 useEffect 불필요

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
      console.error('임시저장 실패:', error);
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
      console.error('메타데이터 삭제 실패:', error);
      toast({
        title: 'Delete Failed',
        description: 'An error occurred while deleting the metadata.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ S3 메타데이터 로드 기능 활성화
  useLoadScenarioData(simulationId, {
    loadCompleteS3Metadata,
    loadScenarioProfileMetadata,
    setCurrentScenarioTab,
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
            <dd>{urlScenarioName || scenarioName || `Scenario ${simulationId}`}</dd>
          </dl>
          {latestHistory?.checkpoint && (
            <span className="rounded-md bg-gray-100 px-2 py-1 text-sm text-default-500">
              {timeToRelativeTime(latestHistory?.checkpoint)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleTempSave} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

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
        onTabChange={setCurrentScenarioTab}
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
          <TabProcessingProcedures visible={currentScenarioTab === 2} simulationId={simulationId} />
        </React.Fragment>
      ) : (
        <SimulationLoading minHeight="min-h-[200px]" />
      )}

      <JSONDebugViewer visible={true} simulationId={simulationId} apiRequestLog={apiRequestLog} />
    </div>
  );
}
