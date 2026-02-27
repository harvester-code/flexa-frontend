"use client";

import { useMemo, useState } from "react";
import { BarChart3, LineChart, FileText, Image, AlertTriangle } from "lucide-react";
import type { ScenarioData, KpiValue } from "@/types/homeTypes";
import { useStaticData, useMetricsData } from "@/queries/homeQueries";
import { useScenarios } from "@/queries/simulationQueries";
import TheContentHeader from "@/components/TheContentHeader";
import HomeAccordion from "./_components/HomeAccordion";
import HomeCharts from "./_components/HomeCharts";
import HomeDetails from "./_components/HomeDetails";
import HomeScenario from "./_components/HomeScenario";
import HomeSummary from "./_components/HomeSummary";
import HomeTerminalImage from "./_components/HomeTerminalImage";
import type {
  ScenarioTerminalLayout,
  TerminalLayoutZoneRect,
} from "@/types/terminalLayout";

function HomePage() {
  const { data: scenarios, isLoading: isScenariosLoading, isFetching: isScenariosRefetching, refetch: refetchScenarios } = useScenarios();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [kpi, setKpi] = useState<KpiValue>({
    type: "mean",
    percentile: 5,
    cumulative: true,
  });

  // 정적 데이터 (KPI와 무관 - 한 번만 호출하고 캐시)
  const {
    data: staticData,
    isLoading: isStaticLoading,
    isError: isStaticError,
  } = useStaticData({
    scenarioId: scenario?.scenario_id,
    enabled: !!scenario,
  });

  // KPI 메트릭 데이터 (KPI 변경 시 재요청)
  const {
    data: metricsData,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
  } = useMetricsData({
    scenarioId: scenario?.scenario_id,
    percentile: kpi.type === "top" ? (kpi.percentile ?? null) : null,
    percentileMode:
      kpi.type === "top"
        ? kpi.cumulative !== false
          ? "cumulative"
          : "quantile"
        : undefined,
    enabled: !!scenario,
  });

  const terminalLayoutData = useMemo<ScenarioTerminalLayout | null>(() => {
    const rawLayout = (staticData as unknown as { terminalLayout?: unknown })
      ?.terminalLayout;
    if (!rawLayout || typeof rawLayout !== "object") {
      return null;
    }

    const layoutRecord = rawLayout as Record<string, unknown>;
    const zoneAreasRaw = layoutRecord.zoneAreas;

    if (!zoneAreasRaw || typeof zoneAreasRaw !== "object") {
      return null;
    }

    const normalizedZoneAreas: Record<string, TerminalLayoutZoneRect> = {};

    Object.entries(zoneAreasRaw as Record<string, unknown>).forEach(
      ([key, value]) => {
        if (!value || typeof value !== "object") {
          return;
        }

        const rectRecord = value as Record<string, unknown>;
        const x = Number(rectRecord.x);
        const y = Number(rectRecord.y);
        const width = Number(rectRecord.width);
        const height = Number(rectRecord.height);

        if ([x, y, width, height].every((val) => Number.isFinite(val))) {
          normalizedZoneAreas[key] = { x, y, width, height };
        }
      }
    );

    if (Object.keys(normalizedZoneAreas).length === 0) {
      return null;
    }

    const imageUrl = ["imageUrl", "mapUrl", "image_path"].reduce<string | null>(
      (acc, key) => {
        if (acc) return acc;
        const value = layoutRecord[key];
        return typeof value === "string" ? value : acc;
      },
      null
    );

    return {
      imageUrl,
      zoneAreas: normalizedZoneAreas,
    };
  }, [staticData]);

  // 에러 배너 컴포넌트
  const errorBanner = (isStaticError || isMetricsError) && (
    <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>
        Failed to load {isStaticError && isMetricsError ? "analysis data" : isStaticError ? "chart data" : "metrics data"}.
        Please try refreshing the page.
      </span>
    </div>
  );

  return (
    <>
      <TheContentHeader text="Home" />
      <div className="mx-auto max-w-page px-page-x pb-page-b">
        <HomeScenario
          className="mt-8"
          data={scenarios || []}
          scenario={scenario}
          onSelectScenario={setScenario}
          isLoading={isScenariosLoading || isScenariosRefetching}
          onRefetch={refetchScenarios}
          kpi={kpi}
          onKpiChange={setKpi}
        />

        {errorBanner}

        <HomeAccordion
          title="Terminal Layout"
          icon={<Image className="h-5 w-5 text-primary" />}
          className="mt-4"
          open={true}
        >
          <HomeTerminalImage
            scenario={scenario}
            layoutData={terminalLayoutData}
            flowChartData={staticData?.flow_chart ?? null}
          />
        </HomeAccordion>

        <HomeAccordion
          title="Summary"
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          className="mt-12"
          open={true}
        >
          <HomeSummary
            scenario={scenario}
            percentile={kpi.type === "top" ? (kpi.percentile ?? null) : null}
            data={metricsData?.summary}
            isLoading={isMetricsLoading}
          />
        </HomeAccordion>

        <HomeAccordion
          title="Charts"
          icon={<LineChart className="h-5 w-5 text-primary" />}
          open={true}
        >
          <HomeCharts
            scenario={scenario}
            data={{
              flow_chart: staticData?.flow_chart,
              histogram: staticData?.histogram,
              sankey_diagram: staticData?.sankey_diagram,
            }}
            isLoading={isStaticLoading}
          />
        </HomeAccordion>

        <HomeAccordion
          title="Details"
          icon={<FileText className="h-5 w-5 text-primary" />}
          open={true}
        >
          <HomeDetails
            scenario={scenario}
            percentile={kpi.type === "top" ? (kpi.percentile ?? null) : null}
            data={metricsData?.facility_details}
            isLoading={isMetricsLoading}
          />
        </HomeAccordion>
      </div>
    </>
  );
}

export default HomePage;
