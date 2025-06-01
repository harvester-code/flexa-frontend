'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { OrbitProgress } from 'react-loading-indicators';
import { useShallow } from 'zustand/react/shallow';
import { getScenarioMetadata, updateScenarioMetadata } from '@/services/simulations';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Button from '@/components/Button';
import TabDefault from '@/components/TabDefault';
import TheContentHeader from '@/components/TheContentHeader';
import { useToast } from '@/hooks/useToast';
import { timeToRelativeTime } from '@/lib/utils';
import TabFacilityConnection from './_components/TabFacilityConnection';
import TabFacilityInformation from './_components/TabFacilityInformation';
import TabFlightSchedule from './_components/TabFlightSchedule';
import TabPassengerSchedule from './_components/TabPassengerSchedule';
import TabProcessingProcedures from './_components/TabProcessingProcedures';
import TabScenarioOverview from './_components/TabScenarioOverview';
import TabSimulation from './_components/TabSimulation';

const tabs: { text: string; number?: number }[] = [
  { text: 'Scenario Overview' },
  { text: 'Flight Schedule' },
  { text: 'Passenger Schedule' },
  { text: 'Processing Procedures' },
  { text: 'Facility Connection' },
  { text: 'Facility Information' },
  { text: 'Simulation' },
];

export default function SimulationDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();

  const [loaded, setLoaded] = useState(false);
  const simulationId = React.use(params).id;

  const {
    tabIndex,
    setTabIndex,
    availableTabIndex,
    setAvailableTabIndex,
    scenarioInfo,
    setScenarioInfo,
    history,
    setCheckpoint,
    setMetadata,
    setConditionFilters,
    setSelectedConditions,
    setPriorities,
  } = useScenarioStore(
    useShallow((state) => ({
      tabIndex: state.tabIndex,
      setTabIndex: state.setTabIndex,
      availableTabIndex: state.availableTabIndex,
      setAvailableTabIndex: state.setAvailableTabIndex,
      scenarioInfo: state.scenarioInfo,
      setScenarioInfo: state.setScenarioInfo,
      history: state.history,
      setCheckpoint: state.setCheckpoint,
      setMetadata: state.setMetadata,
      setConditionFilters: state.setConditionFilters,
      setSelectedConditions: state.setSelectedConditions,
      setPriorities: state.setPriorities,
    }))
  );

  const latestHistory = history && history?.length > 0 ? history[history?.length - 1] : null;

  // ‼️ 시뮬레이션 페이지에 필요한 데이터를 로드합니다.
  // 이 데이터를 스토어에 저장하고, 하위 탭 컴포넌트에서 사용합니다.
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const {
          data: { checkpoint, metadata: metadata_, scenario_info },
        } = await getScenarioMetadata(simulationId);

        const clientTime = dayjs();
        const serverTime = dayjs(checkpoint);

        setCheckpoint(checkpoint, clientTime.diff(serverTime, 'millisecond'));
        setScenarioInfo(scenario_info);
        setMetadata(metadata_);

        setAvailableTabIndex(metadata_?.overview?.snapshot?.availableTabIndex || 1);
        setConditionFilters(metadata_.flight_sch.snapshot.conditions || []);
        setSelectedConditions(metadata_.flight_sch.params.condition || []);
        setPriorities(metadata_.flight_sch.snapshot.priorities || []);
      } catch (error) {
        console.error('Failed to load scenario metadata:', error);
      } finally {
        setLoaded(true);
      }
    };

    setTabIndex(0);
    loadMetadata();
  }, [simulationId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tabIndex]);

  return (
    <div className="mx-auto max-w-[1340px] px-[30px]">
      <TheContentHeader text="Simulation" />

      <div className="mt-[15px] flex justify-between">
        <dl className="sub-title">
          <dd>
            {scenarioInfo?.simulation_name || ''}
            {latestHistory?.checkpoint ? <span>{timeToRelativeTime(latestHistory?.checkpoint)}</span> : null}
          </dd>
        </dl>

        <div className="flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<Image width={20} height={20} src="/image/ico-arrow-left.svg" alt="" />}
            text="Back to Scenario List"
            onClick={() => {
              router.replace(`/simulation`);
            }}
          />

          {/* <Button
            className="btn-md btn-primary"
            icon={<Image width={20} height={20} src="/image/ico-save.svg" alt="" />}
            text="Save"
            onClick={() => {
              if (metadata) {
                updateScenarioMetadata().then((response) => {
                  toast({
                    variant: 'default',
                    title: 'Saved successfully.',
                    duration: 3000,
                  });
                });
              }
            }}
          /> */}
        </div>
      </div>

      <TabDefault
        className={`mt-[40px]`}
        currentTab={tabIndex}
        availableTabs={loaded ? availableTabIndex : 0}
        tabCount={tabs.length}
        tabs={tabs.map((tab) => ({
          text: tab.text,
          number: tab.number || 0,
        }))}
        onTabChange={(i) => (!loaded || i > availableTabIndex ? null : setTabIndex(i))}
      />

      {loaded ? (
        <React.Fragment key={simulationId}>
          <TabScenarioOverview visible={tabIndex == 0} />
          <TabFlightSchedule visible={tabIndex == 1} simulationId={simulationId} />
          <TabPassengerSchedule visible={tabIndex == 2} simulationId={simulationId} />
          <TabProcessingProcedures visible={tabIndex == 3} />
          <TabFacilityConnection visible={tabIndex == 4} simulationId={simulationId} />
          <TabFacilityInformation visible={tabIndex == 5} simulationId={simulationId} />
          <TabSimulation visible={tabIndex == 6} simulationId={simulationId} />
        </React.Fragment>
      ) : (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      )}
    </div>
  );
}
