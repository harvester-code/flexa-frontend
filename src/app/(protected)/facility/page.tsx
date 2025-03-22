'use client';

import { useEffect, useState } from 'react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useKPIHeatMapChart, useKPILineChart, useKPISummary, useProcesses } from '@/queries/facilityQueries';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import ContentsHeader from '@/components/ContentsHeader';
import AppTabs from '@/components/Tabs';
import SimulationOverview from '@/components/popups/SimulationOverview';
import { TabsContent } from '@/components/ui/Tabs';
import FacilityDropdownMenu from './_components/FacilityDropdownMenu';
import FacilityKPISummary from './_components/FacilityKPISummary';
import FacilityPassengerAnalysis from './_components/FacilityPassengerAnalysis';

const TABS: Option[] = [
  { label: 'KPI Summary', value: 'kpiSummary' },
  { label: 'Passenger Analysis', value: 'passengerAnalysis' },
];

function FacilityPage() {
  const { data: user } = useUser();
  const { data: scenarios } = useScenarios(user?.groupId);
  const { data: processes } = useProcesses({ scenarioId: scenarios?.[0].id });

  const [selectedScenario, setSelectedScenario] = useState<ScenarioData[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Option>();
  const [selectedFunc, setSelectedFunc] = useState('min');

  // NOTE: 처음 랜더링될 때 무조건 MASTER SCENARIO가 선택됨.
  useEffect(() => {
    if (scenarios) {
      setSelectedScenario([scenarios[0]]);
    }
  }, [scenarios]);

  // NOTE: 선택된 SCENARIO의 첫번째 PROCESS가 선택됨.
  useEffect(() => {
    if (processes) {
      setSelectedProcess(processes[0]);
    }
  }, [processes]);

  const { data: kpiSummaryData } = useKPISummary({
    scenarioId: selectedScenario?.[0]?.id,
    process: selectedProcess?.value,
    func: selectedFunc,
  });
  const { data: kpiLineChartData } = useKPILineChart({
    scenarioId: selectedScenario?.[0]?.id,
    process: selectedProcess?.value,
  });
  const { data: kpiHeatMapChartData } = useKPIHeatMapChart({
    scenarioId: selectedScenario?.[0]?.id,
    process: selectedProcess?.value,
  });

  // TODO: Skeleton UI 적용하기
  if (!scenarios || !processes) return <div>Loading ...</div>;

  return (
    <div className="mx-auto flex min-h-svh max-w-[1340px] flex-col px-[30px] pb-8">
      <ContentsHeader text="Detailed Facilities" />

      <SimulationOverview
        className="mt-[30px]"
        items={scenarios}
        selectedScenario={selectedScenario}
        onSelectedScenario={setSelectedScenario}
      />

      {/* TODO: Skeleton UI 적용하기 */}
      <div className="relative mt-[30px] flex-1">
        <div className="rounded-md border bg-default-50 px-5 py-7">
          <FacilityDropdownMenu
            items={processes}
            label={selectedProcess?.label ?? ''}
            onSelect={(item) => setSelectedProcess(item)}
          />
        </div>

        <AppTabs className="mt-[30px]" tabs={TABS}>
          <TabsContent value="kpiSummary">
            <FacilityKPISummary
              kpiSummaryData={kpiSummaryData}
              kpiLineChartData={kpiLineChartData}
              kpiHeatMapChartData={kpiHeatMapChartData}
              onChange={setSelectedFunc}
            />
          </TabsContent>

          <TabsContent value="passengerAnalysis">
            <FacilityPassengerAnalysis />
          </TabsContent>
        </AppTabs>
      </div>
    </div>
  );
}

export default FacilityPage;
