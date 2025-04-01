'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ScenarioData } from '@/types/simulations';
import { useSummaries } from '@/queries/homeQueries';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import ContentsHeader from '@/components/ContentsHeader';
import SimulationOverview from '@/components/popups/SimulationOverview';
import { MultipleSlider } from '@/components/ui/MultipleSlider';
import { Slider } from '@/components/ui/Slider';
import HomeAccordion from './_components/HomeAccordion';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeSummary from './_components/HomeSummary';
import HomeWarning from './_components/HomeWarning';

function HomePage() {
  const [activeIndex, setActiveIndex] = useState(1);
  const handleTabClick = (index: number) => setActiveIndex(index);

  const [range1, setRange1] = useState<number>(4);
  const [range2, setRange2] = useState<number[]>([4, 20]);

  const [scenario, setScenario] = useState<ScenarioData[]>([]);
  const [boxOptions, setBoxOptions] = useState<string[]>([]);

  const { data: user } = useUser();
  const { data: scenarios } = useScenarios(user?.groupId);

  const handleRangeChange = (event: Event, newValue: number | number[]) => {
    setRange2(newValue as number[]);
  };

  const formatTime = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // NOTE: 처음 랜더링될 때 무조건 MASTER SCENARIO가 선택됨.
  useEffect(() => {
    if (scenarios) {
      // FIXME: 여기 고치기
      setScenario([[...scenarios.scenarios!, ...scenarios?.master_scenario][0]]);
    }
  }, [scenarios]);

  // TODO: Skeleton UI 적용하기
  if (!scenarios) return <div>Loading ...</div>;

  return (
    <div className="mx-auto max-w-[1340px] px-8 pb-24">
      <ContentsHeader text="Home" />

      <SimulationOverview
        className="mt-8"
        // FIXME: 여기 고치기
        items={[...scenarios.scenarios!, ...scenarios?.master_scenario]}
        selectedScenario={scenario}
        onSelectedScenario={setScenario}
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

      <div className="mt-5 flex flex-col">
        <div className={`${activeIndex === 0 ? '' : 'hidden'} flex flex-col gap-2`}>
          <div className="relative flex aspect-[1280/600] flex-grow items-center justify-center rounded-md"></div>

          <div className="relative mt-8 h-24 flex-grow pt-2.5">
            <Slider defaultValue={[50]} />
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
            <MultipleSlider defaultValue={[0, 80]} />
          </div>
        </div>
      </div>

      <HomeAccordion title="Summary">
        <HomeSummary scenario={scenario[0]} />
      </HomeAccordion>

      <HomeAccordion title="Alert & Issues">
        <HomeWarning scenario={scenario[0]} />
      </HomeAccordion>

      <HomeAccordion title="Details">
        <HomeDetails scenario={scenario[0]} />
      </HomeAccordion>

      <HomeAccordion title="Charts">
        <HomeCharts scenario={scenario[0]} />
      </HomeAccordion>
    </div>
  );
}

export default HomePage;
