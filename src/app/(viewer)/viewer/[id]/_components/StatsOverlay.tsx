"use client";

import { useMemo } from "react";
import { useViewerStore } from "../_stores/viewerStore";
import type { PassengerStepEvent } from "@/types/viewerTypes";

const STEP_COLORS = [
  "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4",
];

interface StatsOverlayProps {
  scenarioId: string;
}

export default function StatsOverlay({ scenarioId }: StatsOverlayProps) {
  const timelineData = useViewerStore((s) => s.timelineData);
  const currentTime = useViewerStore((s) => s.currentTime);

  const stats = useMemo(() => {
    if (!timelineData) return null;

    const { passengers, steps } = timelineData;
    let visible = 0;
    const perStep: Record<string, { waiting: number; processing: number }> = {};

    for (const step of steps) {
      perStep[step.name] = { waiting: 0, processing: 0 };
    }

    for (const entry of passengers) {
      if (!entry) continue;
      const isNew = typeof entry[0] === "number";
      const showUpOff = isNew ? (entry[0] as number) : -1;
      const evts = (isNew ? entry[1] : entry) as (PassengerStepEvent | null)[];
      if (!evts || !Array.isArray(evts)) continue;

      let isVisible = false;

      // Check if currently traveling from entrance
      let firstOnP = -1;
      for (const ev of evts) { if (ev) { firstOnP = ev[0]; break; } }
      if (showUpOff >= 0 && firstOnP >= 0) {
        const minDur = 60;
        const entranceStart = firstOnP - Math.max(firstOnP - showUpOff, minDur);
        if (currentTime < entranceStart) continue;
        if (currentTime < firstOnP) isVisible = true;
      }

      for (let s = 0; s < evts.length; s++) {
        const ev = evts[s];
        if (!ev) continue;
        const [onPred, startOff, doneOff] = ev;
        const stepName = steps[s]?.name;

        if (currentTime >= onPred && currentTime < doneOff) {
          isVisible = true;
          if (stepName && perStep[stepName]) {
            if (currentTime < startOff) {
              perStep[stepName].waiting++;
            } else {
              perStep[stepName].processing++;
            }
          }
        }
      }
      if (isVisible) visible++;
    }

    const total = passengers.length;

    return { visible, perStep, total };
  }, [timelineData, Math.floor(currentTime / 2)]);

  if (!stats) return null;

  return (
    <div className="absolute top-4 right-4 z-10 min-w-[200px] rounded-xl bg-black/60 px-4 py-3 text-white backdrop-blur-md">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
        Scenario
      </div>
      <div className="mb-3 truncate font-mono text-xs text-white/70">
        {scenarioId.slice(0, 16)}...
      </div>

      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wider text-white/40">
          Active Pax
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {stats.visible.toLocaleString()}
          <span className="text-white/30">/{stats.total.toLocaleString()}</span>
        </span>
      </div>

      <div className="mb-2 rounded bg-white/5 px-2 py-1 text-[9px] text-white/40">
        Each dot = 1 passenger. All states rendered at 1:1 ratio.
      </div>

      <div className="mt-3 space-y-1.5">
        {timelineData?.steps.map((step, idx) => {
          const s = stats.perStep[step.name];
          if (!s) return null;
          const total = s.waiting + s.processing;
          const color = STEP_COLORS[idx % STEP_COLORS.length];
          const label = step.name.replace(/_/g, " ");
          return (
            <div key={step.name}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] capitalize text-white/60">
                    {label}
                  </span>
                </div>
                <span className="font-mono text-xs tabular-nums text-white/80">
                  {total.toLocaleString()}
                </span>
              </div>
              {total > 0 && (
                <div className="ml-4 flex gap-2 text-[9px] text-white/40">
                  <span>wait {s.waiting.toLocaleString()}</span>
                  <span>proc {s.processing.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-2">
        {[
          { label: "Waiting", color: "#e2e8f0" },
          { label: "Processing", color: "#ff2d55" },
          { label: "Traveling", color: "#00e5ff" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] text-white/40">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
