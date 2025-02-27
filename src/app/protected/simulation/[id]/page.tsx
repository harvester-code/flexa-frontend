'use client';

import TabFacilityConnection from './TabFacilityConnection';
import TabFacilityInformation from './TabFacilityInformation';
import TabFlightSchedule from './TabFlightSchedule';
import TabPassengerSchedule from './TabPassengerSchedule';
import TabProcessingProcedures from './TabProcessingProcedures';
import TabScenarioOverview from './TabScenarioOverview';
import TabSimulation from './TabSimulation';
import React, { useCallback, useRef, useState } from 'react';
import Button from '@/components/Button';
import ContentsHeader from '@/components/ContentsHeader';
import TabDefault from '@/components/TabDefault';

const tabs: { text: string; number?: number }[] = [
  { text: 'Scenario Overview' },
  { text: 'Flight Schedule' },
  { text: 'Passenger Schedule' },
  { text: 'Processing Procedures' },
  { text: 'Facility Connection', number: 22 },
  { text: 'Facility Information' },
  { text: 'Simulation' },
];

const SimulationDetail: React.FC = () => {
  const [tab, setTab] = useState(1);

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
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-primary"
            icon={<img src="/image/ico-save.svg" alt="" />}
            text="Save"
            onClick={() => {}}
          />
        </div>
      </div>
      <TabDefault
        tabCount={tabs.length}
        currentTab={tab}
        tabs={tabs.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        className={`mt-[40px] grid-cols-7`}
        onTabChange={(tabIndex) => setTab(tabIndex)}
      />
      {tab == 0 ? (
        <TabScenarioOverview />
      ) : tab == 1 ? (
        <TabFlightSchedule />
      ) : tab == 2 ? (
        <TabPassengerSchedule />
      ) : tab == 3 ? (
        <TabProcessingProcedures />
      ) : tab == 4 ? (
        <TabFacilityConnection />
      ) : tab == 5 ? (
        <TabFacilityInformation />
      ) : tab == 6 ? (
        <TabSimulation />
      ) : null}
    </div>
  );
};

export default SimulationDetail;
