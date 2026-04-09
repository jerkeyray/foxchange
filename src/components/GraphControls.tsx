"use client";

import { useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  currentIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  isAtStart: boolean;
  isAtEnd: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 2, 4];

export function GraphControls({
  currentIndex,
  totalSteps,
  isPlaying,
  speed,
  isAtStart,
  isAtEnd,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSetSpeed,
}: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          isPlaying ? onPause() : onPlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          onStepForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onStepBack();
          break;
        case "1": onSetSpeed(0.5); break;
        case "2": onSetSpeed(1); break;
        case "3": onSetSpeed(2); break;
        case "4": onSetSpeed(4); break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying, onPlay, onPause, onStepForward, onStepBack, onSetSpeed]);

  const pct = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono tabular-nums">
            Step <span className="text-foreground font-medium">{currentIndex + 1}</span> / {totalSteps}
          </span>
          <span className="text-muted-foreground font-mono tabular-nums">{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200 ease-out"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? "oklch(0.723 0.219 142.5)"
                : "linear-gradient(90deg, oklch(0.769 0.188 70), oklch(0.646 0.222 41))",
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg"
          onClick={onReset}
          disabled={isAtStart}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg"
          onClick={onStepBack}
          disabled={isAtStart}
        >
          <SkipBack className="w-3.5 h-3.5" />
        </Button>

        {/* Play/pause - larger, centered */}
        <Button
          size="icon"
          className={cn(
            "w-10 h-10 rounded-xl transition-all",
            isPlaying && "shadow-md shadow-primary/20"
          )}
          onClick={isPlaying ? onPause : onPlay}
          disabled={isAtEnd && !isPlaying}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg"
          onClick={onStepForward}
          disabled={isAtEnd}
        >
          <SkipForward className="w-3.5 h-3.5" />
        </Button>

        {/* Speed selector */}
        <div className="ml-auto flex items-center bg-muted/50 rounded-lg p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-mono transition-all duration-150",
                speed === s
                  ? "bg-card text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground">Space</kbd> play/pause</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground">←→</kbd> step</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground">1-4</kbd> speed</span>
      </div>
    </div>
  );
}
