import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ScenarioData } from "@/types/homeTypes";
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";
import { formatFlowChartLayout } from "./HomeFormat";
import HomeLoading from "./HomeLoading";
import HomeNoScenario from "./HomeNoScenario";

const SankeyChart = dynamic(() => import("@/components/charts/SankeyChart"), {
  ssr: false,
});

interface HomeChartFlowChartProps {
  scenario: ScenarioData | null;
  data?: any; // 배치 API에서 받은 sankey_diagram 데이터
  isLoading?: boolean; // 배치 API 로딩 상태
}

function HomeChartFlowChart({
  scenario,
  data,
  isLoading: propIsLoading,
}: HomeChartFlowChartProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const sankey = data;
  const isSankeyChartLoading = propIsLoading || false;

  const [sankeyChartData, setSankeyChartData] = useState<Plotly.Data[]>([]);
  const [layerTitles, setLayerTitles] = useState<string[]>([]);
  const [processInfo, setProcessInfo] = useState<any>(null);
  const [chartHeight, setChartHeight] = useState<number>(600);

  useEffect(() => {
    if (!sankey) return;

    // 새로운 구조 처리 - process_info가 있으면 새 구조, 없으면 기존 구조
    const layoutData = sankey.process_info
      ? sankey.process_info
      : sankey.label || [];
    const { nodeLabels, layerTitles, processInfo } =
      formatFlowChartLayout(layoutData);

    // 노드 수에 따라 차트 높이 동적 조정
    const nodeCount = nodeLabels.length;
    const dynamicHeight = Math.max(400, Math.min(nodeCount * 20, 600)); // 노드당 20px, 최소 400px, 최대 600px
    setChartHeight(dynamicHeight);

    // 각 프로세스별로 색상을 COMPONENT_TYPICAL_COLORS 순서대로 할당
    const nodeColors: string[] = [];

    if (processInfo) {
      let currentIndex = 0;

      Object.keys(processInfo).forEach((processKey) => {
        const facilities = processInfo[processKey]?.facilities || [];

        facilities.forEach((facility: string, layerIndex: number) => {
          // Failed와 Skipped는 특별 색상
          if (facility === "Failed") {
            nodeColors.push("#EF4444"); // 빨간색
          } else if (facility === "Skipped" || facility.includes("Skip")) {
            nodeColors.push("#999999"); // 회색
          } else {
            // 나머지는 레이어 내 순서대로 COMPONENT_TYPICAL_COLORS 사용
            nodeColors.push(
              COMPONENT_TYPICAL_COLORS[
                layerIndex % COMPONENT_TYPICAL_COLORS.length
              ]
            );
          }
        });
      });
    } else {
      // processInfo가 없는 경우 기본 처리
      nodeLabels.forEach((label, index) => {
        if (label === "Failed") {
          nodeColors.push("#EF4444");
        } else if (label === "Skipped" || label.includes("Skip")) {
          nodeColors.push("#999999");
        } else {
          nodeColors.push(
            COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length]
          );
        }
      });
    }

    const data: Plotly.Data[] = [
      {
        type: "sankey",
        orientation: "h",
        node: {
          pad: 8,
          thickness: 15,
          label: nodeLabels,
          color: nodeColors,
        },
        link: sankey.link,
      },
    ];
    setSankeyChartData(data);
    setLayerTitles(layerTitles);
    setProcessInfo(processInfo);
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
        <h5 className="flex h-[50px] items-center text-lg font-semibold">
          Flow Chart
        </h5>
      </div>
      <div className="flex flex-col rounded-md border border-input bg-white p-5">
        <div className="relative mb-4 h-12 w-full">
          {layerTitles.map((title, i) => {
            const isLast = i === layerTitles.length - 1;

            // processInfo에서 해당 레이어의 pax_count 찾기
            let paxCount = null;
            if (processInfo) {
              const processKeys = Object.keys(processInfo);
              if (i < processKeys.length) {
                const processKey = processKeys[i];
                paxCount = processInfo[processKey]?.pax_count;
              }
            }

            return (
              <div
                key={i}
                className="absolute flex flex-col items-center"
                style={{
                  left: !isLast
                    ? layerTitles.length === 1
                      ? "50%"
                      : `${(100 * i) / (layerTitles.length - 1)}%`
                    : undefined,
                  right: isLast ? 0 : undefined,
                  transform: isLast ? "none" : "translateX(-50%)",
                  marginLeft: i === 0 ? "24px" : undefined,
                }}
              >
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  {title}
                </span>
                {paxCount !== null && (
                  <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                    {paxCount.toLocaleString()} pax
                  </span>
                )}
              </div>
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
