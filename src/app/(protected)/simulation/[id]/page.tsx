'use client';

import React, { use, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { Save, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { APIRequestLog } from '@/types/simulationTypes';
import { saveScenarioMetadata, deleteScenarioMetadata } from '@/services/simulationService';
import TheContentHeader from '@/components/TheContentHeader';
import { Button } from '@/components/ui/Button';
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
import { useToast } from '@/hooks/useToast';
import { timeToRelativeTime } from '@/lib/utils';
import SimulationLoading from '../_components/SimulationLoading';
import JSONDebugViewer from './_components/JSONDebugViewer';
import TabDefault from './_components/TabDefault';

import TabFlightSchedule from './_components/TabFlightSchedule';
import TabPassengerSchedule from './_components/TabPassengerSchedule';
import TabProcessingProcedures from './_components/TabProcessingProcedures';
import { useLoadScenarioData } from './_hooks/useLoadScenarioData';
import {
  useFlightScheduleStore,
  usePassengerScheduleStore,
  useProcessingProceduresStore,
  useScenarioProfileStore,
} from './_stores';

const tabs: { text: string; number: number }[] = [
  { text: 'Flight Schedule', number: 0 },
  { text: 'Passenger Schedule', number: 1 },
  { text: 'Processing Procedures', number: 2 },
];

export default function SimulationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const urlScenarioName = searchParams.get('name');

  // 개별 store에서 필요한 데이터만 직접 가져오기
  const currentScenarioTab = useScenarioProfileStore((s) => s.currentScenarioTab);
  const scenarioName = useScenarioProfileStore((s) => s.scenarioName);
  const scenarioHistory = useScenarioProfileStore((s) => s.scenarioHistory);
  const setCurrentScenarioTab = useScenarioProfileStore((s) => s.setCurrentScenarioTab);
  const loadScenarioProfileMetadata = useScenarioProfileStore((s) => s.loadMetadata);

  const flightScheduleCompleted = useFlightScheduleStore((s) => s.isCompleted);
  const passengerScheduleCompleted = usePassengerScheduleStore((s) => s.isCompleted);
  const processingProceduresCompleted = useProcessingProceduresStore((s) => s.isCompleted);


  // S3 메타데이터를 모든 modular stores에 로드하는 함수
  const loadCompleteS3Metadata = useCallback((data: any) => {
    console.log('S3 metadata 로드 시작:', data);

    try {
      const tabs = data.metadata?.tabs || {};

      // 각 store에 해당 탭 데이터 로드
      if (tabs.flightSchedule) {
        console.log('Flight Schedule 데이터 로드:', tabs.flightSchedule);
        useFlightScheduleStore.getState().loadMetadata(tabs.flightSchedule);
      }

      if (tabs.passengerSchedule) {
        console.log('Passenger Schedule 데이터 로드:', tabs.passengerSchedule);
        usePassengerScheduleStore.getState().loadMetadata(tabs.passengerSchedule);
      }

      if (tabs.processingProcedures) {
        console.log('Processing Procedures 데이터 로드:', tabs.processingProcedures);
        useProcessingProceduresStore.getState().loadMetadata(tabs.processingProcedures);
      }



      // Scenario Profile은 useLoadScenarioData.ts에서 별도 처리하므로 여기서는 제외

      console.log('모든 store 메타데이터 로드 완료');
    } catch (error) {
      console.error('S3 메타데이터 로드 중 오류 발생:', error);
    }
  }, []);

  // 탭 접근성 계산
  const getAvailableTabs = () => {
    const completedStates = [
      flightScheduleCompleted,
      passengerScheduleCompleted,
      processingProceduresCompleted,
    ];

    // Flight Schedule 탭은 항상 접근 가능 + 완료된 탭까지 + 다음 탭 하나까지 활성화
    const lastCompletedIndex = completedStates.lastIndexOf(true);
    return Math.max(0, Math.min(lastCompletedIndex + 1, tabs.length - 1));
  };

  // 전체 메타데이터 수집용 함수 - 모든 stores에서 현재 상태 수집
  const getCompleteMetadata = useCallback((scenarioId: string) => {
    try {
      // 각 store에서 현재 상태 수집
      const flightScheduleState = useFlightScheduleStore.getState();
      const passengerScheduleState = usePassengerScheduleStore.getState();
      const processingProceduresState = useProcessingProceduresStore.getState();

      const scenarioProfileState = useScenarioProfileStore.getState();

      const metadata = {
        scenario_id: scenarioId,
        tabs: {
          flightSchedule: {
            airport: flightScheduleState.airport,
            date: flightScheduleState.date,
            type: flightScheduleState.type,
            availableConditions: flightScheduleState.availableConditions,
            selectedConditions: flightScheduleState.selectedConditions,
            chartData: flightScheduleState.chartData,
            total: flightScheduleState.total,
            isCompleted: flightScheduleState.isCompleted,
          },
          passengerSchedule: {
            settings: passengerScheduleState.settings,
            pax_demographics: passengerScheduleState.pax_demographics,
            pax_arrival_patterns: passengerScheduleState.pax_arrival_patterns,
            apiResponseData: passengerScheduleState.apiResponseData,
            isCompleted: passengerScheduleState.isCompleted,
          },
          processingProcedures: {
            process_flow: processingProceduresState.process_flow,
            isCompleted: processingProceduresState.isCompleted,
          },

          scenarioProfile: {
            checkpoint: scenarioProfileState.checkpoint,
            scenarioName: scenarioProfileState.scenarioName,
            scenarioTerminal: scenarioProfileState.scenarioTerminal,
            scenarioHistory: scenarioProfileState.scenarioHistory,
            currentScenarioTab: scenarioProfileState.currentScenarioTab,
            availableScenarioTab: scenarioProfileState.availableScenarioTab,
            isCompleted: scenarioProfileState.isCompleted,
          },
        },
      };

      return metadata;
    } catch (error) {
      console.error('메타데이터 수집 중 오류 발생:', error);
      return {
        scenario_id: scenarioId,
        tabs: {},
      };
    }
  }, []);

  const simulationId = use(params).id;
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiRequestLog, setApiRequestLog] = useState<APIRequestLog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 임시저장 함수
  const handleTempSave = async () => {
    try {
      setIsSaving(true);

      const completeMetadata = getCompleteMetadata(simulationId);

      const { data: saveResult } = await saveScenarioMetadata(simulationId, completeMetadata);

      toast({
        title: '임시저장 완료',
        description: `시나리오 메타데이터가 성공적으로 저장되었습니다.\n저장 위치: ${saveResult.s3_key}`,
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

  useLoadScenarioData(simulationId, {
    loadCompleteS3Metadata,
    loadScenarioProfileMetadata,
    setCurrentScenarioTab,
    setIsInitialized,
  });

  const latestHistory = useMemo(() => {
    return scenarioHistory && scenarioHistory?.length > 0 ? scenarioHistory[scenarioHistory?.length - 1] : null;
  }, [scenarioHistory]);

  return (
    <div className="max-w-page px-page-x pb-page-b mx-auto">
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
