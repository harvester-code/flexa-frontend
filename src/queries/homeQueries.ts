import { useQuery } from '@tanstack/react-query';
import { fetchStaticData, fetchMetricsData } from '@/services/homeService';
import { fetchNewHomeDashboard } from '@/services/newHomeService';
import { NewHomeDashboardResponse } from '@/types/homeTypes';

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

const useNewHomeDashboard = ({
  scenarioId,
  enabled = true,
}: {
  scenarioId?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['new-home-dashboard', scenarioId],
    queryFn: async (): Promise<NewHomeDashboardResponse | undefined> => {
      const {
        data: { data },
      } = await fetchNewHomeDashboard({ scenarioId });
      return data;
    },
    enabled: enabled && !!scenarioId,
    staleTime: 5 * 60 * 1000,
  });
};

export { useStaticData, useMetricsData, useNewHomeDashboard };
