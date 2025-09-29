import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ScenarioData } from '@/types/homeTypes';
import { COMPONENT_TYPICAL_COLORS } from '@/styles/colors';
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
  const [chartHeight, setChartHeight] = useState<number>(600);

  useEffect(() => {
    if (!sankey) return;

    // 새로운 구조 처리 - process_info가 있으면 새 구조, 없으면 기존 구조
    const layoutData = sankey.process_info ? sankey.process_info : sankey.label || [];
    const { nodeLabels, layerTitles, processInfo } = formatFlowChartLayout(layoutData);

    // 노드 수에 따라 차트 높이 동적 조정
    const nodeCount = nodeLabels.length;
    const dynamicHeight = Math.max(600, nodeCount * 40); // 노드당 40px, 최소 600px
    setChartHeight(dynamicHeight);

    // Skip 노드에 대한 색상 처리
    const nodeColors = nodeLabels.map((label, index) => {
      if (label.includes('Skip')) {
        return '#999999'; // Skip 노드는 회색
      }
      return COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];
    });

    const data: Plotly.Data[] = [
      {
        type: 'sankey',
        orientation: 'h',
        node: {
          pad: 15,
          thickness: 20,
          label: nodeLabels,
          color: nodeColors,
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
        <h5 className="flex h-[50px] items-center text-lg font-semibold">Flow Chart</h5>
      </div>
      <div className="flex flex-col rounded-md border border-input bg-white p-5">
        <div className="relative mb-2 h-8 w-full">
          {layerTitles.map((title, i) => {
            const isLast = i === layerTitles.length - 1;
            return (
              <span
                key={i}
                className="absolute text-sm font-medium text-muted-foreground"
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
        <div style={{ minHeight: `${chartHeight}px` }}>
          <SankeyChart
            chartData={sankeyChartData}
            chartLayout={{
              height: chartHeight,
              margin: { l: 8, r: 8, b: 8, t: 8 },
              font: { size: 14 },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default HomeChartFlowChart;
