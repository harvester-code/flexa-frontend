'use client';

import { useEffect, useState } from 'react';
import { ScenarioData } from '@/types/simulations';
import { useCommonHomeData, useKpiHomeData } from '@/queries/homeQueries';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import TheContentHeader from '@/components/TheContentHeader';
import HomeAccordion from './_components/HomeAccordion';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeKpiSelector from './_components/HomeKpiSelector';
import HomeScenario from './_components/HomeScenario';
import HomeSummary from './_components/HomeSummary';
import HomeWarning from './_components/HomeWarning';

function HomePage() {
  const { data: user } = useUser();
  const { data: scenarios } = useScenarios();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [kpi, setKpi] = useState<{ type: 'mean' | 'top'; percentile?: number }>({ type: 'mean', percentile: 5 });

  // 공통 데이터 (KPI와 무관 - 한 번만 호출하고 캐시)
  const { data: commonData, isLoading: isCommonLoading } = useCommonHomeData({
    scenarioId: scenario?.id,
    enabled: !!scenario,
  });

  // KPI 의존적 데이터 (KPI 변경 시 재요청)
  const { data: kpiData, isLoading: isKpiLoading } = useKpiHomeData({
    scenarioId: scenario?.id,
    calculate_type: kpi.type,
    percentile: kpi.percentile ?? null,
    enabled: !!scenario,
  });

  // 전체 데이터 조합
  const allHomeData = {
    ...commonData,
    ...kpiData,
  };

  // KPI 변경 시에는 공통 데이터 로딩 스피너 제외
  const isLoading = isCommonLoading || isKpiLoading;

  // NOTE: 처음 랜더링될 때 무조건 MASTER SCENARIO가 선택됨.
  useEffect(() => {
    if (scenarios?.scenarios?.[0]) {
      setScenario(scenarios.scenarios[0]);
    }
  }, [scenarios]);

  return (
    <div className="mx-auto max-w-[83.75rem] px-[1.875rem] pb-24">
      <TheContentHeader text="Home" />
      <HomeScenario
        className="mt-8"
        data={{
          master_scenario: scenarios?.scenarios?.filter((s) => s.id === scenarios?.scenarios?.[0]?.id) ?? [],
          user_scenario: scenarios?.scenarios ?? [],
        }}
        scenario={scenario}
        onSelectScenario={setScenario}
      />

      <div className="mt-4 flex items-center justify-start gap-2">
        <HomeKpiSelector value={kpi} onChange={setKpi} />
      </div>
      <HomeAccordion title="Summary" className="mt-4" open={true}>
        <HomeSummary
          scenario={scenario}
          calculate_type={kpi.type}
          percentile={kpi.percentile ?? null}
          data={allHomeData?.summary}
          isLoading={isKpiLoading}
        />
      </HomeAccordion>

      <HomeAccordion title="Alert & Issues" open={true}>
        <HomeWarning scenario={scenario} data={allHomeData?.alert_issues} isLoading={isCommonLoading} />
      </HomeAccordion>

      <HomeAccordion title="Charts" open={true}>
        <HomeCharts
          scenario={scenario}
          data={{
            flow_chart: allHomeData?.flow_chart,
            histogram: allHomeData?.histogram,
            sankey_diagram: allHomeData?.sankey_diagram,
          }}
          isLoading={isCommonLoading}
        />
      </HomeAccordion>

      <HomeAccordion title="Details" open={true}>
        <HomeDetails
          scenario={scenario}
          calculate_type={kpi.type}
          percentile={kpi.percentile ?? null}
          data={allHomeData?.facility_details}
          isLoading={isKpiLoading}
        />
      </HomeAccordion>
    </div>
  );
}

export default HomePage;
