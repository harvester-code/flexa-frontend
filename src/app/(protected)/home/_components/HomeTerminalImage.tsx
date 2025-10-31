"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { ScenarioData } from "@/types/homeTypes";
import HomeNoScenario from "./HomeNoScenario";
import HomeLoading from "./HomeLoading";
import { useScenarioTerminalLayout } from "@/queries/terminalLayoutQueries";
import { createClient } from "@/lib/auth/client";
import type {
  ScenarioTerminalLayout,
  TerminalLayoutZoneRect,
} from "@/types/terminalLayout";

interface HomeTerminalImageProps {
  scenario: ScenarioData | null;
  layoutData?: ScenarioTerminalLayout | null;
  flowChartData?: Record<string, unknown> | null;
}

interface ZoneEntry {
  key: string;
  stepLabel: string;
  zoneLabel: string;
  rect: TerminalLayoutZoneRect;
}

interface ZoneOverlayEntry extends ZoneEntry {
  stepName?: string;
  queueValue: number;
  dotCount: number;
  peoplePerDot: number;
  hasData: boolean;
  maxDotCount: number;
}

const clampToUnitInterval = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const sanitizeRect = (rect: TerminalLayoutZoneRect): TerminalLayoutZoneRect => {
  const toNumber = (raw: unknown) => {
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  };

  return {
    x: clampToUnitInterval(toNumber(rect.x)),
    y: clampToUnitInterval(toNumber(rect.y)),
    width: clampToUnitInterval(toNumber(rect.width)),
    height: clampToUnitInterval(toNumber(rect.height)),
  };
};

const buildZoneEntries = (
  zoneAreas: Record<string, TerminalLayoutZoneRect> | null | undefined
): ZoneEntry[] => {
  if (!zoneAreas || typeof zoneAreas !== "object") {
    return [];
  }

  return Object.entries(zoneAreas)
    .map(([key, rect]) => {
      if (!rect) {
        return null;
      }

      const [stepPart, ...zoneParts] = key.split(":");
      const zoneName = zoneParts.length > 0 ? zoneParts.join(":") : stepPart;
      const stepLabel = stepPart || "-";

      return {
        key,
        rect: sanitizeRect(rect),
        stepLabel,
        zoneLabel: zoneName,
      } as ZoneEntry;
    })
    .filter((entry): entry is ZoneEntry => Boolean(entry));
};

