import { useQuery } from '@tanstack/react-query';
import { ScenariosDataResponse } from '@/types/simulations';
import { fetchScenarios } from '@/services/simulations';

const useScenarios = () => {
  const response = useQuery({
    queryKey: ['scenarios'],
    queryFn: async (): Promise<ScenariosDataResponse> => {
      const { data } = await fetchScenarios();

      const masterScenarios = {};
      for (const rowCur of data?.master_scenario || []) {
        if (rowCur?.scenario_id) {
          masterScenarios[rowCur.scenario_id] = rowCur;
        }
      }

      // NOTE: master_scenario와 user_scenario를 합쳐서 scenarios로 반환
      const scenarios = [
        ...(data?.master_scenario.filter((val) => val != null) || []),
        ...(data?.user_scenario?.filter((val) => val.scenario_id in masterScenarios == false) || []),
      ].sort((a, b) => {
        const aTime = a.simulation_end_at ? new Date(a.simulation_end_at).getTime() : 0;
        const bTime = b.simulation_end_at ? new Date(b.simulation_end_at).getTime() : 0;
        return bTime - aTime;
      });

      return { ...data, scenarios };
    },
  });

  return {
    ...response,
    scenarios: response?.data?.scenarios || [],
  };
};

export { useScenarios };
