import type { ScenarioData, HomeStaticData } from '@/types/homeTypes';
import HomeChartFlowChart from './HomeChartFlowChart';
import HomeChartHistogram from './HomeChartHistogram';
import HomeChartHourlyTrends from './HomeChartHourlyTrends';

interface HomeChartsProps {
  scenario: ScenarioData | null;
  data?: HomeStaticData;
  isLoading?: boolean;
}

export default function HomeCharts({
  scenario,
  data,
  isLoading,
}: HomeChartsProps) {
  return (
    <div className="mt-5 flex flex-col gap-[35px]">
      <HomeChartHourlyTrends scenario={scenario} data={data?.flow_chart} isLoading={isLoading} />
      <HomeChartHistogram scenario={scenario} data={data?.histogram} isLoading={isLoading} />
      <HomeChartFlowChart scenario={scenario} data={data?.sankey_diagram} isLoading={isLoading} />
    </div>
  );
}
