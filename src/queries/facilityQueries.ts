import { useQuery } from '@tanstack/react-query';
import {
  fetchKPIHeatMapChart,
  fetchKPILineChart,
  fetchKPISummary,
  fetchPassengerAnalysesBarChart,
  fetchPassengerAnalysesDonutChart,
  fetchProcesses,
} from '@/services/facilities';

const useProcesses = ({ scenarioId }: { scenarioId?: string }) => {
  return useQuery({
    queryKey: ['facilities', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchProcesses({ scenarioId });
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
      const { data: { data } = {} } = await fetchKPISummary({ scenarioId, func, process });
      return data;
    },
    enabled: !!scenarioId && !!process,
  });
};

const useKPILineChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return useQuery({
    queryKey: ['kpi-line-chart', scenarioId, process],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchKPILineChart({ scenarioId, process });
      return data;
    },
    enabled: !!scenarioId && !!process,
  });
};

const useKPIHeatMapChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return useQuery({
    queryKey: ['kpi-heat-map-chart', scenarioId, process],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchKPIHeatMapChart({ scenarioId, process });
      return data;
    },
    enabled: !!scenarioId && !!process,
  });
};

const usePassengerAnalysesBarChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return useQuery({
    queryKey: ['passenger-analysis-bar-chart', scenarioId, process],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchPassengerAnalysesBarChart({ scenarioId, process });
      return data;
    },
    enabled: !!scenarioId && !!process,
  });
};

const usePassengerAnalysesDonutChart = ({ scenarioId, process }: { scenarioId?: string; process?: string }) => {
  return useQuery({
    queryKey: ['passenger-analysis-donut-chart', scenarioId, process],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchPassengerAnalysesDonutChart({ scenarioId, process });
      return data;
    },
    enabled: !!scenarioId && !!process,
  });
};

export {
  useKPISummary,
  useProcesses,
  useKPILineChart,
  useKPIHeatMapChart,
  usePassengerAnalysesBarChart,
  usePassengerAnalysesDonutChart,
};
