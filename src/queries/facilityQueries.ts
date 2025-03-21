import { useQuery } from '@tanstack/react-query';
import {
  fetchKPIHeatMapChart,
  fetchKPILineChart,
  fetchKPISummary,
  fetchProcesses,
} from '@/services/facilities';

const useProcesses = (scenarioId: string) => {
  return useQuery({
    queryKey: ['facilities', scenarioId],
    queryFn: async () => {
      const { data } = await fetchProcesses(scenarioId);
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useKPISummary = (process: string, func: 'mean', scenarioId: number) => {
  return useQuery({
    queryKey: ['kpi-summary', process, func, scenarioId],
    queryFn: async () => {
      const { data } = await fetchKPISummary(process, func, scenarioId);
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useKPILineChart = (process: string, scenarioId: number) => {
  return useQuery({
    queryKey: ['kpi-line-chart', process, scenarioId],
    queryFn: async () => {
      const { data } = await fetchKPILineChart(process, scenarioId);
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useKPIHeatMapChart = (process: string, scenarioId: number) => {
  return useQuery({
    queryKey: ['kpi-heat-map-chart', process, scenarioId],
    queryFn: async () => {
      const { data } = await fetchKPIHeatMapChart(process, scenarioId);
      return data;
    },
    enabled: !!scenarioId,
  });
};

export { useKPISummary, useProcesses, useKPILineChart, useKPIHeatMapChart };
