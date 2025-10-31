import { useQuery } from '@tanstack/react-query';
import { fetchStaticData, fetchMetricsData } from '@/services/homeService';

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

export { useStaticData, useMetricsData };
