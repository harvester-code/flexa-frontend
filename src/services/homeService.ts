import { createAPIService } from '@/lib/axios';
import type { HomeStaticData, HomeMetricsData } from '@/types/homeTypes';

const api = createAPIService('homes');

export const fetchStaticData = ({ scenarioId }: { scenarioId: string }) => {
  return api.get<HomeStaticData>(`/${scenarioId}/static`);
};

export const fetchMetricsData = ({
  percentile,
  percentileMode,
  scenarioId,
}: {
  percentile: number | null;
  percentileMode?: 'cumulative' | 'quantile';
  scenarioId: string;
}) => {
  return api.get<HomeMetricsData>(`/${scenarioId}/metrics`, {
    params: {
      percentile,
      percentile_mode: percentileMode,
    },
  });
};
