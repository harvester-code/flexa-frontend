'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKPIHeatMapChart, useKPILineChart, useKPISummary, useProcesses } from '@/queries/facilityQueries';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import ContentsHeader from '@/components/ContentsHeader';
import SelectBox from '@/components/SelectBox';
import AppTabs from '@/components/Tabs';
import SimulationOverview from '@/components/popups/SimulationOverview';
import { TabsContent } from '@/components/ui/Tabs';
import FacilityKPISummary from './_components/FacilityKPISummary';
import FacilityPassengerAnalysis from './_components/FacilityPassengerAnalysis';

const TABS: { label: string; value: string }[] = [
  { label: 'KPI Summary', value: 'kpiSummary' },
  { label: 'Passenger Analysis', value: 'passengerAnalysis' },
];

function FacilityPage() {
  const [selectedScenario, setSelectedScenario] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>({});

  const { data: user } = useUser();
  const { data: scenariosData } = useScenarios(user?.groupId);

  const scenarios = useMemo(
    () => (scenariosData ? [...scenariosData.master_scenario, ...scenariosData.user_scenario] : []),
    [scenariosData]
  );

  // ========================================================
  const { data: processesData } = useProcesses(selectedScenario[0]?.id);
  const { data: kpiSummaryData } = useKPISummary(selectedOption.value, 'mean', selectedScenario[0]?.id);
  const { data: kpiLineChartData } = useKPILineChart(selectedOption.value, selectedScenario[0]?.id);
  const { data: kpiHeatMapChartData } = useKPIHeatMapChart(selectedOption.value, selectedScenario[0]?.id);

  // ========================================================
  useEffect(() => {
    if (processesData && processesData.length > 0) {
      setSelectedOption(processesData[0]);
    }
  }, [processesData]);

  return (
    <div className="mx-auto flex min-h-svh max-w-[1340px] flex-col px-[30px] pb-8">
      <ContentsHeader text="Detailed Facilities" />

      <SimulationOverview
        className="mt-[30px]"
        items={scenarios}
        selectedScenario={selectedScenario}
        onSelectedScenario={setSelectedScenario}
      />

      {selectedScenario.length > 0 ? (
        <>
          <div className="relative mt-[30px] flex-1">
            <div className="rounded-md border px-5 py-7">
              <SelectBox
                className="selectCheckin"
                options={processesData}
                selectedOption={selectedOption}
                onSelectedOption={setSelectedOption}
              />
            </div>

            <AppTabs className="mt-[30px]" tabs={TABS}>
              <TabsContent value="kpiSummary">
                <FacilityKPISummary
                  key={selectedOption.value}
                  kpiSummaryData={kpiSummaryData}
                  kpiLineChartData={kpiLineChartData}
                  kpiHeatMapChartData={kpiHeatMapChartData}
                />
              </TabsContent>

              <TabsContent value="passengerAnalysis">
                <FacilityPassengerAnalysis />
              </TabsContent>
            </AppTabs>
          </div>
        </>
      ) : (
        <div className="mt-8 flex flex-1 items-center justify-center bg-slate-100 text-3xl">
          시나리오를 선택해주세요.
        </div>
      )}
    </div>
  );
}

export default FacilityPage;
