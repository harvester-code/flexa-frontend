'use client';

import { useEffect, useState } from 'react';
import { TabsContent } from '@radix-ui/react-tabs';
import { getScenarioList } from '@/api/simulations';
import ContentsHeader from '@/components/ContentsHeader';
import SelectBox from '@/components/SelectBox';
import AppTabs from '@/components/Tabs';
import SimulationOverview from '@/components/popups/SimulationOverview';
import FacilityKPISummary from './_components/FacilityKPISummary';
import FacilityPassengerAnalysis from './_components/FacilityPassengerAnalysis';

function FacilityPage() {
  const TAB_MENUS: { label: string; value: string }[] = [
    { label: 'KPI Summary', value: 'kpiSummary' },
    { label: 'Passenger Analysis', value: 'passengerAnalysis' },
  ];

  const [scenarios, setScenarios] = useState();
  const selectedScenario = ['hello world'];

  return (
    <>
      <ContentsHeader text="Detailed Facilities" />

      <SimulationOverview className="mt-[30px]" selectedItem={selectedScenario} />

      <div className="mt-[30px] rounded-md border px-5 py-7">
        <SelectBox className="selectCheckin" options={['Check-in', 'Security']} />
      </div>

      {/* HACK: 아래 코드 구조 개선해보기 */}
      {/* <AppTabs className="mt-[30px]" tabs={TAB_MENUS}>
        <TabsContent value={TAB_MENUS[0].value}>
          <FacilityKPISummary />
        </TabsContent>

        <TabsContent value={TAB_MENUS[1].value}>
          <FacilityPassengerAnalysis />
        </TabsContent>
      </AppTabs> */}
    </>
  );
}

export default FacilityPage;
