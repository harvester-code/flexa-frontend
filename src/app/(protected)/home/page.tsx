"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, LineChart, FileText, Image as ImageIcon, AlertTriangle, Loader2 } from "lucide-react";
import type { ScenarioData, KpiValue } from "@/types/homeTypes";
import { isHomeAnalysisReady, isSimulationPipelineActive } from "@/types/homeTypes";
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
  const {
    data: scenarios,
    isLoading: isScenariosLoading,
    isFetching: isScenariosRefetching,
    refetch: refetchScenarios,
  } = useScenarios();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);

  const resolvedScenario = useMemo(() => {
    if (!scenario?.scenario_id || !scenarios?.length) return scenario;
    const fresh = scenarios.find((s) => s.scenario_id === scenario.scenario_id);
    if (!fresh) return scenario;
    if (
      fresh.simulation_status !== scenario.simulation_status ||
      fresh.home_cache_status !== scenario.home_cache_status ||
      fresh.has_simulation_data !== scenario.has_simulation_data ||
      fresh.has_home_static_cache !== scenario.has_home_static_cache
    ) {
      return fresh;
    }
    return scenario;
  }, [scenario, scenarios]);

  // Home 진입 시 시나리오 플래그 최신화 (5분 stale 캐시로 L2 완료가 반영 안 되는 문제 방지)
  useEffect(() => {
    void refetchScenarios();
  }, [refetchScenarios]);

  const [kpi, setKpi] = useState<KpiValue>({
    type: "mean",
    percentile: 5,
    cumulative: true,
  });

  const isAnalysisReady = isHomeAnalysisReady(resolvedScenario);

  // 정적 데이터 (KPI와 무관 - 한 번만 호출하고 캐시)
  const {
    data: staticData,
    isLoading: isStaticLoading,
    isError: isStaticError,
  } = useStaticData({
    scenarioId: resolvedScenario?.scenario_id,
    enabled: !!resolvedScenario && isAnalysisReady,
  });

  // KPI 메트릭 데이터 (KPI 변경 시 재요청)
  const {
    data: metricsData,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
  } = useMetricsData({
    scenarioId: resolvedScenario?.scenario_id,
    percentile: kpi.type === "top" ? (kpi.percentile ?? null) : null,
    percentileMode:
      kpi.type === "top"
        ? kpi.cumulative !== false
          ? "cumulative"
          : "quantile"
        : undefined,
    enabled: !!resolvedScenario && isAnalysisReady,
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

  const waitingBanner = resolvedScenario && !isAnalysisReady && (
    <div className="mt-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-default-700">
      {isSimulationPipelineActive(resolvedScenario) ? (
        <>
          <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-primary" />
          <span>
            Simulation or analysis is still running. You can open this scenario after analysis (L2) completes.
          </span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <span>
            Analysis data is not ready yet. Run simulation and wait for analysis to finish, then select this scenario again.
          </span>
        </>
      )}
    </div>
  );

  // 분석 준비 완료 후에만 API 실패를 에러로 표시 (준비 전 빈 화면/오탐 방지)
  const errorBanner =
    isAnalysisReady &&
    (isStaticError || isMetricsError) && (
      <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          Failed to load{" "}
          {isStaticError && isMetricsError
            ? "analysis data"
            : isStaticError
              ? "chart data"
              : "metrics data"}
          . Please try refreshing the page.
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
          scenario={resolvedScenario}
          onSelectScenario={setScenario}
          isLoading={isScenariosLoading || isScenariosRefetching}
          kpi={kpi}
          onKpiChange={setKpi}
        />

        {waitingBanner}
        {errorBanner}

        <HomeAccordion
          title="Terminal Layout"
          icon={<ImageIcon className="h-5 w-5 text-primary" aria-hidden="true" />}
          className="mt-4"
          open={true}
        >
          <HomeTerminalImage
            scenario={resolvedScenario}
            layoutData={isAnalysisReady ? terminalLayoutData : null}
            flowChartData={isAnalysisReady ? (staticData?.flow_chart ?? null) : null}
          />
        </HomeAccordion>

        <HomeAccordion
          title="Summary"
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          className="mt-12"
          open={true}
        >
          <HomeSummary
            scenario={resolvedScenario}
            percentile={kpi.type === "top" ? (kpi.percentile ?? null) : null}
            data={isAnalysisReady ? metricsData?.summary : undefined}
            isLoading={isAnalysisReady && isMetricsLoading}
          />
        </HomeAccordion>

        <HomeAccordion
          title="Charts"
          icon={<LineChart className="h-5 w-5 text-primary" />}
          open={true}
        >
          <HomeCharts
            scenario={resolvedScenario}
            data={
              isAnalysisReady
                ? {
                    flow_chart: staticData?.flow_chart,
                    histogram: staticData?.histogram,
                    sankey_diagram: staticData?.sankey_diagram,
                  }
                : undefined
            }
            isLoading={isAnalysisReady && isStaticLoading}
          />
        </HomeAccordion>

        <HomeAccordion
          title="Details"
          icon={<FileText className="h-5 w-5 text-primary" />}
          open={true}
        >
          <HomeDetails
            scenario={resolvedScenario}
            percentile={kpi.type === "top" ? (kpi.percentile ?? null) : null}
            data={isAnalysisReady ? metricsData?.facility_details : undefined}
            isLoading={isAnalysisReady && isMetricsLoading}
          />
        </HomeAccordion>
      </div>
    </>
  );
}

export default HomePage;
