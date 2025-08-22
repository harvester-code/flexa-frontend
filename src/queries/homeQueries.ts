import { useQuery } from '@tanstack/react-query';
import { fetchAemosTemplate, fetchCommonHomeData, fetchKpiHomeData } from '@/services/homeService';

// 공통 데이터 (KPI와 무관한 데이터: alert_issues, flow_chart, histogram, sankey_diagram)
const useCommonHomeData = ({ scenarioId, enabled = true }: { scenarioId?: string; enabled?: boolean }) => {
  return useQuery({
    queryKey: ['common-home-data', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchCommonHomeData({ scenarioId });
      return data;
    },
    enabled: enabled && !!scenarioId,
  });
};

// KPI 의존적 데이터 (summary, facility_details)
const useKpiHomeData = ({
  calculate_type,
  percentile,
  scenarioId,
  enabled = true,
}: {
  calculate_type: string;
  percentile: number | null;
  scenarioId?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['kpi-home-data', scenarioId, calculate_type, percentile],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchKpiHomeData({ calculate_type, percentile, scenarioId });
      return data;
    },
    enabled: enabled && !!scenarioId,
  });
};

const useAemosTemplate = ({ scenarioId }: { scenarioId?: string }) => {
  return useQuery({
    queryKey: ['aemos-template', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchAemosTemplate({ scenarioId });
      return data;
    },
    enabled: !!scenarioId,
  });
};

export { useCommonHomeData, useKpiHomeData, useAemosTemplate };
