"use client";

import { useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { useViewerStore } from "../_stores/viewerStore";

const SPEED_OPTIONS = [1, 2, 4, 8, 16, 32];

function formatTime(seconds: number): string {
  const totalMin = Math.floor(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatClock(baseTime: string | null, offsetSec: number): string {
  if (!baseTime) return formatTime(offsetSec);
  const d = new Date(baseTime);
  d.setSeconds(d.getSeconds() + offsetSec);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface PlaybackControlsProps {
  onBack: () => void;
}

export default function PlaybackControls({ onBack }: PlaybackControlsProps) {
  const isPlaying = useViewerStore((s) => s.isPlaying);
  const playbackSpeed = useViewerStore((s) => s.playbackSpeed);
  const currentTime = useViewerStore((s) => s.currentTime);
  const maxTime = useViewerStore((s) => s.maxTime);
  const baseTime = useViewerStore((s) => s.timelineData?.base_time ?? null);
  const togglePlay = useViewerStore((s) => s.togglePlay);
  const setSpeed = useViewerStore((s) => s.setSpeed);
  const seekTo = useViewerStore((s) => s.seekTo);

  const progress = maxTime > 0 ? currentTime / maxTime : 0;

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      seekTo(parseFloat(e.target.value));
    },
    [seekTo],
  );

  const handleReset = useCallback(() => {
    seekTo(0);
  }, [seekTo]);

  return (
    <div className="absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 pb-5 pt-12">
      {/* Timeline scrubber */}
      <div className="mb-3 flex items-center gap-3">
        <span className="w-12 text-right font-mono text-xs text-white/70">
          {formatClock(baseTime, currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={maxTime}
          step={1}
          value={currentTime}
          onChange={handleSlider}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-blue-500
                     [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
        />
        <span className="w-12 font-mono text-xs text-white/70">
          {formatClock(baseTime, maxTime)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left: back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Center: playback */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-0.5 rounded-full bg-white/5 px-1 py-0.5">
            {SPEED_OPTIONS.map((sp) => (
              <button
                key={sp}
                onClick={() => setSpeed(sp)}
                className={`rounded-full px-2 py-1 text-[11px] font-medium transition ${
                  playbackSpeed === sp
                    ? "bg-blue-500 text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: progress pct */}
        <span className="text-xs text-white/40">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}
