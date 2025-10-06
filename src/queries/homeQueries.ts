import { useQuery } from '@tanstack/react-query';
import { fetchStaticData, fetchMetricsData } from '@/services/homeService';
import { fetchFacilityCharts, fetchPassengerSummary } from '@/services/newHomeService';
import { PassengerSummaryResponse } from '@/types/homeTypes';

// 정적 데이터 (KPI와 무관한 데이터: alert_issues, flow_chart, histogram, sankey_diagram)
const useStaticData = ({ scenarioId, enabled = true }: { scenarioId?: string; enabled?: boolean }) => {
  return useQuery({
    queryKey: ['home-static-data', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchStaticData({ scenarioId });
      return data;
    },
    enabled: enabled && !!scenarioId,
  });
};

// KPI 메트릭 데이터 (summary, facility_details)
const useMetricsData = ({
  percentile,
  scenarioId,
  enabled = true,
}: {
  percentile: number | null;
  scenarioId?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['home-metrics-data', scenarioId, percentile],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchMetricsData({ percentile, scenarioId });
      return data;
    },
    enabled: enabled && !!scenarioId,
  });
};

const useFacilityCharts = ({
  scenarioId,
  intervalMinutes = 60,
  enabled = true,
}: {
  scenarioId?: string;
  intervalMinutes?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['home-facility-charts', scenarioId, intervalMinutes],
    queryFn: async () => {
      const {
        data: { data } = {},
      } = await fetchFacilityCharts({ scenarioId, intervalMinutes });
      return data;
    },
    enabled: enabled && !!scenarioId,
    staleTime: 5 * 60 * 1000,
  });
};

const usePassengerSummary = ({
  scenarioId,
  topN = 10,
  enabled = true,
}: {
  scenarioId?: string;
  topN?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['home-passenger-summary', scenarioId, topN],
    queryFn: async (): Promise<PassengerSummaryResponse | undefined> => {
      const {
        data: { data },
      } = await fetchPassengerSummary({ scenarioId, topN });
      return data;
    },
    enabled: enabled && !!scenarioId,
    staleTime: 5 * 60 * 1000,
  });
};

export { useStaticData, useMetricsData, useFacilityCharts, usePassengerSummary };
