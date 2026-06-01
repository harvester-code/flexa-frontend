import { useEffect } from "react";
import type {
  MetadataLoadResponse,
  ScenarioProfileMetadata,
} from "@/types/api/simulations";

interface UseLoadScenarioDataProps {
  loadCompleteS3Metadata: (s3Response: MetadataLoadResponse) => void;
  loadScenarioProfileMetadata: (metadata: ScenarioProfileMetadata) => void;
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
        const { useSimulationStore } = await import("../_stores/store");
        const currentState = useSimulationStore.getState();
        const currentScenarioId = currentState.context.scenarioId;

        if (currentScenarioId !== simulationId) {
          useSimulationStore.getState().resetStore();
          useSimulationStore.getState().setScenarioId(simulationId);
        }

        const { data: s3Data } = await loadScenarioMetadata(simulationId);
        const metadata = s3Data.metadata;

        if (
          metadata &&
          (metadata.tabs ||
            metadata.context ||
            metadata.flight ||
            metadata.passenger ||
            metadata.process_flow ||
            metadata.workflow)
        ) {
          loadCompleteS3Metadata(s3Data);

          const profile = metadata.tabs?.scenarioProfile;
          if (profile) {
            loadScenarioProfileMetadata(profile);
          } else {
            const availableSteps = metadata.workflow?.availableSteps || [1];
            const lastAvailableStep = Math.max(...availableSteps);
            const defaultTab = lastAvailableStep - 1;

            loadScenarioProfileMetadata({
              checkpoint: "overview",
              scenarioName: `Scenario ${simulationId}`,
              scenarioTerminal: "unknown",
              scenarioHistory: [],
              availableScenarioTab: lastAvailableStep - 1,
              currentScenarioTab: defaultTab,
            });
          }
        } else {
          if (s3Data.is_new_scenario) {
            setCurrentScenarioTab(0);
          }

          loadScenarioProfileMetadata({
            checkpoint: "overview",
            scenarioName: `Scenario ${simulationId}`,
            scenarioTerminal: "unknown",
            scenarioHistory: [],
            availableScenarioTab: 2,
            currentScenarioTab: 0,
          });
        }
      } catch (error: unknown) {
        const status =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { status?: number } }).response?.status ===
            "number"
            ? (error as { response: { status: number } }).response.status
            : undefined;

        void status;

        loadScenarioProfileMetadata({
          checkpoint: "overview",
          scenarioName: `Scenario ${simulationId}`,
          scenarioTerminal: "unknown",
          scenarioHistory: [],
          availableScenarioTab: 2,
          currentScenarioTab: 0,
        });
      } finally {
        setIsInitialized(true);
      }
    };

    void loadScenario();
  }, [
    simulationId,
    loadCompleteS3Metadata,
    loadScenarioProfileMetadata,
    setCurrentScenarioTab,
    setIsInitialized,
  ]);
}

async function loadScenarioMetadata(simulationId: string) {
  const { loadScenarioMetadata: loadMetadata } = await import(
    "@/services/simulationService"
  );
  return loadMetadata(simulationId);
}
