import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = '/api/v1/facilities';

// TODO: 타입 선언하기
const fetchProcesses = (scenario_id: string) => {
  return instanceWithAuth.get(`${BASE_URL}/processes/scenario-id/${scenario_id}`);
};

const fetchKPISummary = (process: string, func: 'mean', scenarioId: number) => {
  return instanceWithAuth.get(`${BASE_URL}/kpi-summaries/tables/kpi/scenario-id/${scenarioId}`, {
    params: { process, func },
  });
};

const fetchKPILineChart = (process: string, scenarioId: number) => {
  return instanceWithAuth.get(`${BASE_URL}/kpi-summaries/charts/line/scenario-id/${scenarioId}`, {
    params: { process },
  });
};

const fetchKPIHeatMapChart = (process: string, scenarioId: number) => {
  return instanceWithAuth.get(`${BASE_URL}/kpi-summaries/charts/heat-map/scenario-id/${scenarioId}`, {
    params: { process },
  });
};

export { fetchProcesses, fetchKPISummary, fetchKPILineChart, fetchKPIHeatMapChart };
