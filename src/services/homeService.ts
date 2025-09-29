import { createAPIService } from '@/lib/axios';

const api = createAPIService('homes');

export const fetchStaticData = ({ scenarioId }: { scenarioId?: string }) => {
  return api.get(`/${scenarioId}/static`);
};

export const fetchMetricsData = ({
  percentile,
  scenarioId,
}: {
  percentile: number | null;
  scenarioId?: string;
}) => {
  return api.get(`/${scenarioId}/metrics`, {
    params: {
      percentile,
    },
  });
};
