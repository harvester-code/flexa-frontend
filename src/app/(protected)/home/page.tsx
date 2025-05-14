'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, CircleSmall } from 'lucide-react';
import { ScenarioData } from '@/types/simulations';
import { useProcesses } from '@/queries/facilityQueries';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import Input from '@/components/Input';
import TheContentHeader from '@/components/TheContentHeader';
import TheDropdownMenu from '@/components/TheDropdownMenu';
import SimulationOverview from '@/components/popups/SimulationOverview';
import { useDebounce } from '@/hooks/useDebounce';
import HomeAccordion from './_components/HomeAccordion';
import HomeCanvas from './_components/HomeCanvas';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeSummary from './_components/HomeSummary';
import HomeWarning from './_components/HomeWarning';
import { snapshot } from './samples';

const KPI_FUNCS = [
  { label: 'Mean', value: 'mean' },
  { label: 'Top N%', value: 'topN' },
];

function HomePage() {
  const { data: user } = useUser();
  const { data: scenarios } = useScenarios(user?.groupId);
  const { data: processes } = useProcesses({ scenarioId: scenarios?.scenarios?.[0]?.id });

  const [scenario, setScenario] = useState<ScenarioData | null>(null);

  const [calculateType, setCalculateType] = useState(KPI_FUNCS[0]);
  const [percentile, setPercentile] = useState(5);
  const debouncedPercentile = useDebounce(percentile, 300);

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

      <div className="mt-4 flex items-center justify-end">
        <CircleSmall className="mr-2" fill="#9E77ED" stroke="#9E77ED" />

        <TheDropdownMenu
          className="min-w-[180px] [&>*]:justify-start"
          items={KPI_FUNCS}
          icon={<ChevronDown />}
          label={calculateType.label}
          onSelect={(opt) => setCalculateType(opt)}
        />

        {calculateType.value === 'topN' && (
          <div className="ml-4 flex items-center gap-1 text-lg font-semibold">
            <span>Top</span>
            <div className="max-w-20">
              {/* FIXME: 컴포넌트 수정하기 */}
              <Input
                className="input-rounded text-center text-sm"
                type="text"
                placeholder="0-100"
                value={percentile.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPercentile(Number(e.target.value))}
              />
            </div>
            <span>%</span>
          </div>
        )}
      </div>

      <HomeAccordion title="Summary" className="mt-4">
        <HomeSummary scenario={scenario} calculate_type={calculateType.value} percentile={debouncedPercentile} />
      </HomeAccordion>

      <HomeAccordion title="Alert & Issues">
        <HomeWarning scenario={scenario} processes={processes} />
      </HomeAccordion>

      <HomeAccordion title="Details">
        <HomeDetails scenario={scenario} calculate_type={calculateType.value} percentile={debouncedPercentile} />
      </HomeAccordion>

      <HomeAccordion title="Charts">
        <HomeCharts scenario={scenario} processes={processes} />
      </HomeAccordion>
    </div>
  );
}

export default HomePage;
