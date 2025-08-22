import { createAPIService } from '@/lib/axios';

const api = createAPIService('homes');

export const fetchCommonHomeData = ({ scenarioId }: { scenarioId?: string }) => {
  return api.get(`/common-data/${scenarioId}`);
};

export const fetchKpiHomeData = ({
  calculate_type,
  percentile,
  scenarioId,
}: {
  calculate_type: string;
  percentile: number | null;
  scenarioId?: string;
}) => {
  return api.get(`/kpi-data/${scenarioId}`, {
    params: {
      calculate_type,
      percentile,
    },
  });
};

export const fetchAemosTemplate = ({ scenarioId }: { scenarioId?: string }) => {
  return api.get(`/aemos-template/${scenarioId}`);
};
