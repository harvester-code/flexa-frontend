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
}

interface ZoneEntry {
  key: string;
  stepLabel: string;
  zoneLabel: string;
  rect: TerminalLayoutZoneRect;
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

const BUCKET_NAME = "airport-terminal-images";
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg", "webp"];

function HomeTerminalImage({
  scenario,
  layoutData,
}: HomeTerminalImageProps) {
  const scenarioId = scenario?.scenario_id ?? null;
  const {
    data: metadataLayout,
    isLoading,
    isError,
  } = useScenarioTerminalLayout(scenarioId, {
    enabled: !layoutData,
  });

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
    return metadataLayout ?? null;
  }, [layoutData, metadataLayout]);

  const zoneEntries = useMemo(() => {
    return buildZoneEntries(effectiveLayout?.zoneAreas ?? null);
  }, [effectiveLayout]);

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

  if (isLoading || (isImageLoading && !imageUrl && !metadataImage)) {
    return <HomeLoading />;
  }

  const fallbackImage = "/maps/MNL_T3_L3.jpg";
  const imageSrc = imageUrl ||
    (metadataImage && /^https?:\/\//i.test(metadataImage)
      ? metadataImage
      : fallbackImage);

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
            {zoneEntries.map(({ key, rect, zoneLabel }) => (
              <div
                key={key}
                className="absolute rounded border border-primary/70 bg-primary/10"
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.width * 100}%`,
                  height: `${rect.height * 100}%`,
                }}
              >
                <span className="absolute left-1 top-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {zoneLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {imageError ? (
        <p className="text-xs text-destructive">{imageError}</p>
      ) : null}
      {!layoutData && isError ? (
        <p className="text-xs text-destructive">
          Failed to load terminal layout metadata. Showing image only.
        </p>
      ) : null}

      {zoneEntries.length > 0 ? (
        <div className="rounded-md border border-input bg-white p-4">
          <h3 className="text-sm font-semibold text-foreground">Mapped zones</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            The map highlights each zone based on the saved terminal layout coordinates.
          </p>

          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {zoneEntries.map(({ key, stepLabel, zoneLabel, rect }) => (
              <li
                key={key}
                className="rounded-md border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-xs"
              >
                <p className="font-medium text-foreground">
                  Step {stepLabel} · {zoneLabel}
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
