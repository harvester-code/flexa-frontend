import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ScenarioData } from '@/types/simulations';
import { SANKEY_COLOR_SCALES } from '@/constants';
import { formatFlowChartLayout } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoScenario from './HomeNoScenario';

const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

interface HomeChartFlowChartProps {
  scenario: ScenarioData | null;
  data?: any; // 배치 API에서 받은 sankey_diagram 데이터
  isLoading?: boolean; // 배치 API 로딩 상태
}

function HomeChartFlowChart({ scenario, data, isLoading: propIsLoading }: HomeChartFlowChartProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const sankey = data;
  const isSankeyChartLoading = propIsLoading || false;

  const [sankeyChartData, setSankeyChartData] = useState<Plotly.Data[]>([]);
  const [layerTitles, setLayerTitles] = useState<string[]>([]);
  useEffect(() => {
    if (!sankey) return;
    const { nodeLabels, layerTitles } = formatFlowChartLayout(sankey.label || []);
    const data: Plotly.Data[] = [
      {
        type: 'sankey',
        orientation: 'h',
        node: {
          pad: 15,
          thickness: 20,
          label: nodeLabels,
          color: SANKEY_COLOR_SCALES,
        },
        link: sankey.link,
      },
    ];
    setSankeyChartData(data);
    setLayerTitles(layerTitles);
  }, [sankey]);
  if (!scenario) {
    return <HomeNoScenario />;
  }
  if (isSankeyChartLoading) {
    return <HomeLoading />;
  }
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pl-5">
        <h5 className="flex h-[50px] items-center text-xl font-semibold">Flow Chart</h5>
      </div>
      <div className="flex flex-col rounded-md border border-default-200 bg-white p-5">
        <div className="relative mb-2 h-8 w-full">
          {layerTitles.map((title, i) => {
            const isLast = i === layerTitles.length - 1;
            return (
              <span
                key={i}
                className="absolute text-base font-bold text-gray-500"
                style={{
                  left: !isLast
                    ? layerTitles.length === 1
                      ? '50%'
                      : `${(100 * i) / (layerTitles.length - 1)}%`
                    : undefined,
                  right: isLast ? 0 : undefined,
                  transform: isLast ? 'none' : 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  marginLeft: i === 0 ? '24px' : undefined,
                }}
              >
                {title}
              </span>
            );
          })}
        </div>
        <SankeyChart
          chartData={sankeyChartData}
          chartLayout={{
            margin: { l: 8, r: 8, b: 8, t: 8 },
            font: { size: 20 },
          }}
        />
      </div>
    </div>
  );
}

export default HomeChartFlowChart;
