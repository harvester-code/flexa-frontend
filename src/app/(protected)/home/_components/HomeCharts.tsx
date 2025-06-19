import { ScenarioData } from '@/types/simulations';
import HomeChartFlowChart from './HomeChartFlowChart';
import HomeChartHistogram from './HomeChartHistogram';
import HomeChartHourlyTrends from './HomeChartHourlyTrends';

interface HomeChartsProps {
  scenario: ScenarioData | null;
}

export default function HomeCharts({ scenario }: HomeChartsProps) {
  return (
    <div className="mt-5 flex flex-col gap-[35px]">
      <HomeChartHourlyTrends scenario={scenario} />
      <HomeChartHistogram scenario={scenario} />
      <HomeChartFlowChart scenario={scenario} />
    </div>
  );
}
