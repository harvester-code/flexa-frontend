'use client';

import React, { use, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { APIRequestLog } from '@/types/simulationTypes';
import { saveScenarioMetadata } from '@/services/simulationService';
import TheContentHeader from '@/components/TheContentHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { timeToRelativeTime } from '@/lib/utils';
import SimulationLoading from '../_components/SimulationLoading';
import { useScenarioStore } from '../_store/useScenarioStore';
import JSONDebugViewer from './_components/JSONDebugViewer';
import TabDefault from './_components/TabDefault';
import TabFacilityConnection from './_components/TabFacilityConnection';
import TabFacilityInformation from './_components/TabFacilityInformation';
import TabFlightSchedule from './_components/TabFlightSchedule';
import TabPassengerSchedule from './_components/TabPassengerSchedule';
import TabProcessingProcedures from './_components/TabProcessingProcedures';
import TabScenarioOverview from './_components/TabScenarioOverview';
import TabSimulation from './_components/TabSimulation';
import { useLoadScenarioData } from './_hooks/useLoadScenarioData';

const tabs: { text: string; number: number }[] = [
  { text: 'Scenario Overview', number: 0 },
  { text: 'Flight Schedule', number: 1 },
  { text: 'Passenger Schedule', number: 2 },
  { text: 'Processing Procedures', number: 3 },
  { text: 'Facility Connection', number: 4 },
  { text: 'Facility Information', number: 5 },
  { text: 'Simulation', number: 6 },
];

export default function SimulationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const urlScenarioName = searchParams.get('name');

  const {
    currentScenarioTab,
    scenarioName,
    scenarioHistory,
    scenarioProfile,
    flightSchedule,
    passengerSchedule,
    airportProcessing,
    facilityConnection,
    facilityCapacity,
    loadCompleteS3Metadata,
    loadScenarioProfileMetadata,
    setCurrentScenarioTab,
  } = useScenarioStore(
    useShallow((s) => ({
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      scenarioName: s.scenarioProfile.scenarioName,
      scenarioHistory: s.scenarioProfile.scenarioHistory,
      scenarioProfile: s.scenarioProfile,
      flightSchedule: s.flightSchedule,
      passengerSchedule: s.passengerSchedule,
      airportProcessing: s.airportProcessing,
      facilityConnection: s.facilityConnection,
      facilityCapacity: s.facilityCapacity,
      loadCompleteS3Metadata: s.loadCompleteS3Metadata,
      loadScenarioProfileMetadata: s.scenarioProfile.actions.loadMetadata,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
    }))
  );

  // 탭 접근성 계산
  const getAvailableTabs = () => {
    const completedStates = [
      true, // Scenario Overview는 항상 활성화
      flightSchedule.isCompleted,
      passengerSchedule.isCompleted,
      airportProcessing.isCompleted,
      facilityConnection.isCompleted,
      facilityCapacity.isCompleted,
    ];

    // 완료된 탭까지 + 다음 탭 하나까지 활성화
    const lastCompletedIndex = completedStates.lastIndexOf(true);
    return Math.min(lastCompletedIndex + 1, tabs.length - 1);
  };

  // 전체 메타데이터 수집용 함수 (useCallback으로 안정화)
  const getCompleteMetadata = useCallback(
    (scenarioId: string) => ({
      scenario_id: scenarioId,
      tabs: {
        overview: scenarioProfile,
        flightSchedule: flightSchedule,
        passengerSchedule: passengerSchedule,
        processingProcedures: airportProcessing,
        facilityConnection: facilityConnection,
        facilityInformation: facilityCapacity,
      },
    }),
    [scenarioProfile, flightSchedule, passengerSchedule, airportProcessing, facilityConnection, facilityCapacity]
  );

  const simulationId = use(params).id;
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiRequestLog, setApiRequestLog] = useState<APIRequestLog | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="mx-auto mb-10 max-w-[1340px] px-[30px]">
      <TheContentHeader text="Simulation" />

      <div className="mt-[15px] flex justify-between">
        <div className="flex items-center gap-3">
          <dl className="sub-title">
            <dd>{urlScenarioName || scenarioName || `Scenario ${simulationId}`}</dd>
          </dl>
          {latestHistory?.checkpoint && (
            <span className="rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-600">
              {timeToRelativeTime(latestHistory?.checkpoint)}
            </span>
          )}
        </div>

        <Button onClick={handleTempSave} disabled={isSaving} className="flex items-center gap-2 px-4">
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
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
          <TabScenarioOverview visible={currentScenarioTab === 0} />
          <TabFlightSchedule
            visible={currentScenarioTab === 1}
            simulationId={simulationId}
            apiRequestLog={apiRequestLog}
            setApiRequestLog={setApiRequestLog}
          />
          <TabPassengerSchedule
            visible={currentScenarioTab === 2}
            simulationId={simulationId}
            apiRequestLog={apiRequestLog}
            setApiRequestLog={setApiRequestLog}
          />
          <TabProcessingProcedures visible={currentScenarioTab === 3} simulationId={simulationId} />
          <TabFacilityConnection visible={currentScenarioTab === 4} simulationId={simulationId} />
          <TabFacilityInformation visible={currentScenarioTab === 5} simulationId={simulationId} />
          <TabSimulation visible={currentScenarioTab === 6} simulationId={simulationId} />
        </React.Fragment>
      ) : (
        <SimulationLoading minHeight="min-h-[200px]" />
      )}

      <JSONDebugViewer visible={true} apiRequestLog={apiRequestLog} />
    </div>
  );
}
