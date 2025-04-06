'use client';

import { useEffect, useState } from 'react';
import { ScenarioData } from '@/types/simulations';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import TheContentHeader from '@/components/TheContentHeader';
import SimulationOverview from '@/components/popups/SimulationOverview';
import HomeAccordion from './_components/HomeAccordion';
import HomeCanvas from './_components/HomeCanvas';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeSummary from './_components/HomeSummary';
import HomeWarning from './_components/HomeWarning';
import { snapshot } from './samples';

function HomePage() {
  const { data: user } = useUser();
  const { data: scenarios, isLoading: isScenariosLoading } = useScenarios(user?.groupId);

  const [scenario, setScenario] = useState<ScenarioData | null>(null);

  // NOTE: 처음 랜더링될 때 무조건 MASTER SCENARIO가 선택됨.
  useEffect(() => {
    if (scenarios?.scenarios?.[0]) {
      setScenario(scenarios.scenarios[0]);
    }
  }, [scenarios]);

  return (
    <div className="mx-auto max-w-[83.75rem] px-[1.875rem] pb-24">
      <TheContentHeader text="Home" />

      <SimulationOverview
        className="mt-8"
        items={scenarios?.scenarios ?? []}
        scenario={scenario}
        onSelectScenario={setScenario}
      />

      <HomeCanvas scenario={scenario} snapshot={snapshot} />

      <HomeAccordion title="Summary">
        <HomeSummary scenario={scenario} />
      </HomeAccordion>

      <HomeAccordion title="Alert & Issues">
        <HomeWarning scenario={scenario} />
      </HomeAccordion>

      <HomeAccordion title="Details">
        <HomeDetails scenario={scenario} />
      </HomeAccordion>

      <HomeAccordion title="Charts">
        <HomeCharts scenario={scenario} />
      </HomeAccordion>
    </div>
  );
}

export default HomePage;
