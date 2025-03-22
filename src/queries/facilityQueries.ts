import { useQuery } from '@tanstack/react-query';
import {
  fetchKPIHeatMapChart,
  fetchKPILineChart,
  fetchKPISummary,
  fetchProcesses,
} from '@/services/facilities';

const useProcesses = ({ scenarioId }: { scenarioId?: string }) => {
  return useQuery({
    queryKey: ['facilities', scenarioId],
    queryFn: async () => {
      const { data } = await fetchProcesses({ scenarioId });
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useKPISummary = ({
  scenarioId,
  process,
  func,
}: {
  scenarioId?: string;
  process?: string;
  func: string;
}) => {
  return useQuery({
    queryKey: ['kpi-summary', scenarioId, process, func],
    queryFn: async () => {
      const { data } = await fetchKPISummary({ scenarioId, func, process });
      return data;
    },
    enabled: !!scenarioId && !!process,
  });
};

const useKPILineChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return useQuery({
    queryKey: ['kpi-line-chart', scenarioId, process],
    queryFn: async () => {
      const { data } = await fetchKPILineChart({ scenarioId, process });
      return data;
    },
    enabled: !!scenarioId && !!process,
  });
};

const useKPIHeatMapChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return useQuery({
    queryKey: ['kpi-heat-map-chart', scenarioId, process],
    queryFn: async () => {
      const { data } = await fetchKPIHeatMapChart({ scenarioId, process });
      return data;
    },
    enabled: !!scenarioId && !!process,
  });
};

export { useKPISummary, useProcesses, useKPILineChart, useKPIHeatMapChart };
