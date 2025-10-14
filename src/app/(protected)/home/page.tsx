'use client';

import { useState } from 'react';
import { BarChart3, AlertTriangle, LineChart, FileText } from 'lucide-react';
import { ScenarioData } from '@/types/homeTypes';
import { useStaticData, useMetricsData } from '@/queries/homeQueries';
import { useScenarios } from '@/queries/simulationQueries';
import TheContentHeader from '@/components/TheContentHeader';
import HomeAccordion from './_components/HomeAccordion';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeKpiSelector from './_components/HomeKpiSelector';
import HomeScenario from './_components/HomeScenario';
import HomeSummary from './_components/HomeSummary';
import HomeWarning from './_components/HomeWarning';

// FIXME: 데이터가 있는 시나리오 조회 후 데이터가 없는 시나리오 선택 시 차트 및 기타 데이터가 유지됨.

function HomePage() {
  const { data: scenarios, isLoading: isScenariosLoading } = useScenarios();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [kpi, setKpi] = useState<{ type: 'mean' | 'top'; percentile?: number }>({ type: 'mean', percentile: 5 });

  // 정적 데이터 (KPI와 무관 - 한 번만 호출하고 캐시)
  const { data: staticData, isLoading: isStaticLoading } = useStaticData({
    scenarioId: scenario?.scenario_id,
    enabled: !!scenario,
  });

  // KPI 메트릭 데이터 (KPI 변경 시 재요청)
  const { data: metricsData, isLoading: isMetricsLoading } = useMetricsData({
    scenarioId: scenario?.scenario_id,
    percentile: kpi.type === 'top' ? (kpi.percentile ?? null) : null,
    enabled: !!scenario,
  });

  // 전체 데이터 조합
  const allHomeData = {
    ...staticData,
    ...metricsData,
  };

  return (
    <div className="mx-auto max-w-page px-page-x pb-page-b">
      <TheContentHeader text="Home" />

      <HomeScenario
        className="mt-8"
        data={scenarios || []}
        scenario={scenario}
        onSelectScenario={setScenario}
        isLoading={isScenariosLoading}
      />

      <div className="mt-4 flex items-center justify-start gap-2">
        <HomeKpiSelector value={kpi} onChange={setKpi} />
      </div>

      <HomeAccordion title="Summary" icon={<BarChart3 className="h-5 w-5 text-primary" />} className="mt-4" open={true}>
        <HomeSummary
          scenario={scenario}
          percentile={kpi.type === 'top' ? (kpi.percentile ?? null) : null}
          data={allHomeData?.summary}
          isLoading={isMetricsLoading}
        />
      </HomeAccordion>

      <HomeAccordion title="Alert & Issues" icon={<AlertTriangle className="h-5 w-5 text-primary" />} open={true}>
        <HomeWarning scenario={scenario} data={allHomeData?.alert_issues} isLoading={isStaticLoading} />
      </HomeAccordion>

      <HomeAccordion title="Charts" icon={<LineChart className="h-5 w-5 text-primary" />} open={true}>
        <HomeCharts
          scenario={scenario}
          data={{
            flow_chart: allHomeData?.flow_chart,
            histogram: allHomeData?.histogram,
            sankey_diagram: allHomeData?.sankey_diagram,
          }}
          isLoading={isStaticLoading}
        />
      </HomeAccordion>

      <HomeAccordion title="Details" icon={<FileText className="h-5 w-5 text-primary" />} open={true}>
        <HomeDetails
          scenario={scenario}
          percentile={kpi.type === 'top' ? (kpi.percentile ?? null) : null}
          data={allHomeData?.facility_details}
          isLoading={isMetricsLoading}
        />
      </HomeAccordion>
    </div>
  );
}

export default HomePage;
