import { useQuery } from '@tanstack/react-query';
import { fetchScenarios } from '@/services/simulations';

const useScenarios = (groupId?: number) => {
  return useQuery({
    queryKey: ['scenarios', groupId],
    queryFn: async () => {
      const { data } = await fetchScenarios(groupId);
      return [...data.master_scenario, ...data.user_scenario];
    },
    enabled: !!groupId,
  });
};

export { useScenarios };
