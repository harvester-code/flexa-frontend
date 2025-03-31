import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = '/api/v1/facilities';

// TODO: 타입 선언하기
const fetchProcesses = ({ scenarioId }: { scenarioId?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/processes/scenario-id/${scenarioId}`);
};

const fetchKPISummary = ({
  scenarioId,
  func,
  process,
}: {
  scenarioId?: string;
  func: string;
  process?: string;
}) => {
  return instanceWithAuth.get(`${BASE_URL}/kpi-summaries/tables/kpi/scenario-id/${scenarioId}`, {
    params: { process, func },
  });
};

const fetchKPILineChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/kpi-summaries/charts/line/scenario-id/${scenarioId}`, {
    params: { process },
  });
};

const fetchKPIHeatMapChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/kpi-summaries/charts/heat-map/scenario-id/${scenarioId}`, {
    params: { process },
  });
};

const fetchPassengerAnalysesBarChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return instanceWithAuth.get(`${BASE_URL}/passenger-analyses/charts/bar/scenario-id/${scenarioId}`, {
    params: { process },
  });
};

const fetchPassengerAnalysesDonutChart = ({
  scenarioId,
  process,
}: {
  scenarioId?: string;
  process?: string;
}) => {
  return instanceWithAuth.get(`${BASE_URL}/passenger-analyses/charts/pie/scenario-id/${scenarioId}`, {
    params: { process },
  });
};

export {
  fetchKPISummary,
  fetchKPILineChart,
  fetchKPIHeatMapChart,
  fetchPassengerAnalysesBarChart,
  fetchPassengerAnalysesDonutChart,
  fetchProcesses,
};
