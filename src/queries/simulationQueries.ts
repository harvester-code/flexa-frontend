import { useQuery } from '@tanstack/react-query';
import { ScenariosDataResponse } from '@/types/simulations';
import { fetchScenarios } from '@/services/simulations';

const useScenarios = (groupId?: number, page: number = 1) => {
  const response = useQuery({
    queryKey: ['scenarios', groupId, page],
    queryFn: () =>
      fetchScenarios(groupId, page).then<ScenariosDataResponse>(({ data }) => {
        const masterScenarios = {};
        for (const rowCur of data?.master_scenario || []) if (rowCur?.id) masterScenarios[rowCur.id] = rowCur;
        return {
          ...data,
          scenarios: [
            ...(data?.master_scenario.filter((val) => val != null) || []),
            ...(data?.user_scenario?.filter((val) => val.id in masterScenarios == false) || []),
          ],
        };
      }),
    enabled: !!groupId,
  });

  return {
    ...response,
    page: response?.data?.page || 1,
    totalCount: response?.data?.total_count || 0,
    scenarios: response?.data?.scenarios || [],
  };
};

export { useScenarios };
