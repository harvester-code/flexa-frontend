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
    setCurrentScenarioTab(0);

    const loadScenario = async () => {
      try {
        const { data: s3Data } = await loadScenarioMetadata(simulationId);

        // S3에서 데이터를 성공적으로 가져왔는지 확인
        if (s3Data.metadata?.tabs?.overview && Object.keys(s3Data.metadata.tabs.overview).length > 0) {
          // 기존 데이터가 있으면 복원
          loadCompleteS3Metadata(s3Data);
        } else {
          // 새 시나리오면 기본값으로 설정
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
        // 실제 오류 시 기본값으로 설정
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
