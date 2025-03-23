import { useQuery } from '@tanstack/react-query';
import { fetchScenarios } from '@/services/simulations';
import { ScenarioData } from '@/types/simulations';

const useScenarios = (groupId?: number) => {
  const response = useQuery({
    queryKey: ['scenarios', groupId],
    queryFn: () =>
      fetchScenarios(groupId).then<ScenarioData[]>((response) => {
        const masterScenarios = {};
        for (const rowCur of response?.data?.master_scenario || [])
          if (rowCur?.id) masterScenarios[rowCur.id] = rowCur;
        return [
          ...(response?.data?.master_scenario.filter((val) => val != null) || []),
          ...(response?.data?.user_scenario?.filter((val) => val.id in masterScenarios == false) || []),
        ];
      }),
    enabled: !!groupId,
  });

  return {
    ...response,
    scenarios: response?.data || [],
  };
};

export { useScenarios };