const formatTimeLabel = (value: string): string => {
  if (!value) return "";
  if (value.length >= 16) {
    return value.slice(11, 16);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
};

const DOT_DENSITY = 900;
const MIN_DOTS = 8;
const MAX_DOTS = 150;
const DOT_SIZE_PX = 6;
const DOT_GAP_PX = 2;

const computeDotScaling = (rect: TerminalLayoutZoneRect, queueValue: number) => {
  if (queueValue <= 0) {
    return { dotCount: 0, peoplePerDot: 1 };
  }

  const area = Math.max(rect.width * rect.height, 0);
  const normalizedArea = Math.max(area, 0.01); // 최소 면적 보정 (1%)
  const estimatedDots = Math.round(normalizedArea * DOT_DENSITY);
  const maxDots = Math.min(MAX_DOTS, Math.max(MIN_DOTS, estimatedDots));
  const peoplePerDot = Math.max(1, Math.ceil(queueValue / maxDots));
  const dotCount = Math.max(1, Math.ceil(queueValue / peoplePerDot));

  return { dotCount, peoplePerDot };
};

const sanitizeNumericSeries = (series: Array<number | string>): number[] => {
  return series.map((value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  });
};

const BUCKET_NAME = "airport-terminal-images";
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg", "webp"];

function HomeTerminalImage({
  scenario,
  layoutData,
  flowChartData,
}: HomeTerminalImageProps) {
  const scenarioId = scenario?.scenario_id ?? null;
  const {
    data: metadataLayout,
    isLoading,
    isError,
  } = useScenarioTerminalLayout(scenarioId);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const airport = scenario?.airport ?? null;
  const terminal = scenario?.terminal ?? null;
  const effectiveLayout: ScenarioTerminalLayout | null = useMemo(() => {
    if (layoutData && layoutData.zoneAreas) {
      return layoutData;
    }
    if (metadataLayout && metadataLayout.zoneAreas) {
      return metadataLayout;
    }
    return null;
  }, [layoutData, metadataLayout]);

  const combinedStepNames = useMemo(() => {
    return {
      ...(metadataLayout?.stepNames ?? {}),
      ...(layoutData?.stepNames ?? {}),
    } as Record<string, string>;
  }, [layoutData, metadataLayout]);

  const zoneEntries = useMemo(() => {
    return buildZoneEntries(effectiveLayout?.zoneAreas ?? null);
  }, [effectiveLayout]);

  const times = useMemo(() => {
    if (!flowChartData || typeof flowChartData !== "object") {
      return [] as string[];
    }
    const rawTimes = (flowChartData as Record<string, unknown>).times;
    if (!Array.isArray(rawTimes)) {
      return [] as string[];
    }
    return rawTimes
      .map((value) => (typeof value === "string" ? value : String(value ?? "")))
      .filter((value) => value.length > 0);
  }, [flowChartData]);

  const timeLabels = useMemo(() => times.map((value) => formatTimeLabel(value)), [times]);

  const [timeIndex, setTimeIndex] = useState(0);

  useEffect(() => {
    if (timeIndex >= times.length) {
      setTimeIndex(times.length > 0 ? times.length - 1 : 0);
    }
  }, [timeIndex, times]);

  const zoneOverlayData = useMemo<ZoneOverlayEntry[]>(() => {
    if (!zoneEntries.length) {
      return [];
    }

    return zoneEntries.map((entry) => {
      const stepName = combinedStepNames?.[entry.stepLabel];
      let queueValue = 0;
      let hasData = false;
      let basePeoplePerDot = 1;
      let baseDotCount = 0;

      if (stepName && flowChartData && typeof flowChartData === "object" && times.length > 0) {
        const stepPayloadRaw = (flowChartData as Record<string, unknown>)[stepName];

        if (stepPayloadRaw && typeof stepPayloadRaw === "object") {
          const stepPayload = stepPayloadRaw as Record<string, unknown>;
          const stepDataRaw = stepPayload.data;

          if (stepDataRaw && typeof stepDataRaw === "object") {
            const stepData = stepDataRaw as Record<string, unknown>;
            const zoneDataRaw = stepData[entry.zoneLabel];

            if (zoneDataRaw && typeof zoneDataRaw === "object") {
              const zoneData = zoneDataRaw as Record<string, unknown>;
              const queueSeriesRaw = zoneData.queue_length;

              if (Array.isArray(queueSeriesRaw) && queueSeriesRaw.length > 0) {
                const queueSeries = sanitizeNumericSeries(queueSeriesRaw as Array<number | string>);
                if (queueSeries.length > 0) {
                  const maxQueueValue = queueSeries.reduce((max, value) => Math.max(max, value), 0);
                  const scaling = computeDotScaling(entry.rect, maxQueueValue);
                  basePeoplePerDot = Math.max(1, scaling.peoplePerDot);
                  baseDotCount = scaling.dotCount;
                  const safeIndex = Math.min(timeIndex, queueSeries.length - 1);
                  const currentValue = queueSeries[safeIndex] ?? 0;
                  queueValue = Math.max(0, Math.round(currentValue));
                  hasData = true;
                }
              }
            }
          }
        }
      }

      const computedDotCount = queueValue > 0 ? Math.max(1, Math.ceil(queueValue / basePeoplePerDot)) : 0;
      const dotCount = baseDotCount > 0 ? Math.min(baseDotCount, computedDotCount) : computedDotCount;

      return {
        ...entry,
        stepName,
        queueValue,
        dotCount,
        peoplePerDot: basePeoplePerDot,
        hasData,
        maxDotCount: baseDotCount,
      };
    });
  }, [zoneEntries, combinedStepNames, flowChartData, times.length, timeIndex]);

  const metadataImage = effectiveLayout?.imageUrl ?? null;

  useEffect(() => {
    if (!airport || !terminal) {
      setImageUrl(null);
      setImageError(null);
      setIsImageLoading(false);
      return;
    }

    let cancelled = false;

    const fetchImage = async () => {
      setIsImageLoading(true);
      setImageError(null);

      const candidateKeys: string[] = [];

      if (metadataImage) {
        candidateKeys.push(metadataImage);
      }

      const baseKey = `${airport}-${terminal}`;
      IMAGE_EXTENSIONS.forEach((ext) => {
        candidateKeys.push(`${baseKey}.${ext}`);
      });

      const uniqueCandidates = candidateKeys.filter((key, index) =>
        key && candidateKeys.indexOf(key) === index
      );

      for (const candidate of uniqueCandidates) {
        if (cancelled) {
          return;
        }

        if (/^https?:\/\//i.test(candidate)) {
          setImageUrl(candidate);
          setIsImageLoading(false);
          return;
        }

        const normalizedCandidate = candidate.replace(/^\/+/, "");
        const possibleKeys = [normalizedCandidate];

        if (normalizedCandidate.startsWith(`${BUCKET_NAME}/`)) {
          possibleKeys.push(normalizedCandidate.replace(`${BUCKET_NAME}/`, ""));
        }

        for (const key of possibleKeys) {
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(key, 3600);

          if (!error && data?.signedUrl) {
            if (!cancelled) {
              setImageUrl(data.signedUrl);
              setIsImageLoading(false);
            }
            return;
          }
        }
      }

      if (!cancelled) {
        setImageUrl(null);
        setImageError("Terminal layout image not found in storage.");
        setIsImageLoading(false);
      }
    };

    fetchImage();

    return () => {
      cancelled = true;
    };
  }, [airport, terminal, metadataImage, supabase]);

  if (!scenario) {
    return <HomeNoScenario />;
  }

  const metadataLoading = isLoading && !layoutData;

  if (metadataLoading || (isImageLoading && !imageUrl && !metadataImage)) {
    return <HomeLoading />;
  }

  const fallbackImage = "/maps/MNL_T3_L3.jpg";
  const imageSrc = imageUrl ||
    (metadataImage && /^https?:\/\//i.test(metadataImage)
      ? metadataImage
      : fallbackImage);

  const selectedTimeLabel = timeLabels[timeIndex] ?? "";

  return (
    <div className="mt-4 space-y-4">
      <div className="relative overflow-hidden rounded-md border border-input bg-white">
        <div className="relative">
          <img
            src={imageSrc}
            alt="Terminal layout"
            className="h-auto w-full select-none object-contain"
            loading="lazy"
          />

          <div className="pointer-events-none absolute inset-0">
            {zoneOverlayData.map(({ key, rect, zoneLabel, queueValue, dotCount, peoplePerDot, hasData, maxDotCount }) => {
              const aspectRatio = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 1;
              const columnSeed = maxDotCount > 0 ? maxDotCount : dotCount > 0 ? dotCount : 1;
              const columns = Math.max(1, Math.ceil(Math.sqrt(columnSeed * aspectRatio)));

              return (
                <div
                  key={key}
                  className="absolute"
                  style={{
                    left: `${rect.x * 100}%`,
                    top: `${rect.y * 100}%`,
                    width: `${rect.width * 100}%`,
                    height: `${rect.height * 100}%`,
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 rounded border border-primary/60 bg-primary/5">
                    <span className="absolute left-1 top-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {zoneLabel}
                    </span>

                    <div className="flex h-full w-full flex-col justify-start p-1">
                      {hasData && dotCount > 0 ? (
                        <div
                          className="grid h-full w-full"
                          style={{
                            gridTemplateColumns: `repeat(${columns}, ${DOT_SIZE_PX}px)`,
                            gap: `${DOT_GAP_PX}px`,
                            justifyItems: "start",
                            alignItems: "start",
                            justifyContent: "start",
                            alignContent: "start",
                            gridAutoFlow: "row",
                          }}
                        >
                          {Array.from({ length: dotCount }).map((_, index) => (
                            <span
                              key={index}
                              className="block rounded-full bg-primary/90"
                              style={{
                                width: `${DOT_SIZE_PX}px`,
                                height: `${DOT_SIZE_PX}px`,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-primary/70">
                          {hasData ? "No queue" : "No data"}
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-1 left-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {queueValue.toLocaleString()} pax
                    </div>
                    {hasData ? (
                      <div className="absolute bottom-1 right-1 rounded bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground">
                        1 dot = {peoplePerDot.toLocaleString()} pax
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {times.length > 1 ? (
        <div className="rounded-md border border-input bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>Queue snapshot</span>
            <span>{selectedTimeLabel}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(times.length - 1, 0)}
            value={timeIndex}
            onChange={(event) => setTimeIndex(Number(event.target.value))}
            className="mt-3 w-full"
          />
          {timeLabels.length > 1 ? (
            <div className="mt-2 flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{timeLabels[0]}</span>
              <span>{timeLabels[timeLabels.length - 1]}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {imageError ? (
        <p className="text-xs text-destructive">{imageError}</p>
      ) : null}
      {!layoutData && isError ? (
        <p className="text-xs text-destructive">
          Failed to load terminal layout metadata. Showing image only.
        </p>
      ) : null}

      {zoneOverlayData.length > 0 ? (
        <div className="rounded-md border border-input bg-white p-4">
          <h3 className="text-sm font-semibold text-foreground">Mapped zones</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Queue counts update as you move the slider. Showing data for {selectedTimeLabel || "selected time"}.
          </p>

          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {zoneOverlayData.map(({ key, stepLabel, stepName, zoneLabel, rect, queueValue, peoplePerDot, hasData }) => (
              <li
                key={key}
                className="rounded-md border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-xs"
              >
                <p className="font-medium text-foreground">
                  Step {stepLabel}
                  {stepName ? ` · ${stepName.replace(/_/g, " ")}` : ""} · {zoneLabel}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {hasData
                    ? `${queueValue.toLocaleString()} pax • 1 dot = ${peoplePerDot.toLocaleString()} pax`
                    : "Queue data unavailable"}
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  x: {(rect.x * 100).toFixed(1)}% · y: {(rect.y * 100).toFixed(1)}% · w: {(
                    rect.width * 100
                  ).toFixed(1)}% · h: {(rect.height * 100).toFixed(1)}%
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-md border border-input bg-white p-6 text-sm text-muted-foreground">
          No zone areas have been mapped yet for this terminal layout.
        </div>
      )}
    </div>
  );
}

export default HomeTerminalImage;
