'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ScenarioData } from '@/types/simulations';
import { useSummaries } from '@/queries/homeQueries';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import TheContentHeader from '@/components/TheContentHeader';
import TheMultipleSlider from '@/components/TheMultipleSlider';
import TheSlider from '@/components/TheSlider';
import SimulationOverview from '@/components/popups/SimulationOverview';
import HomeAccordion from './_components/HomeAccordion';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeSummary from './_components/HomeSummary';
import HomeWarning from './_components/HomeWarning';

function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const handleTabClick = (index: number) => setActiveIndex(index);

  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [boxOptions, setBoxOptions] = useState<string[]>([]);

  const { data: user } = useUser();
  const { data: scenarios } = useScenarios(user?.groupId);

  // NOTE: 처음 랜더링될 때 무조건 MASTER SCENARIO가 선택됨.
  useEffect(() => {
    if (scenarios) setScenario(scenarios.master_scenario[0]);
  }, [scenarios]);

  // TODO: Skeleton UI 적용하기
  if (!scenarios || !scenario) return <div>Loading ...</div>;

  return (
    <div className="mx-auto max-w-[83.75rem] px-[1.875rem] pb-24">
      <TheContentHeader text="Home" />

      <SimulationOverview
        className="mt-8"
        // FIXME: 여기 고치기
        items={[...scenarios.scenarios!, ...scenarios?.master_scenario]}
        scenario={scenario}
        onSelectScenario={setScenario}
      />

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Terminal Overview</h2>
        <div className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-100 p-1 shadow-inner">
          <button
            className={`h-10 w-44 rounded-full px-5 font-medium ${
              activeIndex === 0 ? 'bg-white text-gray-800 shadow' : 'text-gray-600'
            }`}
            onClick={() => handleTabClick(0)}
          >
            Time Stamp
          </button>
          <button
            className={`h-10 w-44 rounded-full px-5 font-medium ${
              activeIndex === 1 ? 'bg-white text-gray-800 shadow' : 'text-gray-600'
            }`}
            onClick={() => handleTabClick(1)}
          >
            Time Span
          </button>
        </div>
      </div>

      {/* <div className="mt-5 flex flex-col">
        <div className={`${activeIndex === 0 ? '' : 'hidden'} flex flex-col gap-2`}>
          <div className="relative flex aspect-[1280/600] flex-grow items-center justify-center rounded-md"></div>

          <div className="relative mt-8 h-24 flex-grow pt-2.5">
            <TheSlider defaultValue={[50]} />
          </div>
        </div>

        <div className={`${activeIndex === 1 ? '' : 'hidden'} flex flex-col gap-2`}>
          <div className="relative flex aspect-[1280/600] flex-grow items-center justify-center rounded-md">
            <Image src="/image/thumb/@img-main-01.png" alt="map" width={1280} height={600} />
            <div className="absolute left-2.5 top-2.5 z-10 flex flex-col overflow-hidden rounded-md border border-gray-300">
              <button className="h-11 w-11 border-b border-gray-300 bg-white hover:text-purple-600">
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button className="h-11 w-11 bg-white hover:text-purple-600">
                <FontAwesomeIcon icon={faMinus} />
              </button>
            </div>
          </div>

          <div className="mb-2 mt-8">
            <TheMultipleSlider defaultValue={[0, 80]} />
          </div>
        </div>
      </div> */}

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
