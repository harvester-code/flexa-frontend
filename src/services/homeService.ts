import { createAPIService } from '@/lib/axios';

const api = createAPIService('homes');

export const fetchStaticData = ({ scenarioId }: { scenarioId?: string }) => {
  return api.get(`/${scenarioId}/static`);
};

export const fetchMetricsData = ({
  percentile,
  percentileMode,
  scenarioId,
}: {
  percentile: number | null;
  percentileMode?: 'cumulative' | 'quantile';
  scenarioId?: string;
}) => {
  return api.get(`/${scenarioId}/metrics`, {
    params: {
      percentile,
      percentile_mode: percentileMode,
    },
  });
};
