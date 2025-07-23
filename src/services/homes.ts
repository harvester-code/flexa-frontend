import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = '/api/v1/homes';

const fetchCommonHomeData = ({ scenarioId }: { scenarioId?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/common-data/${scenarioId}`);
};

const fetchKpiHomeData = ({
  calculate_type,
  percentile,
  scenarioId,
}: {
  calculate_type: string;
  percentile: number | null;
  scenarioId?: string;
}) => {
  return instanceWithAuth.get(`${BASE_URL}/kpi-data/${scenarioId}`, {
    params: {
      calculate_type,
      percentile,
    },
  });
};

const fetchAemosTemplate = ({ scenarioId }: { scenarioId?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/aemos-template/${scenarioId}`);
};

export { fetchCommonHomeData, fetchKpiHomeData, fetchAemosTemplate };
