import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = '/api/v1/homes';

const fetchPassengerPoints = ({ scenarioId }: { scenarioId?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/line-queue/${scenarioId}`);
};

const fetchSummaries = ({
  calculate_type,
  percentile,
  scenarioId,
}: {
  calculate_type: string;
  percentile: number | null;
  scenarioId?: string;
}) => {
  return instanceWithAuth.get(`${BASE_URL}/summaries/${scenarioId}`, {
    params: {
      calculate_type,
      percentile,
    },
  });
};

const fetchAlertIssues = ({ scenarioId }: { scenarioId?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/alert-issues/${scenarioId}`);
};

const fetchFacilityDetails = ({
  calculate_type,
  percentile,
  scenarioId,
}: {
  calculate_type: string;
  percentile: number | null;
  scenarioId?: string;
}) => {
  return instanceWithAuth.get(`${BASE_URL}/facility-details/${scenarioId}`, {
    params: {
      calculate_type,
      percentile,
    },
  });
};

const fetchLineChart = ({ scenarioId }: { scenarioId?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/charts/flow-chart/${scenarioId}`);
};

const fetchHistogram = ({ scenarioId }: { scenarioId?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/charts/histogram/${scenarioId}`);
};

const fetchSankeyChart = ({ scenarioId }: { scenarioId?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/charts/sankey-diagram/${scenarioId}`);
};

export {
  fetchAlertIssues,
  fetchFacilityDetails,
  fetchHistogram,
  fetchLineChart,
  fetchPassengerPoints,
  fetchSankeyChart,
  fetchSummaries,
};
