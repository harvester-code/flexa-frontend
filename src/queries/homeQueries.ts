import { useQuery } from '@tanstack/react-query';
import { fetchStaticData, fetchMetricsData, fetchMissedFlightsData } from '@/services/homeService';
import type { HomeStaticData, HomeMetricsData, MissedFlightsData } from '@/types/homeTypes';

// 정적 데이터 (KPI와 무관한 데이터: flow_chart, histogram, sankey_diagram)
const useStaticData = ({ scenarioId, enabled = true }: { scenarioId?: string; enabled?: boolean }) => {
  return useQuery<HomeStaticData>({
    queryKey: ['home-static-data', scenarioId],
    queryFn: async () => {
      const { data } = await fetchStaticData({ scenarioId: scenarioId! });
      return data;
    },
    enabled: enabled && !!scenarioId,
  });
};

// KPI 메트릭 데이터 (summary, facility_details)
const useMetricsData = ({
  percentile,
  percentileMode,
  scenarioId,
  enabled = true,
}: {
  percentile: number | null;
  percentileMode?: 'cumulative' | 'quantile';
  scenarioId?: string;
  enabled?: boolean;
}) => {
  return useQuery<HomeMetricsData>({
    queryKey: ['home-metrics-data', scenarioId, percentile, percentileMode],
    queryFn: async () => {
      const { data } = await fetchMetricsData({ percentile, percentileMode, scenarioId: scenarioId! });
      return data;
    },
    enabled: enabled && !!scenarioId,
  });
};

// Failed 승객 항공편별 분석 (modal open 시 lazy fetch)
const useMissedFlightsData = ({
  scenarioId,
  enabled = true,
}: {
  scenarioId?: string;
  enabled?: boolean;
}) => {
  return useQuery<MissedFlightsData>({
    queryKey: ['home-missed-flights', scenarioId],
    queryFn: async () => {
      const { data } = await fetchMissedFlightsData({ scenarioId: scenarioId! });
      return data;
    },
    enabled: enabled && !!scenarioId,
  });
};

export { useStaticData, useMetricsData, useMissedFlightsData };
