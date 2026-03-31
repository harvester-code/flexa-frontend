"use client";

import { useMemo } from "react";
import { useViewerStore } from "../_stores/viewerStore";
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

    for (const pax of passengers) {
      if (!pax) continue;
      let isVisible = false;

      for (let s = 0; s < pax.length; s++) {
        const ev = pax[s];
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

    return { visible, perStep, total: passengers.length };
  }, [timelineData, Math.floor(currentTime / 2)]); // update every ~2s of sim time

  if (!stats) return null;

  return (
    <div className="absolute top-4 right-4 z-10 min-w-[180px] rounded-xl bg-black/60 px-4 py-3 text-white backdrop-blur-md">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
        Scenario
      </div>
      <div className="mb-3 truncate font-mono text-xs text-white/70">
        {scenarioId.slice(0, 16)}...
      </div>

      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wider text-white/40">
          Passengers
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {stats.visible.toLocaleString()}
          <span className="text-white/30">/{stats.total.toLocaleString()}</span>
        </span>
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
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] capitalize text-white/60">
                    {label}
                  </span>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-white/80">
                  {total.toLocaleString()}
                </span>
              </div>
              {total > 0 && (
                <div className="ml-3.5 flex gap-2 text-[9px] text-white/40">
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
          { label: "Waiting", color: "#f59e0b" },
          { label: "Processing", color: "#10b981" },
          { label: "Traveling", color: "#3b82f6" },
          { label: "Done", color: "#64748b" },
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
