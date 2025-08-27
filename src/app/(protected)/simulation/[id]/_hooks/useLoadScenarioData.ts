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

        // S3에서 데이터를 성공적으로 가져왔는지 확인
        if (s3Data.metadata?.tabs && Object.keys(s3Data.metadata.tabs).length > 0) {
          // 기존 데이터가 있으면 복원
          loadCompleteS3Metadata(s3Data);

          // ScenarioProfile 데이터가 있으면 별도 처리, 없으면 기본값 설정
          if (s3Data.metadata.tabs.scenarioProfile) {
            loadScenarioProfileMetadata(s3Data.metadata.tabs.scenarioProfile);
          } else {
            loadScenarioProfileMetadata({
              checkpoint: 'overview',
              scenarioName: `Scenario ${simulationId}`,
              scenarioTerminal: 'unknown',
              scenarioHistory: [],
              availableScenarioTab: 2,
              currentScenarioTab: 0,
            });
          }
        } else {
          // 새 시나리오면 기본값으로 설정하고 첫 번째 탭으로 이동
          setCurrentScenarioTab(0);
          loadScenarioProfileMetadata({
            checkpoint: 'overview',
            scenarioName: `Scenario ${simulationId}`,
            scenarioTerminal: 'unknown',
            scenarioHistory: [],
            availableScenarioTab: 2,
            currentScenarioTab: 0,
          });
        }
      } catch (error) {
        console.error('메타데이터 로드 실패:', error);
        // 실제 오류 시 기본값으로 설정하고 첫 번째 탭으로 이동
        setCurrentScenarioTab(0);
        loadScenarioProfileMetadata({
          checkpoint: 'overview',
          scenarioName: `Scenario ${simulationId}`,
          scenarioTerminal: 'unknown',
          scenarioHistory: [],
          availableScenarioTab: 2,
          currentScenarioTab: 0,
        });
      } finally {
        setIsInitialized(true);
      }
    };

    loadScenario();
  }, [simulationId, loadCompleteS3Metadata, loadScenarioProfileMetadata, setCurrentScenarioTab, setIsInitialized]);
}
