'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { ScenarioHistory } from '@/types/simulations';
import { getScenarioMetadata, updateScenarioMetadata } from '@/services/simulations';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Button from '@/components/Button';
import ContentsHeader from '@/components/ContentsHeader';
import TabDefault from '@/components/TabDefault';
import TabFacilityConnection from './_components/TabFacilityConnection';
import TabFacilityInformation from './_components/TabFacilityInformation';
import TabFlightSchedule from './_components/TabFlightSchedule';
import TabPassengerSchedule from './_components/TabPassengerSchedule';
import TabProcessingProcedures from './_components/TabProcessingProcedures';
import TabScenarioOverview from './_components/TabScenarioOverview';
import TabSimulation from './_components/TabSimulation';

const dummyHistoryData: ScenarioHistory[] = [
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
  { text: 'Facility Connection' },
  { text: 'Facility Information' },
  { text: 'Simulation' },
];

export default function SimulationDetail(props) {
  const params: { id: string } = React.use(props?.params);
  const router = useRouter();
  const metadata = useSimulationMetadata();

  const { tabIndex, setTabIndex, availableTabIndex, setCheckpoint, setScenarioInfo } = useSimulationStore();

  useEffect(() => {
    getScenarioMetadata(params?.id).then(({ data }) => {
      console.log(data)
      const clientTime = dayjs();
      const serverTime = dayjs(data?.checkpoint);
      setCheckpoint(data?.checkpoint, clientTime.diff(serverTime, 'second'));
      setScenarioInfo(data?.scenario_info);
      metadata.setMetadata({
        ...data?.metadata,
        history: dummyHistoryData,
      });
    });
  }, [params?.id]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tabIndex]);
  return (
    <div className='mx-auto max-w-[1340px] px-[30px]'>
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
            icon={<Image width={20} height={20} src="/image/ico-arrow-left.svg" alt="" />}
            text="Back to Scenario List"
            onClick={() => {
              router.replace(`/simulation`);
            }}
          />
          <Button
            className="btn-md btn-primary"
            icon={<Image width={20} height={20} src="/image/ico-save.svg" alt="" />}
            text="Save"
            onClick={() => {
              if (metadata) {
                updateScenarioMetadata().then((response) => {
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
        availableTabs={availableTabIndex}
        tabs={tabs.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`mt-[40px]`}
        onTabChange={(index) => index > availableTabIndex ? null : setTabIndex(index)}
      />
      <TabScenarioOverview visible={tabIndex == 0} />
      <TabFlightSchedule simulationId={params?.id} visible={tabIndex == 1} />
      <TabPassengerSchedule visible={tabIndex == 2} />
      <TabProcessingProcedures visible={tabIndex == 3} />
      <TabFacilityConnection visible={tabIndex == 4} />
      <TabFacilityInformation visible={tabIndex == 5} />
      <TabSimulation simulationId={params?.id} visible={tabIndex == 6} />
    </div>
  );
}
