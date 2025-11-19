import { useQuery } from '@tanstack/react-query';
import { ScenariosDataResponse, ScenarioData } from '@/types/homeTypes';
import { fetchScenarios } from '@/services/simulationService';
import { useUser } from './userQueries';

const useScenarios = () => {
  const { data: userInfo } = useUser();
  
  const response = useQuery({
    queryKey: ['scenarios', userInfo?.id], // user_id를 쿼리 키에 포함하여 사용자별 캐시 자동 분리
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
    enabled: !!userInfo?.id, // user_id가 있을 때만 쿼리 실행
    // staleTime, gcTime은 전역 기본값 사용 (5분 캐싱)
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
