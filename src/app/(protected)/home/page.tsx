'use client';

import { useEffect, useState } from 'react';
import { ScenarioData } from '@/types/simulations';
import { useCommonHomeData, useKpiHomeData } from '@/queries/homeQueries';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import TheContentHeader from '@/components/TheContentHeader';
import AemosTemplate from './_components/AemosTemplate';
import HomeAccordion from './_components/HomeAccordion';
import HomeCharts from './_components/HomeCharts';
import HomeDetails from './_components/HomeDetails';
import HomeKpiSelector from './_components/HomeKpiSelector';
import HomeScenario from './_components/HomeScenario';
import HomeSummary from './_components/HomeSummary';
import HomeTopView from './_components/HomeTopView';
import HomeTopViewLayoutSetting from './_components/HomeTopViewLayoutSetting';
import HomeWarning from './_components/HomeWarning';

function HomePage() {
  const { data: user } = useUser();
  const { data: scenarios } = useScenarios();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [kpi, setKpi] = useState<{ type: 'mean' | 'top'; percentile?: number }>({ type: 'mean', percentile: 5 });
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
          master_scenario:
            scenarios?.scenarios?.filter((s) => s.scenario_id === scenarios?.scenarios?.[0]?.scenario_id) ?? [],
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


      <HomeAccordion title="Top View" className="mt-4">
        {/* View/Setting 토글 - AEMOS TEMPLATE 스타일 */}
        <div className="mb-4 flex items-center gap-2">
          <button
            className={`rounded-lg border-none px-6 py-2 font-bold shadow transition focus:outline-none ${viewMode === 'view' ? 'bg-[#7C3AED] text-white' : 'bg-[#E5E7EB] text-[#7C3AED]'} hover:brightness-95`}
            style={{ minWidth: '120px', fontSize: '1.05rem' }}
            onClick={() => setViewMode('view')}
          >
            View
          </button>
          <button
            className={`rounded-lg border-none px-6 py-2 font-bold shadow transition focus:outline-none ${viewMode === 'setting' ? 'bg-[#7C3AED] text-white' : 'bg-[#E5E7EB] text-[#7C3AED]'} hover:brightness-95`}
            style={{ minWidth: '120px', fontSize: '1.05rem' }}
            onClick={() => setViewMode('setting')}
          >
            Setting
          </button>
        </div>
        {viewMode === 'view' ? (
          <HomeTopView scenario={scenario} data={allHomeData?.topview_data} isLoading={isLoading} />
        ) : (
          <HomeTopViewLayoutSetting scenario={scenario} data={allHomeData?.topview_service_point} isLoading={isLoading} />
        )}
      </HomeAccordion>

      <AemosTemplate scenario={scenario} />
    </div>
  );
}

export default HomePage;
