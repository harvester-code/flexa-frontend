import { useEffect } from 'react';
import { loadScenarioMetadata } from '@/services/simulationService';

interface UseLoadScenarioDataProps {
  loadCompleteS3Metadata: (s3Response: any) => void;
  loadScenarioProfileMetadata: (metadata: any) => void;
  setCurrentScenarioTab: (tab: number) => void;
  setIsInitialized: (initialized: boolean) => void;
}

export function useLoadScenarioData(
  simulationId: string,
  {
    loadCompleteS3Metadata,
    loadScenarioProfileMetadata,
    setCurrentScenarioTab,
    setIsInitialized,
  }: UseLoadScenarioDataProps
) {
  useEffect(() => {
    const loadScenario = async () => {
      try {
        const { data: s3Data } = await loadScenarioMetadata(simulationId);


        // 메타데이터가 있고 유효한 데이터가 있는 경우
        if (s3Data.metadata && (s3Data.metadata.tabs || s3Data.metadata.context || s3Data.metadata.flight)) {
          // 기존 데이터가 있으면 zustand store에 복원
          loadCompleteS3Metadata(s3Data);

          // ScenarioProfile 데이터가 있으면 별도 처리, 없으면 기본값 설정
          if (s3Data.metadata.tabs?.scenarioProfile) {
            loadScenarioProfileMetadata(s3Data.metadata.tabs.scenarioProfile);
          } else {
            // 🎯 workflow의 availableSteps 마지막 값을 기본 탭으로 설정
            const availableSteps = s3Data.metadata.workflow?.availableSteps || [1];
            const lastAvailableStep = Math.max(...availableSteps);
            const defaultTab = lastAvailableStep - 1; // 0-based 탭 인덱스로 변환
            
            loadScenarioProfileMetadata({
              checkpoint: 'overview',
              scenarioName: `Scenario ${simulationId}`,
              scenarioTerminal: 'unknown',
              scenarioHistory: [],
              availableScenarioTab: lastAvailableStep - 1,
              currentScenarioTab: defaultTab,
            });
          }
        } else {
          // 메타데이터가 없는 경우 (새 시나리오 또는 빈 메타데이터)
          if (s3Data.is_new_scenario) {
          } else {
          }

          // 🔧 새 시나리오인 경우에만 탭을 0으로 초기화
          if (s3Data.is_new_scenario) {
            setCurrentScenarioTab(0);
          }

          loadScenarioProfileMetadata({
            checkpoint: 'overview',
            scenarioName: `Scenario ${simulationId}`,
            scenarioTerminal: 'unknown',
            scenarioHistory: [],
            availableScenarioTab: 2,
            currentScenarioTab: 0,
          });
        }
      } catch (error: any) {
        const isUnauthorized = error?.response?.status === 401;
        const isServerError = error?.response?.status >= 500;

        if (isUnauthorized) {
        } else if (isServerError) {
        } else {
        }

        // 인증 에러, 서버 에러, 또는 네트워크 오류 시 기본값으로 설정
        // 🔧 에러 시에는 첫 번째 탭으로 시작 (안전한 기본값)
        
        loadScenarioProfileMetadata({
          checkpoint: 'overview',
          scenarioName: `Scenario ${simulationId}`,
          scenarioTerminal: 'unknown',
          scenarioHistory: [],
          availableScenarioTab: 2,
          currentScenarioTab: 0, // 에러 시 안전한 기본값
        });
      } finally {
        setIsInitialized(true);
      }
    };

    loadScenario();
  }, [simulationId, loadCompleteS3Metadata, loadScenarioProfileMetadata, setCurrentScenarioTab, setIsInitialized]);
}
