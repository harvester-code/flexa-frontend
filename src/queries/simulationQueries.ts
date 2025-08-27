import { useQuery } from '@tanstack/react-query';
import { ScenariosDataResponse } from '@/types/homeTypes';
import { fetchScenarios } from '@/services/simulationService';

const useScenarios = () => {
  const response = useQuery({
    queryKey: ['scenarios'],
    queryFn: async (): Promise<ScenariosDataResponse> => {
      const { data } = await fetchScenarios();
      
      // 백엔드에서 이미 단순한 배열로 반환하므로 정렬만 적용
      const scenarios = (data || []).sort((a, b) => {
        const aTime = a.simulation_end_at ? new Date(a.simulation_end_at).getTime() : 0;
        const bTime = b.simulation_end_at ? new Date(b.simulation_end_at).getTime() : 0;
        return bTime - aTime;
      });

      return scenarios;
    },
  });

  return {
    ...response,
    scenarios: response?.data || [],
  };
};

export { useScenarios };
