'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { getScenarioMetadata, setMasterScenario, setScenarioMetadata } from '@/api/simulations';
import Button from '@/components/Button';
import ContentsHeader from '@/components/ContentsHeader';
import TabDefault from '@/components/TabDefault';
import { IScenarioHistory, useSimulationMetadata, useSimulationStore } from '@/store/zustand/simulation';
import TabFacilityConnection from './_components/TabFacilityConnection';
import TabFacilityInformation from './_components/TabFacilityInformation';
import TabFlightSchedule from './_components/TabFlightSchedule';
import TabPassengerSchedule from './_components/TabPassengerSchedule';
import TabProcessingProcedures from './_components/TabProcessingProcedures';
import TabScenarioOverview from './_components/TabScenarioOverview';
import TabSimulation from './_components/TabSimulation';

const dummyHistoryData: IScenarioHistory[] = [
  {
    checkpoint: '2025-03-01 00:00:00',
    updated_at: '2025-03-02 10:00:00',
    simulation: 'Done',
    memo: 'Optimized security che',
    error_count: 0,
  },
  {
    checkpoint: '2025-03-02 00:00:00',
    updated_at: '2025-03-03 10:00:00',
    simulation: 'Done',
    memo: 'Optimized security check workload and opening times',
    error_count: 0,
  },
  {
    checkpoint: '2025-03-03 00:00:00',
    updated_at: '2025-03-04 10:00:00',
    simulation: 'Yet',
    memo: 'Optimized security check workload and opening times',
    error_count: 1,
  },
  {
    checkpoint: '2025-03-04 00:00:00',
    updated_at: '2025-03-05 10:00:00',
    simulation: 'Done',
    memo: 'Optimized security che',
    error_count: 2,
  },
];

const tabs: { text: string; number?: number }[] = [
  { text: 'Scenario Overview' },
  { text: 'Flight Schedule' },
  { text: 'Passenger Schedule' },
  { text: 'Processing Procedures' },
  { text: 'Facility Connection', number: 22 },
  { text: 'Facility Information' },
  { text: 'Simulation' },
];

export default function SimulationDetail(props) {
  const params: { id: string } = React.use(props?.params);
  const router = useRouter();
  const metadata = useSimulationMetadata();
  const { tabIndex, setTabIndex, setCheckpoint } = useSimulationStore();
  useEffect(() => {
    getScenarioMetadata({ simulation_id: params?.id }).then((response) => {
      console.log(response);
      const clientTime = dayjs();
      const serverTime = dayjs(response?.data?.checkpoint);
      setCheckpoint(response?.data?.checkpoint, clientTime.diff(serverTime, 'second'));
      metadata.setMetadata({
        ...response?.data?.metadata,
        history: dummyHistoryData,
      });
    });
  }, [params?.id]);
  return (
    <div>
      <ContentsHeader text="Simulation" />
      <div className="mt-[15px] flex justify-between">
        <dl className="sub-title">
          <dt>Simulation for ICN T1 Peak Day (2025).</dt>
          <dd>
            ICN_T1_Scenario_Rev2.project <span>2hours before</span>
          </dd>
        </dl>
        <div className="mt-[15px] flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<img src="/image/ico-arrow-left.svg" alt="" />}
            text="Back to Scenario List"
            onClick={() => {
              router.replace(`/protected/simulation`);
            }}
          />
          <Button
            className="btn-md btn-primary"
            icon={<img src="/image/ico-save.svg" alt="" />}
            text="Save"
            onClick={() => {
              if (metadata) {
                setScenarioMetadata(metadata).then((response) => {
                  console.log(response);
                });
              }
            }}
          />
        </div>
      </div>
      <TabDefault
        tabCount={tabs.length}
        currentTab={tabIndex}
        tabs={tabs.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`mt-[40px] grid-cols-7`}
        onTabChange={(index) => setTabIndex(index)}
      />
      {tabIndex == 0 ? (
        <TabScenarioOverview />
      ) : tabIndex == 1 ? (
        <TabFlightSchedule simulationId={params?.id} />
      ) : tabIndex == 2 ? (
        <TabPassengerSchedule />
      ) : tabIndex == 3 ? (
        <TabProcessingProcedures />
      ) : tabIndex == 4 ? (
        <TabFacilityConnection />
      ) : tabIndex == 5 ? (
        <TabFacilityInformation />
      ) : tabIndex == 6 ? (
        <TabSimulation />
      ) : null}
    </div>
  );
}
