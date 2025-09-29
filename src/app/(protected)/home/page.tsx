'use client';

import { useEffect, useState } from 'react';
import { MapPin, BarChart3, AlertTriangle, LineChart, FileText } from 'lucide-react';
import { ScenarioData } from '@/types/homeTypes';
import { useCommonHomeData, useKpiHomeData } from '@/queries/homeQueries';
import { useScenarios } from '@/queries/simulationQueries';
import TheContentHeader from '@/components/TheContentHeader';
import HomeAccordion from './_components/HomeAccordion';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeKpiSelector from './_components/HomeKpiSelector';
import HomeScenario from './_components/HomeScenario';
import HomeSummary from './_components/HomeSummary';
import HomeTopView from './_components/HomeTopView';
import HomeWarning from './_components/HomeWarning';

// FIXME: 데이터가 있는 시나리오 조회 후 데이터가 없는 시나리오 선택 시 차트 및 기타 데이터가 유지됨.

function HomePage() {
  const { data: scenarios } = useScenarios();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [kpi, setKpi] = useState<{ type: 'mean' | 'top'; percentile?: number }>({ type: 'mean', percentile: 5 });
  const [topViewMode, setTopViewMode] = useState<'view' | 'setting'>('view');

  // HACK: 뷰 모드 설정 (view: TopView, setting: TopView 설정)
  const [viewMode, setViewMode] = useState<'view' | 'setting'>('view');

  // 공통 데이터 (KPI와 무관 - 한 번만 호출하고 캐시)
  const { data: commonData, isLoading: isCommonLoading } = useCommonHomeData({
    scenarioId: scenario?.scenario_id,
    enabled: !!scenario,
  });

  // KPI 의존적 데이터 (KPI 변경 시 재요청)
  const { data: kpiData, isLoading: isKpiLoading } = useKpiHomeData({
    scenarioId: scenario?.scenario_id,
    calculate_type: kpi.type,
    percentile: kpi.percentile ?? null,
    enabled: !!scenario,
  });

  // 전체 데이터 조합
  const allHomeData = {
    ...commonData,
    ...kpiData,
  };

  // 처음 랜더링될 때 시나리오 중 가장 최근 실행된 시나리오를 선택
  useEffect(() => {
    if ((scenarios as any)?.scenarios?.[0]) {
      setScenario((scenarios as any).scenarios[0]);
    }
  }, [scenarios]);

  return (
    <div className="mx-auto max-w-page px-page-x pb-page-b">
      <TheContentHeader text="Home" />

      <HomeScenario className="mt-8" data={scenarios || []} scenario={scenario} onSelectScenario={setScenario} />

      <div className="mt-4 flex items-center justify-start gap-2">
        <HomeKpiSelector value={kpi} onChange={setKpi} />
      </div>

      <HomeAccordion title="Top View" icon={<MapPin className="h-5 w-5 text-primary" />} className="mt-4" open={false}>
        <HomeTopView
          isLoading={isCommonLoading}
          scenario={scenario}
          data={allHomeData?.topview_data}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </HomeAccordion>

      <HomeAccordion title="Summary" icon={<BarChart3 className="h-5 w-5 text-primary" />} className="mt-4" open={true}>
        <HomeSummary
          scenario={scenario}
          calculate_type={kpi.type}
          percentile={kpi.percentile ?? null}
          data={allHomeData?.summary}
          commonData={commonData}
          isLoading={isKpiLoading}
        />
      </HomeAccordion>

      <HomeAccordion title="Alert & Issues" icon={<AlertTriangle className="h-5 w-5 text-primary" />} open={true}>
        <HomeWarning scenario={scenario} data={allHomeData?.alert_issues} isLoading={isCommonLoading} />
      </HomeAccordion>

      <HomeAccordion title="Charts" icon={<LineChart className="h-5 w-5 text-primary" />} open={true}>
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

      <HomeAccordion title="Details" icon={<FileText className="h-5 w-5 text-primary" />} open={true}>
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
