import { useQuery } from '@tanstack/react-query';
import { ScenariosDataResponse } from '@/types/simulations';
import { fetchScenarios } from '@/services/simulations';

const useScenarios = () => {
  const response = useQuery({
    queryKey: ['scenarios'],
    queryFn: () =>
      fetchScenarios().then<ScenariosDataResponse>(({ data }) => {
        const masterScenarios = {};
        for (const rowCur of data?.master_scenario || [])
          if (rowCur?.scenario_id) masterScenarios[rowCur.scenario_id] = rowCur;
        return {
          ...data,
          scenarios: [
            ...(data?.master_scenario.filter((val) => val != null) || []),
            ...(data?.user_scenario?.filter((val) => val.scenario_id in masterScenarios == false) || []),
          ],
        };
      }),
  });

  return {
    ...response,
    scenarios: response?.data?.scenarios || [],
  };
};

export { useScenarios };
