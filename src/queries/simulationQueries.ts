import { useQuery } from '@tanstack/react-query';
import { ScenariosDataResponse, ScenarioData } from '@/types/homeTypes';
import { fetchScenarios } from '@/services/simulationService';

const useScenarios = () => {
  const response = useQuery({
    queryKey: ['scenarios'],
    queryFn: async (): Promise<ScenariosDataResponse> => {
      try {
        const { data } = await fetchScenarios();

        const normalized: ScenarioData[] = extractScenarioArray(data);

        const scenarios = [...normalized].sort((a, b) => {
          const aTime = a.simulation_start_at ? new Date(a.simulation_start_at).getTime() : 0;
          const bTime = b.simulation_start_at ? new Date(b.simulation_start_at).getTime() : 0;
          return bTime - aTime;
        });

        return scenarios;
      } catch (error) {
        console.error('Failed to fetch scenarios:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch scenarios');
      }
    },
  });

  return {
    ...response,
    scenarios: response?.data || [],
  };
};

type ScenarioApiPayload =
  | ScenarioData[]
  | {
      data?: ScenarioData[];
      results?: ScenarioData[];
    };

const extractScenarioArray = (payload: ScenarioApiPayload | undefined): ScenarioData[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.data && Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload?.results && Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
};

export { useScenarios };
