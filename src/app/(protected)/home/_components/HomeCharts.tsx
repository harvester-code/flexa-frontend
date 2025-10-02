import { ScenarioData, FacilityChartsResponse } from '@/types/homeTypes';
import HomeChartFlowChart from './HomeChartFlowChart';
import HomeChartHistogram from './HomeChartHistogram';
import HomeChartHourlyTrends from './HomeChartHourlyTrends';
import HomeFacilityCharts from './HomeFacilityCharts';

interface HomeChartsProps {
  scenario: ScenarioData | null;
  data?: {
    flow_chart?: any;
    histogram?: any;
    sankey_diagram?: any;
  }; // 배치 API에서 받은 차트 데이터들
  isLoading?: boolean; // 배치 API 로딩 상태
  facilityCharts?: FacilityChartsResponse | undefined;
  isFacilityChartsLoading?: boolean;
}

export default function HomeCharts({
  scenario,
  data,
  isLoading,
  facilityCharts,
  isFacilityChartsLoading,
}: HomeChartsProps) {
  return (
    <div className="mt-5 flex flex-col gap-[35px]">
      <HomeChartHourlyTrends scenario={scenario} data={data?.flow_chart} isLoading={isLoading} />
      <HomeChartHistogram scenario={scenario} data={data?.histogram} isLoading={isLoading} />
      <HomeChartFlowChart scenario={scenario} data={data?.sankey_diagram} isLoading={isLoading} />
      <HomeFacilityCharts
        scenario={scenario}
        data={facilityCharts}
        isLoading={isFacilityChartsLoading}
      />
    </div>
  );
}
