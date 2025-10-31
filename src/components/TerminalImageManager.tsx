"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Upload, Trash2, Image as ImageIcon, Check, Eraser } from "lucide-react";
import { createClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/hooks/useToast";
import { cn, formatProcessName } from "@/lib/utils";
import {
  useSimulationStore,
  type ZoneAreaRect,
} from "@/app/(protected)/simulation/[id]/_stores";
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";

const BUCKET_NAME = "airport-terminal-images";

const appendAlpha = (hexColor: string, alpha: number) => {
  const normalizedHex = hexColor.replace("#", "");
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(clampedAlpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalizedHex}${alphaHex}`;
};

type ZoneItem = {
  step: number;
  processName: string;
  zoneName: string;
};

const buildZoneLabel = (zone: ZoneItem) => {
  return `Step ${zone.step + 1} · ${formatProcessName(zone.processName)} · ${zone.zoneName}`;
};

interface TerminalImageManagerProps {
  airport?: string | null;
  terminal?: string | null;
  className?: string;
}

function TerminalImageManager({
  airport,
  terminal,
  className,
}: TerminalImageManagerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const hasIdentifiers = Boolean(airport && terminal);

  const processFlow = useSimulationStore((s) => s.process_flow);
  const zoneAreas = useSimulationStore((s) => s.terminalLayout.zoneAreas);
  const setZoneArea = useSimulationStore((s) => s.setZoneArea);
  const removeZoneArea = useSimulationStore((s) => s.removeZoneArea);

  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneItem | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const [draftRect, setDraftRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const stepGroups = useMemo<
    Array<{ step: number; processName: string; zoneNames: string[] }>
  >(() => {
    if (!processFlow || processFlow.length === 0) {
      return [];
    }

    return processFlow
      .map((step) => ({
        step: step.step,
        processName: step.name,
        zoneNames: Object.keys(step.zones || {}),
      }))
      .filter((group) => group.zoneNames.length > 0)
      .sort((a, b) => a.step - b.step);
  }, [processFlow]);

  const zoneItems = useMemo<ZoneItem[]>(() => {
    return stepGroups.flatMap((group) =>
      group.zoneNames.map((zoneName) => ({
        step: group.step,
        processName: group.processName,
        zoneName,
      }))
    );
  }, [stepGroups]);

  const getZoneKey = useCallback((step: number, zoneName: string) => {
    return `${step}:${zoneName}`;
  }, []);

  const selectedZoneKey = selectedZone
    ? getZoneKey(selectedZone.step, selectedZone.zoneName)
    : null;

  useEffect(() => {
    if (zoneItems.length === 0) {
      setSelectedZone(null);
      setSelectedStep(null);
      return;
    }

    const hasSelectedZone =
      selectedZone &&
      zoneItems.some(
        (zone) =>
          zone.step === selectedZone.step &&
          zone.zoneName === selectedZone.zoneName
      );

    if (!hasSelectedZone) {
      const defaultZone = zoneItems[0];
      setSelectedZone(defaultZone);
      setSelectedStep(defaultZone.step);
      return;
    }

    if (selectedStep === null || selectedZone.step !== selectedStep) {
      setSelectedStep(selectedZone.step);
    }
  }, [zoneItems, selectedZone, selectedStep]);

  const selectedStepGroup = useMemo(() => {
    if (selectedStep === null) {
      return null;
    }
    return stepGroups.find((group) => group.step === selectedStep) || null;
  }, [selectedStep, stepGroups]);

  const zonesForSelectedStep = useMemo(() => {
    if (selectedStep === null) {
      return [] as ZoneItem[];
    }
    return zoneItems.filter((zone) => zone.step === selectedStep);
  }, [selectedStep, zoneItems]);

  const handleStepSelect = (stepNumber: number, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();

      // Save current scroll position
      const scrollY = window.scrollY;

      // Blur to remove focus
      (event.currentTarget as HTMLElement).blur();

      // Restore scroll position after state update
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
    setSelectedStep(stepNumber);
    if (!selectedZone || selectedZone.step !== stepNumber) {
      const fallbackZone =
        zoneItems.find((zone) => zone.step === stepNumber) || null;
      setSelectedZone(fallbackZone);
    }
  };

  const handleZoneSelect = (zone: ZoneItem, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();

      // Save current scroll position
      const scrollY = window.scrollY;

      // Blur to remove focus
      (event.currentTarget as HTMLElement).blur();

      // Restore scroll position after state update
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
    setSelectedZone(zone);
    setSelectedStep(zone.step);
  };

  const hasMappedZonesForSelectedStep = useMemo(() => {
    if (selectedStep === null) return false;
    const activeGroup = stepGroups.find((group) => group.step === selectedStep);
    if (!activeGroup) return false;
    return activeGroup.zoneNames.some((zoneName) =>
      zoneAreas[getZoneKey(selectedStep, zoneName)]
    );
  }, [selectedStep, stepGroups, zoneAreas, getZoneKey]);

  const overlayItems = useMemo(() => {
    return zoneItems.reduce<Array<{ zone: ZoneItem; rect: ZoneAreaRect }>>(
      (acc, zone) => {
        const key = getZoneKey(zone.step, zone.zoneName);
        const rect = zoneAreas[key];
        if (rect) {
          acc.push({ zone, rect });
        }
        return acc;
      },
      []
    );
  }, [zoneItems, zoneAreas, getZoneKey]);

  // Get color for a specific step
  const getStepColor = useCallback((step: number) => {
    return COMPONENT_TYPICAL_COLORS[step % COMPONENT_TYPICAL_COLORS.length];
  }, []);

  const clamp = useCallback((value: number) => {
    if (Number.isNaN(value)) return 0;
    return Math.min(1, Math.max(0, value));
  }, []);

  const getRelativePoint = useCallback(
    (clientX: number, clientY: number) => {
      const container = imageContainerRef.current;
      if (!container) return null;

      const bounds = container.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return null;

      const relativeX = clamp((clientX - bounds.left) / bounds.width);
      const relativeY = clamp((clientY - bounds.top) / bounds.height);

      return { x: relativeX, y: relativeY };
    },
    [clamp]
  );

  const MIN_RECT_SIZE = 0.01; // minimum 1% of the image

  const canDraw = Boolean(selectedZone && imageUrl);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!canDraw) {
        if (zoneItems.length > 0) {
          toast({
            title: "Select a zone",
            description:
              "Pick a zone before drawing a waiting area on the map.",
            variant: "destructive",
          });
        }
        return;
      }

      const start = getRelativePoint(event.clientX, event.clientY);
      if (!start) return;

      event.preventDefault();
      setIsDrawing(true);
      setActivePointerId(event.pointerId);
      setStartPoint(start);
      setDraftRect({ x: start.x, y: start.y, width: 0, height: 0 });
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (err) {
        // Ignore browsers that do not support pointer capture
      }
    },
    [canDraw, getRelativePoint, zoneItems, toast]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDrawing || activePointerId !== event.pointerId || !startPoint) {
        return;
      }

      const current = getRelativePoint(event.clientX, event.clientY);
      if (!current) return;

      const rect = {
        x: Math.min(startPoint.x, current.x),
        y: Math.min(startPoint.y, current.y),
        width: Math.abs(current.x - startPoint.x),
        height: Math.abs(current.y - startPoint.y),
      };
      setDraftRect(rect);
    },
    [isDrawing, activePointerId, startPoint, getRelativePoint]
  );

  const handlePointerFinalize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, finalize: boolean = false) => {
      if (!isDrawing || activePointerId !== event.pointerId || !startPoint) {
        return;
      }

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (err) {
        // Ignore if the pointer was not captured
      }

      setIsDrawing(false);
      setActivePointerId(null);

      if (!finalize || !selectedZone) {
        setDraftRect(null);
        setStartPoint(null);
        return;
      }

      const endPoint =
        getRelativePoint(event.clientX, event.clientY) || startPoint;
      const rect = {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
      } as ZoneAreaRect;

      setDraftRect(null);
      setStartPoint(null);

      if (rect.width < MIN_RECT_SIZE || rect.height < MIN_RECT_SIZE) {
        return;
      }

      setZoneArea(selectedZone.step, selectedZone.zoneName, rect);
    },
    [
      MIN_RECT_SIZE,
      activePointerId,
      getRelativePoint,
      isDrawing,
      selectedZone,
      setZoneArea,
      startPoint,
      toast,
    ]
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      handlePointerFinalize(event, true);
    },
    [handlePointerFinalize]
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerFinalize(event, false);
    },
    [handlePointerFinalize]
  );

  const handleClearSelectedZone = useCallback(() => {
    if (!selectedZone) return;
    removeZoneArea(selectedZone.step, selectedZone.zoneName);
  }, [removeZoneArea, selectedZone]);

  const handleClearAllZonesForStep = useCallback(() => {
    if (selectedStep === null) return;
    const activeGroup = stepGroups.find((group) => group.step === selectedStep);
    if (!activeGroup) return;
    activeGroup.zoneNames.forEach((zoneName) => {
      removeZoneArea(selectedStep, zoneName);
    });
  }, [removeZoneArea, selectedStep, stepGroups]);

  // Generate image file name with extension
  const getImageFileName = (
    airportCode: string,
    terminalCode: string,
    extension: string = "jpg"
  ) => {
    return `${airportCode}-${terminalCode}.${extension}`;
  };

  // Get file extension from filename or mime type
  const getFileExtension = (file: File): string => {
    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension) return extension;

    // Fallback to mime type
    const mimeMap: { [key: string]: string } = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    return mimeMap[file.type] || "jpg";
  };

  // Load image (try multiple extensions)
  const loadImage = async (airportCode: string, terminalCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try different extensions in order
      const extensions = ["jpg", "jpeg", "png", "svg", "webp"];

      for (const ext of extensions) {
        const fileName = getImageFileName(airportCode, terminalCode, ext);
        const { data, error: signedUrlError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(fileName, 3600);

        if (!signedUrlError && data) {
          setImageUrl(data.signedUrl);
          setIsLoading(false);
          return;
        }
      }

      setImageUrl(null);
    } catch (err) {
      console.error("Error loading image:", err);
      setError(err instanceof Error ? err.message : "Failed to load image");
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload image
  const handleUpload = async (file: File) => {
    if (!airport || !terminal) return;

    setIsUploading(true);
    setError(null);

    try {
      const extension = getFileExtension(file);
      const fileName = getImageFileName(airport, terminal, extension);

      // Delete all existing files with different extensions first
      const extensions = ["jpg", "jpeg", "png", "svg", "webp"];
      const filesToDelete = extensions.map((ext) =>
        getImageFileName(airport, terminal, ext)
      );

      // Ignore delete errors (files may not exist)
      await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false, // No need to upsert since we deleted existing files
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Reload image after successful upload
      await loadImage(airport, terminal);
      toast({
        title: "Success",
        description: `Image uploaded as ${fileName}`,
      });
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete image (try all possible extensions)
  const handleDelete = async () => {
    if (!airport || !terminal) return;

    setIsLoading(true);
    setError(null);

    try {
      const extensions = ["jpg", "jpeg", "png", "svg", "webp"];
      const filesToDelete = extensions.map((ext) =>
        getImageFileName(airport, terminal, ext)
      );

      // Delete all possible variations
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);

      if (deleteError) {
        throw deleteError;
      }

      // Fallback to default.jpg after successful deletion
      await loadImage(airport, terminal);
      toast({
        title: "Success",
        description: "Image deleted successfully!",
      });
    } catch (err) {
      console.error("Error deleting image:", err);
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsLoading(false);
    }
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Only image files are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size cannot exceed 5MB.",
        variant: "destructive",
      });
      return;
    }

    handleUpload(file);
  };

  // Load image when codes change
  useEffect(() => {
    if (airport && terminal) {
      loadImage(airport, terminal);
    } else {
      setImageUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airport, terminal]);

  return (
    <div className={className}>
      <div className="mb-6 flex flex-col gap-3 border-l-4 border-primary pl-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-default-900">
            Terminal Waiting Area Editor
          </h3>
          <p className="text-sm text-default-500">
            Configure waiting areas for each zone on the terminal layout
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <label>
            <Button
              variant="primary"
              size="sm"
              disabled={isUploading}
              asChild
            >
              <span>
                <Upload />
                {imageUrl
                  ? isUploading
                    ? "Updating..."
                    : "Update"
                  : isUploading
                  ? "Uploading..."
                  : "Upload"}
              </span>
            </Button>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isLoading || !imageUrl}
                variant="destructive"
                size="sm"
              >
                <Trash2 />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Terminal Image</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will remove the current terminal image. You can
                  upload a new file afterwards.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {!hasIdentifiers ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select an airport and terminal to view the layout image.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : imageUrl ? (
          <div className="space-y-6 p-4">
            <div className="space-y-4">
              {stepGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add zones in the Process Flow before mapping areas.
                </p>
              ) : (
                <div className="flex justify-end gap-2 overflow-x-auto pb-1">
                  {stepGroups.map((group) => {
                    const totalZones = group.zoneNames.length;
                    const mappedZones = group.zoneNames.filter(
                      (zoneName) => zoneAreas[getZoneKey(group.step, zoneName)]
                    ).length;
                    const isActiveStep = selectedStep === group.step;
                    const isCompleted =
                      mappedZones === totalZones && totalZones > 0;
                    const stepColor = getStepColor(group.step);
                    const buttonStyle = {
                      "--step-color": stepColor,
                      "--step-hover-bg": appendAlpha(stepColor, isCompleted ? 0.2 : 0.15),
                      "--step-inactive-bg": appendAlpha(stepColor, 0.12),
                      "--step-incomplete-bg": appendAlpha(stepColor, 0.08),
                      "--step-text-color": stepColor,
                    } as CSSProperties;
                    const ratioColor = isActiveStep
                      ? "rgba(255,255,255,0.85)"
                      : appendAlpha(stepColor, 0.75);

                    return (
                      <Button
                        variant="ghost"
                        key={`${group.step}:${group.processName}`}
                        type="button"
                        onClick={(e) => handleStepSelect(group.step, e)}
                        style={buttonStyle}
                        className={cn(
                          "flex-none rounded-full border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-0",
                          isActiveStep &&
                            "shadow-sm border-transparent bg-[var(--step-color)] text-white hover:!bg-[var(--step-color)] hover:!text-white",
                          !isActiveStep &&
                            (isCompleted
                              ? "shadow-none border-[var(--step-color)] bg-[var(--step-inactive-bg)] text-[var(--step-text-color)] hover:!bg-[var(--step-hover-bg)] hover:!text-[var(--step-text-color)]"
                              : "shadow-none border-dashed border-[var(--step-color)] bg-[var(--step-incomplete-bg)] text-[var(--step-text-color)] hover:!bg-[var(--step-hover-bg)] hover:!text-[var(--step-text-color)]")
                        )}
                      >
                        <span className="flex items-center gap-1 font-semibold">
                          {formatProcessName(group.processName)}
                          {isCompleted && (
                            <Check
                              className="h-3.5 w-3.5"
                              style={{ color: ratioColor }}
                            />
                          )}
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: ratioColor }}
                          >
                            {mappedZones}/{totalZones}
                          </span>
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="rounded-lg bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Zones
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose a zone below, then drag on the map to outline its
                      queue area.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {selectedZoneKey && zoneAreas[selectedZoneKey] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelectedZone}
                      >
                        <Eraser className="h-4 w-4" />
                        Clear selected zone
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllZonesForStep}
                      disabled={!hasMappedZonesForSelectedStep}
                    >
                      <Eraser className="h-4 w-4" />
                      Clear all zones
                    </Button>
                  </div>
                </div>

                {stepGroups.length === 0 ? null : !selectedStepGroup ||
                  zonesForSelectedStep.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Select a process step to see its zones.
                  </p>
                ) : (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {zonesForSelectedStep.map((zone) => {
                      const key = getZoneKey(zone.step, zone.zoneName);
                      const isSelected = selectedZoneKey === key;
                      const hasArea = Boolean(zoneAreas[key]);
                      const zoneColor = getStepColor(zone.step);
                      const textColor = isSelected
                        ? "#ffffff"
                        : hasArea
                        ? zoneColor
                        : appendAlpha(zoneColor, 0.85);
                      const backgroundColor = isSelected
                        ? zoneColor
                        : hasArea
                        ? appendAlpha(zoneColor, 0.12)
                        : appendAlpha(zoneColor, 0.08);
                      const borderColor = isSelected
                        ? zoneColor
                        : appendAlpha(zoneColor, hasArea ? 0.55 : 0.4);
                      const hoverBackground = isSelected
                        ? zoneColor
                        : appendAlpha(zoneColor, hasArea ? 0.18 : 0.12);
                      const hoverText = textColor;
                      const buttonStyle = {
                        backgroundColor,
                        borderColor,
                        color: textColor,
                        "--zone-hover-bg": hoverBackground,
                        "--zone-hover-text": hoverText,
                      } as CSSProperties & Record<string, string>;
                      const checkColor = isSelected ? "#ffffff" : textColor;
                      return (
                        <Button
                          key={key}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleZoneSelect(zone, e)}
                          style={buttonStyle}
                          className={cn(
                            "flex-none justify-between whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-0 hover:opacity-95 hover:!bg-[var(--zone-hover-bg)] hover:!text-[var(--zone-hover-text)]",
                            !hasArea && !isSelected && "border-dashed",
                            isSelected && "text-white"
                          )}
                        >
                          <span className="text-xs font-medium">
                            {zone.zoneName}
                          </span>
                          {hasArea && (
                            <Check
                              className="ml-2 h-4 w-4"
                              style={{ color: checkColor }}
                            />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div
              ref={imageContainerRef}
              className="relative overflow-hidden rounded-lg bg-white"
            >
              <img
                src={imageUrl}
                alt={`${airport} ${terminal} Terminal Layout`}
                className="h-auto w-full select-none object-contain"
                draggable={false}
              />

              <div
                className={cn(
                  "absolute inset-0",
                  canDraw ? "cursor-crosshair" : "cursor-not-allowed",
                  zoneItems.length === 0
                    ? "pointer-events-none"
                    : "pointer-events-auto"
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                {overlayItems.map(({ zone, rect }) => {
                  const key = getZoneKey(zone.step, zone.zoneName);
                  const isSelected = selectedZoneKey === key;
                  const color = getStepColor(zone.step);
                  const borderColor = isSelected
                    ? color
                    : appendAlpha(color, 0.6);
                  const backgroundColor = isSelected
                    ? appendAlpha(color, 0.45)
                    : appendAlpha(color, 0.22);
                  const labelBackground = isSelected
                    ? appendAlpha(color, 0.8)
                    : appendAlpha(color, 0.65);
                  return (
                    <div
                      key={key}
                      className="pointer-events-none absolute rounded-md border-2"
                      style={{
                        left: `${rect.x * 100}%`,
                        top: `${rect.y * 100}%`,
                        width: `${rect.width * 100}%`,
                        height: `${rect.height * 100}%`,
                        borderColor,
                        backgroundColor,
                      }}
                    >
                      <div
                        className="pointer-events-none absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white"
                        style={{
                          backgroundColor: labelBackground,
                        }}
                      >
                        {zone.zoneName}
                      </div>
                    </div>
                  );
                })}

                {draftRect && selectedZone && (
                  <div
                    className="pointer-events-none absolute z-20 rounded-md border-2"
                    style={{
                      left: `${draftRect.x * 100}%`,
                      top: `${draftRect.y * 100}%`,
                      width: `${draftRect.width * 100}%`,
                      height: `${draftRect.height * 100}%`,
                      borderColor: `${getStepColor(selectedZone.step)}B3`,
                      backgroundColor: `${getStepColor(selectedZone.step)}33`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No image available</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default TerminalImageManager;
