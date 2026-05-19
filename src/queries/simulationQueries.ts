import { useQuery } from '@tanstack/react-query';
import { ScenariosDataResponse, ScenarioData } from '@/types/homeTypes';
import { fetchScenarios } from '@/services/simulationService';
import { createClient } from '@/lib/auth/client';

const supabase = createClient();

const useScenarios = () => {
  // getSession()은 로컬 스토리지 읽기 (~1ms) — getUser() 외부 API 호출(~40ms) 불필요
  const { data: userId } = useQuery({
    queryKey: ['auth-session-uid'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id ?? null;
    },
    staleTime: 60_000, // 세션 user ID는 자주 바뀌지 않음
  });

  const response = useQuery({
    queryKey: ['scenarios', userId],
    queryFn: async (): Promise<ScenariosDataResponse> => {
      try {
        const { data } = await fetchScenarios();

        const normalized: ScenarioData[] = extractScenarioArray(data);

        const scenarios = [...normalized].sort((a, b) => {
          const aTime = a.metadata_updated_at ? new Date(a.metadata_updated_at).getTime() : 0;
          const bTime = b.metadata_updated_at ? new Date(b.metadata_updated_at).getTime() : 0;
          return bTime - aTime;
        });

        return scenarios;
      } catch (error) {
        console.error('Failed to fetch scenarios:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch scenarios');
      }
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: true,
  });

  return {
    ...response,
    scenarios: response?.data ?? [],
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
