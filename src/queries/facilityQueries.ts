import { useQuery } from '@tanstack/react-query';
import {
  fetchKPIHeatMapChart,
  fetchKPILineChart,
  fetchKPISummary,
  fetchProcesses,
} from '@/services/facilities';

const useProcesses = (scenarioId?: unknown) => {
  return useQuery({
    queryKey: ['facilities', scenarioId],
    queryFn: async () => {
      const { data } = await fetchProcesses(scenarioId);
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useKPISummary = (process: string, func: 'mean') => {
  return useQuery({
    queryKey: ['kpi-summary', process, func],
    queryFn: async () => {
      const { data } = await fetchKPISummary(process, func);
      return data;
    },
    enabled: !!process,
  });
};

const useKPILineChart = (process: string) => {
  return useQuery({
    queryKey: ['kpi-line-chart', process],
    queryFn: async () => {
      const { data } = await fetchKPILineChart(process);
      return data;
    },
    enabled: !!process,
  });
};

const useKPIHeatMapChart = (process: string) => {
  return useQuery({
    queryKey: ['kpi-heat-map-chart', process],
    queryFn: async () => {
      const { data } = await fetchKPIHeatMapChart(process);
      return data;
    },
    enabled: !!process,
  });
};

export { useKPISummary, useProcesses, useKPILineChart, useKPIHeatMapChart };
