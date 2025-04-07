'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { getScenarioMetadata, updateScenarioMetadata } from '@/services/simulations';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
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

export default function SimulationDetail(props) {
  const params: { id: string } = React.use(props?.params);
  const router = useRouter();
  const metadata = useSimulationMetadata();
  const { toast } = useToast();

  const {
    tabIndex,
    setTabIndex,
    availableTabIndex,
    setAvailableTabIndex,
    setCheckpoint,
    scenarioInfo,
    setScenarioInfo,
  } = useSimulationStore();

  const simulationId = params?.id;

  const lastHistory =
    metadata?.history && metadata?.history?.length > 0 ? metadata.history[metadata.history?.length - 1] : null;

  useEffect(() => {
    getScenarioMetadata(params?.id).then(({ data }) => {
      // console.log(data);
      const clientTime = dayjs();
      const serverTime = dayjs(data?.checkpoint);
      setCheckpoint(data?.checkpoint, clientTime.diff(serverTime, 'millisecond'));
      setScenarioInfo(data?.scenario_info);
      metadata.setMetadata(data?.metadata);
    });
  }, [params?.id]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tabIndex]);
  useEffect(() => {
    setAvailableTabIndex(1);
    setTabIndex(0);
  }, [simulationId]);
  return (
    <div className="mx-auto max-w-[1340px] px-[30px]">
      <TheContentHeader text="Simulation" />
      <div className="mt-[15px] flex justify-between">
        <dl className="sub-title">
          <dd>
            {scenarioInfo?.simulation_name || ''}
            {lastHistory?.checkpoint ? <span>{timeToRelativeTime(lastHistory?.checkpoint)}</span> : null}
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
          <Button
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
          />
        </div>
      </div>
      <TabDefault
        tabCount={tabs.length}
        currentTab={tabIndex}
        availableTabs={availableTabIndex}
        tabs={tabs.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`mt-[40px]`}
        onTabChange={(index) => (index > availableTabIndex ? null : setTabIndex(index))}
      />
      <React.Fragment key={simulationId}>
        <TabScenarioOverview visible={tabIndex == 0} />
        <TabFlightSchedule simulationId={params?.id} visible={tabIndex == 1} />
        <TabPassengerSchedule visible={tabIndex == 2} />
        <TabProcessingProcedures visible={tabIndex == 3} />
        <TabFacilityConnection visible={tabIndex == 4} />
        <TabFacilityInformation simulationId={params?.id} visible={tabIndex == 5} />
        <TabSimulation simulationId={params?.id} visible={tabIndex == 6} />
      </React.Fragment>
    </div>
  );
}
