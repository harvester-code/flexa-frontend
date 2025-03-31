import { useQuery } from '@tanstack/react-query';
import {
  fetchAlertIssues,
  fetchFacilityDetails,
  fetchHistogram,
  fetchLineChart,
  fetchSankeyChart,
  fetchSummaries,
} from '@/services/homes';

const useSummaries = ({
  calculate_type,
  percentile,
  scenarioId,
}: {
  calculate_type: string;
  percentile?: number;
  scenarioId?: string;
}) => {
  return useQuery({
    queryKey: ['summaries', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchSummaries({ calculate_type, percentile, scenarioId });
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useAlertIssues = ({ scenarioId }: { scenarioId?: string }) => {
  return useQuery({
    queryKey: ['alert-issues', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchAlertIssues({ scenarioId });
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useFacilityDetails = ({
  calculate_type,
  percentile,
  scenarioId,
}: {
  calculate_type: string;
  percentile?: number;
  scenarioId?: string;
}) => {
  return useQuery({
    queryKey: ['facility-details', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchFacilityDetails({ calculate_type, percentile, scenarioId });
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useLineChart = ({ scenarioId }: { scenarioId?: string }) => {
  return useQuery({
    queryKey: ['home-line-chart', scenarioId],
    queryFn: async () => {
      const { data } = await fetchLineChart({ scenarioId });
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useHistogramChart = ({ scenarioId }: { scenarioId?: string }) => {
  return useQuery({
    queryKey: ['home-histogram-chart', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchHistogram({ scenarioId });
      return data;
    },
    enabled: !!scenarioId,
  });
};

const useSankeyChart = ({ scenarioId }: { scenarioId?: string }) => {
  return useQuery({
    queryKey: ['home-sankey-chart', scenarioId],
    queryFn: async () => {
      const { data: { data } = {} } = await fetchSankeyChart({ scenarioId });
      return data;
    },
    enabled: !!scenarioId,
  });
};

export { useSummaries, useAlertIssues, useFacilityDetails, useLineChart, useHistogramChart, useSankeyChart };
