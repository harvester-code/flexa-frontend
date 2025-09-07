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

        console.log('🔍 S3에서 받아온 전체 데이터:', s3Data);
        console.log('🔍 S3 metadata 구조:', s3Data.metadata);
        console.log('🔍 S3 metadata.tabs 구조:', s3Data.metadata?.tabs);

        // 메타데이터가 있고 유효한 데이터가 있는 경우
        if (s3Data.metadata && (s3Data.metadata.tabs || s3Data.metadata.context || s3Data.metadata.flight)) {
          console.log('✅ S3에서 유효한 메타데이터를 발견했습니다. 복원을 시작합니다.');
          // 기존 데이터가 있으면 zustand store에 복원
          loadCompleteS3Metadata(s3Data);

          // ScenarioProfile 데이터가 있으면 별도 처리, 없으면 기본값 설정
          if (s3Data.metadata.tabs?.scenarioProfile) {
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
          // 메타데이터가 없는 경우 (새 시나리오 또는 빈 메타데이터)
          if (s3Data.is_new_scenario) {
            console.log('📄 새 시나리오입니다. 기본값으로 초기화합니다.');
          } else {
            console.log('📭 메타데이터가 비어있습니다. 기본값으로 초기화합니다.');
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
          console.log('🔐 인증이 필요하거나 만료되었습니다. 기본값으로 진행합니다.');
          console.log('인증 에러:', error?.response?.data?.detail || error.message);
        } else if (isServerError) {
          console.log('🔧 서버 에러로 메타데이터를 불러올 수 없습니다. 기본값으로 진행합니다.');
          console.log('상세 에러:', error?.response?.data?.detail || error.message);
        } else {
          console.error('⚠️ 메타데이터 로드 중 네트워크 오류 발생:', error);
        }

        // 인증 에러, 서버 에러, 또는 네트워크 오류 시 기본값으로 설정
        // 🔧 에러 시에도 탭을 강제로 0으로 리셋하지 않음 (사용자가 선택한 탭 유지)
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
