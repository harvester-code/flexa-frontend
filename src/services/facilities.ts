import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = '/api/v1/facilities';

// TODO: 타입 선언하기
const fetchProcesses = (scenario_id: unknown) => {
  return instanceWithAuth.get(BASE_URL + '/processes', {
    params: {
      scenario_id: scenario_id,
    },
  });
};

const fetchKPISummary = (process: string, func: 'mean') => {
  return instanceWithAuth.get(BASE_URL + '/kpis', {
    params: {
      process: process,
      func: func,
    },
  });
};

const fetchKPILineChart = (process: string) => {
  return instanceWithAuth.get(BASE_URL + '/ks-charts', {
    params: {
      process: process,
    },
  });
};

const fetchKPIHeatMapChart = (process: string) => {
  return instanceWithAuth.get(BASE_URL + '/heat-maps', {
    params: {
      process: process,
    },
  });
};

export { fetchProcesses, fetchKPISummary, fetchKPILineChart, fetchKPIHeatMapChart };
