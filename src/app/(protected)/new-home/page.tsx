'use client';

import { useEffect, useState } from 'react';
import { Plane, BarChart3, Layers3 } from 'lucide-react';
import TheContentHeader from '@/components/TheContentHeader';
import HomeAccordion from '@/app/(protected)/home/_components/HomeAccordion';
import HomeScenario from '@/app/(protected)/home/_components/HomeScenario';
import { ScenarioData } from '@/types/homeTypes';
import { useNewHomeDashboard } from '@/queries/homeQueries';
import { useScenarios } from '@/queries/simulationQueries';
import PassengerSummary from './_components/PassengerSummary';
import FlightSummary from './_components/FlightSummary';
import HomeFacilityCharts from './_components/HomeFacilityCharts';

function NewHomePage() {
  const { data: scenarios, isLoading: isScenariosLoading } = useScenarios();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [kpi, setKpi] = useState<{ type: 'mean' | 'top'; percentile?: number }>({ type: 'mean', percentile: 5 });

  useEffect(() => {
    if ((scenarios as any)?.scenarios?.[0]) {
      setScenario((scenarios as any).scenarios[0]);
    }
  }, [scenarios]);

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isFetching: isDashboardFetching,
  } = useNewHomeDashboard({
    scenarioId: scenario?.scenario_id,
    enabled: !!scenario,
  });

  const flightSummaryData = dashboardData?.flightSummary;
  const passengerSummaryData = dashboardData?.passengerSummary;
  const facilityChartsData = dashboardData?.facilityCharts;
  const isAggregatedLoading = isDashboardLoading || isDashboardFetching;

  return (
    <>
      <TheContentHeader text="New Home" />
      <div className="mx-auto max-w-page px-page-x pb-page-b">
        <HomeScenario
          className="mt-8"
          data={scenarios || []}
          scenario={scenario}
          onSelectScenario={setScenario}
          isLoading={isScenariosLoading}
          kpi={kpi}
          onKpiChange={setKpi}
        />

      <HomeAccordion title="Flight Insights" icon={<Plane className="h-5 w-5 text-primary" />} className="mt-4" open>
        <FlightSummary
          scenario={scenario}
          summary={flightSummaryData}
          isLoading={isAggregatedLoading}
        />
      </HomeAccordion>

      <HomeAccordion title="Passenger Insights" icon={<BarChart3 className="h-5 w-5 text-primary" />} className="mt-4" open>
        <PassengerSummary
          scenario={scenario}
          summary={passengerSummaryData}
          isLoading={isAggregatedLoading}
        />
      </HomeAccordion>

      <HomeAccordion title="Facility Insights" icon={<Layers3 className="h-5 w-5 text-primary" />} open>
        <HomeFacilityCharts
          scenario={scenario}
          data={facilityChartsData}
          isLoading={isAggregatedLoading}
        />
      </HomeAccordion>
      </div>
    </>
  );
}

export default NewHomePage;
