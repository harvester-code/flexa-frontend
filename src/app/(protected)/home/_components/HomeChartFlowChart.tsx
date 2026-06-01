import { useMemo } from "react";
import dynamic from "next/dynamic";
import { ScenarioData } from "@/types/homeTypes";
import type { HomeSankeyDiagramData } from "@/types/api/homes/static";
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";
import { formatFlowChartLayout } from "./HomeFormat";
import HomeChartGuard from "./HomeChartGuard";
import HomeChartSection from "./HomeChartSection";

const SankeyChart = dynamic(() => import("@/components/charts/SankeyChart"), {
  ssr: false,
});

interface HomeChartFlowChartProps {
  scenario: ScenarioData | null;
  data?: HomeSankeyDiagramData;
  isLoading?: boolean;
}

function HomeChartFlowChart({
  scenario,
  data,
  isLoading: propIsLoading,
}: HomeChartFlowChartProps) {
  const sankey = data;
  const isSankeyChartLoading = propIsLoading || false;

  const { sankeyChartData, layerTitles, processInfo, chartHeight } = useMemo(() => {
    if (!sankey) {
      return {
        sankeyChartData: [] as Plotly.Data[],
        layerTitles: [] as string[],
        processInfo: null as Record<string, { facilities?: string[]; pax_count?: number }> | null,
        chartHeight: 600,
      };
    }

    const layoutData = sankey.process_info
      ? sankey.process_info
      : sankey.label || [];
    const { nodeLabels, layerTitles, processInfo } =
      formatFlowChartLayout(layoutData);

    const nodeCount = nodeLabels.length;
    const dynamicHeight = Math.max(400, Math.min(nodeCount * 20, 600));
    const nodeColors: string[] = [];

    if (processInfo) {
      Object.keys(processInfo).forEach((processKey) => {
        const facilities = processInfo[processKey]?.facilities || [];

        facilities.forEach((facility: string, layerIndex: number) => {
          if (facility === "Failed") {
            nodeColors.push("#EF4444");
          } else if (facility === "Skipped" || facility.includes("Skip")) {
            nodeColors.push("#999999");
          } else {
            nodeColors.push(
              COMPONENT_TYPICAL_COLORS[
                layerIndex % COMPONENT_TYPICAL_COLORS.length
              ]
            );
          }
        });
      });
    } else {
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

    const chartData: Plotly.Data[] = [
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

    return {
      sankeyChartData: chartData,
      layerTitles,
      processInfo,
      chartHeight: dynamicHeight,
    };
  }, [sankey]);

  return (
    <HomeChartGuard scenario={scenario} isLoading={!!isSankeyChartLoading}>
      <HomeChartSection title="Flow Chart">
        <div className="relative mb-4 h-12 w-full">
          {layerTitles.map((title, i) => {
            const isLast = i === layerTitles.length - 1;

            let paxCount: number | null = null;
            if (processInfo) {
              const processKeys = Object.keys(processInfo);
              if (i < processKeys.length) {
                const processKey = processKeys[i];
                paxCount = processInfo[processKey]?.pax_count ?? null;
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
      </HomeChartSection>
    </HomeChartGuard>
  );
}

export default HomeChartFlowChart;
