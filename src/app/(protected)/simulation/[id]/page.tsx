'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { OrbitProgress } from 'react-loading-indicators';
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

export default function SimulationDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();

  const [loaded, setLoaded] = useState(false);

  const simulationId = React.use(params).id;
  const {
    availableTabIndex,
    scenarioInfo,
    setAvailableTabIndex,
    setCheckpoint,
    setScenarioInfo,
    setTabIndex,
    tabIndex,
  } = useSimulationStore();
  const metadata = useSimulationMetadata();

  const latestHistory =
    metadata?.history && metadata?.history?.length > 0 ? metadata.history[metadata.history?.length - 1] : null;

  useEffect(() => {
    setAvailableTabIndex(1);
    setTabIndex(0);

    // Fetch the scenario metadata
    getScenarioMetadata(simulationId).then(({ data }) => {
      const clientTime = dayjs();
      const serverTime = dayjs(data?.checkpoint);

      setCheckpoint(data?.checkpoint, clientTime.diff(serverTime, 'millisecond'));
      setScenarioInfo(data?.scenario_info);

      metadata.setMetadata(data?.metadata);

      setLoaded(true);
    });
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
        availableTabs={loaded ? availableTabIndex : 0}
        tabs={tabs.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`mt-[40px]`}
        onTabChange={(index) => (!loaded || index > availableTabIndex ? null : setTabIndex(index))}
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
