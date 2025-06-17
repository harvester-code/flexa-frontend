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
  const router = useRouter();
  const { toast } = useToast();

  const [loaded, setLoaded] = useState(false);
  const simulationId = React.use(params).id;

  const {
    availableScenarioTab,
    currentScenarioTab,
    scenarioName,
    checkpoint,
    setCheckpoint,
    setCurrentScenarioTab,
    scenarioHistory,
    //
    loadScenarioProfileMetadata,
    loadScenarioOverviewMetadata,
    loadFlightScheduleMetadata,
    loadPassengerScheduleMetadata,
    loadAirportProcessingMetadata,
    loadFacilityConnectionMetadata,
    loadFacilityCapacityMetadata,
    //
    scenarioProfile,
    scenarioOverview,
    flightSchedule,
    passengerSchedule,
    airportProcessing,
    facilityConnection,
    facilityCapacity,
  } = useScenarioStore(
    useShallow((s) => ({
      availableScenarioTab: s.scenarioProfile.availableScenarioTab,
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      checkpoint: s.scenarioProfile.checkpoint,
      scenarioName: s.scenarioProfile.scenarioName,
      scenarioHistory: s.scenarioProfile.scenarioHistory,
      setCheckpoint: s.scenarioProfile.actions.setCheckpoint,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      //
      loadScenarioProfileMetadata: s.scenarioProfile.actions.loadMetadata,
      loadScenarioOverviewMetadata: s.scenarioOverview.actions.loadMetadata,
      loadFlightScheduleMetadata: s.flightSchedule.actions.loadMetadata,
      loadPassengerScheduleMetadata: s.passengerSchedule.actions.loadMetadata,
      loadAirportProcessingMetadata: s.airportProcessing.actions.loadMetadata,
      loadFacilityConnectionMetadata: s.facilityConnection.actions.loadMetadata,
      loadFacilityCapacityMetadata: s.facilityCapacity.actions.loadMetadata,
      //
      scenarioProfile: s.scenarioProfile,
      scenarioOverview: s.scenarioOverview,
      flightSchedule: s.flightSchedule,
      passengerSchedule: s.passengerSchedule,
      airportProcessing: s.airportProcessing,
      facilityConnection: s.facilityConnection,
      facilityCapacity: s.facilityCapacity,
    }))
  );

  // ‼️ 시뮬레이션 페이지에 필요한 데이터를 로드합니다.
  // 이 데이터를 스토어에 저장하고, 하위 탭 컴포넌트에서 사용합니다.
  useEffect(() => {
    setCurrentScenarioTab(0); // Reset to the first tab when loading a new scenario

    const loadScenario = async () => {
      try {
        const {
          data: { checkpoint: scenarioCheckpoint, metadata: scenarioMetadata, scenario_info: scenarioInfo },
        } = await getScenarioMetadata(simulationId);

        const clientTime = dayjs();
        const serverTime = dayjs(scenarioCheckpoint);

        loadScenarioProfileMetadata({
          checkpoint: scenarioCheckpoint,
          scenarioName: scenarioInfo.name,
          scenarioTerminal: scenarioInfo.terminal,
          scenarioHistory: scenarioMetadata.history,
        });
        loadScenarioOverviewMetadata(scenarioMetadata.overview);
        loadFlightScheduleMetadata(scenarioMetadata.flight_schedule);
        loadPassengerScheduleMetadata(scenarioMetadata.passenger_schedule);
        loadAirportProcessingMetadata(scenarioMetadata.processing_procedures);
        loadFacilityConnectionMetadata(scenarioMetadata.facility_connection);
        loadFacilityCapacityMetadata(scenarioMetadata.facility_information);

        setCheckpoint({ time: scenarioCheckpoint, diff: clientTime.diff(serverTime, 'millisecond') });
      } catch (error) {
        console.error('Failed to load scenario metadata:', error);
      } finally {
        setLoaded(true);
      }
    };

    loadScenario();
  }, [
    loadScenarioProfileMetadata,
    loadScenarioOverviewMetadata,
    loadFlightScheduleMetadata,
    loadPassengerScheduleMetadata,
    loadAirportProcessingMetadata,
    loadFacilityConnectionMetadata,
    loadFacilityCapacityMetadata,
    setCheckpoint,
    setCurrentScenarioTab,
    simulationId,
  ]);

  const latestHistory =
    scenarioHistory && scenarioHistory?.length > 0 ? scenarioHistory[scenarioHistory?.length - 1] : null;

  // useEffect(() => {
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // }, [currentScenarioTab]=);

  const saveScenario = async () => {
    const { actions: a, ...scenarioProfileSnapShot } = scenarioProfile;
    const { actions: b, ...scenarioOverviewSnapShot } = scenarioOverview;
    const { actions: c, ...flightScheduleSnapShot } = flightSchedule;
    const { actions: d, ...passengerScheduleSnapShot } = passengerSchedule;
    const { actions: e, ...airportProcessingSnapShot } = airportProcessing;
    const { actions: f, ...facilityConnectionSnapShot } = facilityConnection;
    const { actions: g, ...facilityCapacitySnapShot } = facilityCapacity;

    const newCheckpoint = dayjs()
      .add((checkpoint?.diff || 0) * -1, 'millisecond')
      .format('YYYY-MM-DD HH:mm:ss Z');

    const historyItem = {
      checkpoint: newCheckpoint,
      error_count: 0,
      memo: '',
      simulation: 'yet',
    };

    const history = [...(scenarioProfileSnapShot?.scenarioHistory || []), historyItem];

    const params = {
      overview: scenarioOverviewSnapShot,
      history,
      flight_schedule: flightScheduleSnapShot,
      passenger_schedule: passengerScheduleSnapShot,
      processing_procedures: airportProcessingSnapShot,
      facility_connection: facilityConnectionSnapShot,
      facility_information: facilityCapacitySnapShot,
    };

    await updateScenarioMetadata(simulationId, params);

    toast({ variant: 'default', title: 'Saved successfully.', duration: 3000 });
  };

  return (
    <div className="mx-auto max-w-[1340px] px-[30px]">
      <TheContentHeader text="Simulation" />

      <div className="mt-[15px] flex justify-between">
        <dl className="sub-title">
          <dd>
            {scenarioName}
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
            onClick={saveScenario}
          />
        </div>
      </div>

      <TabDefault
        className={`mt-[40px]`}
        currentTab={currentScenarioTab}
        availableTabs={availableScenarioTab}
        tabCount={tabs.length}
        tabs={tabs.map((tab) => ({ text: tab.text }))}
        onTabChange={setCurrentScenarioTab}
      />

      {loaded ? (
        <React.Fragment key={simulationId}>
          <TabScenarioOverview visible={currentScenarioTab === 0} />
          <TabFlightSchedule visible={currentScenarioTab === 1} simulationId={simulationId} />
          <TabPassengerSchedule visible={currentScenarioTab === 2} simulationId={simulationId} />
          <TabProcessingProcedures visible={currentScenarioTab === 3} />
          <TabFacilityConnection visible={currentScenarioTab === 4} simulationId={simulationId} />
          <TabFacilityInformation visible={currentScenarioTab === 5} simulationId={simulationId} />
          <TabSimulation visible={currentScenarioTab === 6} simulationId={simulationId} />
        </React.Fragment>
      ) : (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
      )}
    </div>
  );
}
