"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { CSSProperties } from "react";
import { ScenarioData } from "@/types/homeTypes";
import HomeNoScenario from "./HomeNoScenario";
import HomeLoading from "./HomeLoading";
import { useScenarioTerminalLayout } from "@/queries/terminalLayoutQueries";
import { createClient } from "@/lib/auth/client";
import { Slider } from "@/components/ui/Slider";
import type {
  ScenarioTerminalLayout,
  TerminalLayoutZoneRect,
} from "@/types/terminalLayout";
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";

interface HomeTerminalImageProps {
  scenario: ScenarioData | null;
  layoutData?: ScenarioTerminalLayout | null;
  flowChartData?: Record<string, unknown> | null;
}

interface ZoneEntry {
  key: string;
  stepLabel: string;
  stepIndex: number;
  zoneLabel: string;
  rect: TerminalLayoutZoneRect;
}

interface ZoneOverlayEntry extends ZoneEntry {
  stepName?: string;
  queueValue: number;
  dotCount: number;
  peoplePerDot: number;
  hasData: boolean;
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

const appendAlpha = (hexColor: string, alpha: number) => {
  const normalized = (hexColor || "").replace("#", "").trim();
  if (normalized.length !== 6) {
    return hexColor;
  }
  const clamped = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${alphaHex}`;
};

const getZoneColorByStep = (stepIndex: number) => {
  const paletteSize = COMPONENT_TYPICAL_COLORS.length as number;
  if (paletteSize === 0) {
    return "#3b82f6";
  }
  const normalizedIndex = Number.isFinite(stepIndex)
    ? ((Math.trunc(stepIndex) % paletteSize) + paletteSize) % paletteSize
    : 0;
  return COMPONENT_TYPICAL_COLORS[normalizedIndex];
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
      const parsedStep = Number(stepPart);
      const stepIndex = Number.isFinite(parsedStep) ? parsedStep : 0;
      const stepLabel = stepPart ?? "-";

      return {
        key,
        rect: sanitizeRect(rect),
        stepLabel,
        stepIndex,
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
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const DOT_SIZE_PX = 3;
const DOT_GAP_PX = 0.5;

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
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg", "webp", "gif", "bmp"];

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

  const timeLabels = useMemo(
    () => times.map((value) => formatTimeLabel(value)),
    [times]
  );

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

      if (
        stepName &&
        flowChartData &&
        typeof flowChartData === "object" &&
        times.length > 0
      ) {
        const stepPayloadRaw = (flowChartData as Record<string, unknown>)[
          stepName
        ];

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
                const queueSeries = sanitizeNumericSeries(
                  queueSeriesRaw as Array<number | string>
                );
                if (queueSeries.length > 0) {
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

      const dotCount = queueValue;

      return {
        ...entry,
        stepName,
        queueValue,
        dotCount,
        peoplePerDot: 1,
        hasData,
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

      const uniqueCandidates = candidateKeys.filter(
        (key, index) => key && candidateKeys.indexOf(key) === index
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

  const selectedTimeLabel = timeLabels[timeIndex] ?? "";
  const selectedTimestamp = times[timeIndex] ?? "";
  const selectedDateTimeLabel = selectedTimestamp || selectedTimeLabel;
  const selectedMoment = useMemo(() => {
    if (!selectedTimestamp) {
      return null;
    }
    const parsed = dayjs(selectedTimestamp);
    return parsed.isValid() ? parsed : null;
  }, [selectedTimestamp]);
  const sliderPositionPercent =
    times.length > 1
      ? Math.min(Math.max(timeIndex / (times.length - 1), 0), 1) * 100
      : 0;

  // 시작 시점과 종료 시점
  const startMoment = useMemo(() => {
    if (times.length === 0) return null;
    const parsed = dayjs(times[0]);
    return parsed.isValid() ? parsed : null;
  }, [times]);

  const endMoment = useMemo(() => {
    if (times.length === 0) return null;
    const parsed = dayjs(times[times.length - 1]);
    return parsed.isValid() ? parsed : null;
  }, [times]);

  if (!scenario) {
    return <HomeNoScenario />;
  }

  const metadataLoading = isLoading && !layoutData;

  if (metadataLoading || (isImageLoading && !imageUrl && !metadataImage)) {
    return <HomeLoading />;
  }

  const imageSrc =
    imageUrl ||
    (metadataImage && /^https?:\/\//i.test(metadataImage)
      ? metadataImage
      : null);

  // 이미지가 없으면 간단한 안내 메시지 표시
  if (!imageSrc && imageError) {
    return (
      <div className="py-3 text-sm text-muted-foreground">
        No terminal layout image found. Upload in{" "}
        <span className="font-semibold text-default-900">
          Simulation → Terminal Waiting Area Editor
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-4 space-y-4">
      <div className="relative overflow-hidden rounded-lg border border-input bg-white shadow-sm">
        <div className="relative">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Terminal layout"
              className="h-auto w-full select-none object-contain"
              loading="lazy"
            />
          ) : null}

          <div className="pointer-events-none absolute inset-0">
            {zoneOverlayData.map(
              ({
                key,
                rect,
                zoneLabel,
                stepIndex,
                queueValue,
                dotCount,
                hasData,
              }) => {
                const zoneColor = getZoneColorByStep(stepIndex);
                const borderColor = appendAlpha(zoneColor, 0.65);
                const backgroundColor = appendAlpha(zoneColor, 0.18);
                const labelBackground = appendAlpha(zoneColor, 0.82);
                const dotColor = appendAlpha(zoneColor, 0.88);
                const queueLabel = `${queueValue.toLocaleString()} pax`;
                const longestLineLength = Math.max(
                  zoneLabel?.length ?? 0,
                  queueLabel.length
                );
                const minWidthCh = Math.max(longestLineLength, 4);
                const labelStyle: CSSProperties = {
                  left: 0,
                  top: 0,
                  transform: "translate(0, calc(-100% - 4px))",
                  backgroundColor: labelBackground,
                  color: "#ffffff",
                  whiteSpace: "normal",
                  minWidth: `${minWidthCh}ch`,
                };

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
                    <div
                      className="pointer-events-none absolute inset-0 rounded-md"
                      style={{
                        borderColor,
                        backgroundColor,
                        borderWidth: "1px",
                        borderStyle: "dashed",
                      }}
                    >
                      <span
                        className="pointer-events-none absolute z-10 rounded-sm px-1 py-0 text-[10px] font-semibold leading-tight shadow-sm"
                        style={labelStyle}
                      >
                        <span className="block leading-tight">{zoneLabel}</span>
                        <span className="block text-[9px] font-medium leading-tight">
                          {queueLabel}
                        </span>
                      </span>

                      <div className="flex h-full w-full flex-col justify-start">
                        {hasData && dotCount > 0 ? (
                          <div
                            className="flex h-full w-full flex-wrap"
                            style={{
                              gap: `${DOT_GAP_PX}px`,
                              alignItems: "flex-start",
                              alignContent: "flex-start",
                              justifyContent: "flex-start",
                            }}
                          >
                            {Array.from({ length: dotCount }).map(
                              (_, index) => (
                                <span
                                  key={index}
                                  className="block rounded-full"
                                  style={{
                                    width: `${DOT_SIZE_PX}px`,
                                    height: `${DOT_SIZE_PX}px`,
                                    backgroundColor: dotColor,
                                  }}
                                />
                              )
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {times.length > 0 ? (
        <div className="relative mt-3">
          <Slider
            value={[timeIndex]}
            min={0}
            max={Math.max(times.length - 1, 0)}
            step={1}
            onValueChange={(value) => {
              const [next] = value;
              if (typeof next === "number" && !Number.isNaN(next)) {
                const clamped = Math.min(
                  Math.max(next, 0),
                  Math.max(times.length - 1, 0)
                );
                setTimeIndex(clamped);
              }
            }}
            className="w-full"
            disabled={times.length <= 1}
          />
          {/* 시작 시점 (왼쪽) */}
          {startMoment && (
            <div className="pointer-events-none absolute top-full mt-4 left-0">
              <div className="text-center text-xs text-default-900">
                <span className="block whitespace-nowrap">
                  {startMoment.format("MM-DD")}
                </span>
                <span className="block whitespace-nowrap">
                  {startMoment.format("HH:mm")}
                </span>
              </div>
            </div>
          )}

          {/* 선택된 시점 (중앙) */}
          {selectedMoment || selectedDateTimeLabel || selectedTimeLabel ? (
            <div
              className="pointer-events-none absolute top-full mt-2 flex justify-center"
              style={{
                left: `${sliderPositionPercent}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="rounded-md bg-primary/10 px-3 py-1 text-center text-xs font-semibold text-primary">
                {selectedMoment ? (
                  <>
                    <span className="block whitespace-nowrap">
                      {selectedMoment.format("YYYY-MM-DD")}
                    </span>
                    <span className="block whitespace-nowrap">
                      {selectedMoment.format("HH:mm")}
                    </span>
                  </>
                ) : (
                  <span className="block whitespace-nowrap">
                    {selectedDateTimeLabel || selectedTimeLabel}
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {/* 종료 시점 (오른쪽) */}
          {endMoment && (
            <div className="pointer-events-none absolute top-full mt-4 right-0">
              <div className="text-center text-xs text-default-900">
                <span className="block whitespace-nowrap">
                  {endMoment.format("MM-DD")}
                </span>
                <span className="block whitespace-nowrap">
                  {endMoment.format("HH:mm")}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {!layoutData && isError ? (
        <p className="text-xs text-destructive">
          Failed to load terminal layout metadata. Showing image only.
        </p>
      ) : null}
    </div>
  );
}

export default HomeTerminalImage;
