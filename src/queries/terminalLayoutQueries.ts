import { useQuery } from "@tanstack/react-query";
import { loadScenarioMetadata } from "@/services/simulationService";
import type { MetadataLoadResponse } from "@/types/simulationTypes";
import type {
  ScenarioTerminalLayout,
  TerminalLayoutZoneRect,
} from "@/types/terminalLayout";

const extractTerminalLayout = (metadata: unknown): ScenarioTerminalLayout | null => {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const metadataRecord = metadata as Record<string, unknown>;
  const tabs = (metadataRecord.tabs as Record<string, unknown> | undefined) ?? {};

  let stepNames: Record<string, string> | undefined;
  const processFlowRaw = metadataRecord.process_flow;
  if (Array.isArray(processFlowRaw)) {
    const mapping: Record<string, string> = {};
    for (const step of processFlowRaw) {
      if (!step || typeof step !== "object") {
        continue;
      }

      const stepRecord = step as Record<string, unknown>;
      const stepNumberRaw = stepRecord.step;
      const stepNameRaw = stepRecord.name;

      const stepNumber =
        typeof stepNumberRaw === "number" ? stepNumberRaw : Number(stepNumberRaw);
      const stepName = typeof stepNameRaw === "string" ? stepNameRaw : undefined;

      if (Number.isFinite(stepNumber) && stepName) {
        mapping[String(stepNumber)] = stepName;
      }
    }

    if (Object.keys(mapping).length > 0) {
      stepNames = mapping;
    }
  }

  const candidateSources: unknown[] = [
    metadataRecord.terminalLayout,
    tabs.terminalLayout,
    (tabs.processingProcedures as Record<string, unknown> | undefined)?.terminalLayout,
    (tabs.overview as Record<string, unknown> | undefined)?.terminalLayout,
  ];

  for (const candidate of candidateSources) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const candidateRecord = candidate as Record<string, unknown>;
    const zoneAreasRaw = candidateRecord.zoneAreas;

    if (!zoneAreasRaw || typeof zoneAreasRaw !== "object") {
      continue;
    }

    const zoneAreasEntries = Object.entries(zoneAreasRaw).filter(([, rect]) =>
      rect && typeof rect === "object"
    ) as Array<[string, Record<string, unknown>]>;

    const zoneAreas: Record<string, TerminalLayoutZoneRect> = {};

    for (const [zoneKey, rawRect] of zoneAreasEntries) {
      const x = Number(rawRect.x);
      const y = Number(rawRect.y);
      const width = Number(rawRect.width);
      const height = Number(rawRect.height);

      if ([x, y, width, height].every((value) => Number.isFinite(value))) {
        zoneAreas[zoneKey] = { x, y, width, height };
      }
    }

    if (Object.keys(zoneAreas).length === 0) {
      continue;
    }

    const imageUrl = (candidateRecord.imageUrl ||
      candidateRecord.image_path ||
      candidateRecord.mapImage ||
      candidateRecord.mapUrl) as string | null | undefined;

    return {
      imageUrl: imageUrl ?? null,
      zoneAreas,
      stepNames,
    };
  }

  return null;
};

export const useScenarioTerminalLayout = (
  scenarioId?: string | null,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["scenario-terminal-layout", scenarioId],
    enabled: Boolean(scenarioId) && (options?.enabled ?? true),
    queryFn: async () => {
      if (!scenarioId) {
        return null;
      }

      const { data } = await loadScenarioMetadata(scenarioId);
      const response = data as Partial<MetadataLoadResponse> & { metadata?: unknown };

      return extractTerminalLayout(response.metadata);
    },
    staleTime: 5 * 60 * 1000,
  });
};
