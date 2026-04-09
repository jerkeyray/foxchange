import { cn } from "@/lib/utils"

interface SliderProps {
  className?: string
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
}

function Slider({
  className,
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
}: SliderProps) {
  const current = value?.[0] ?? min
  const pct = ((current - min) / (max - min)) * 100

  return (
    <div className={cn("relative flex w-full touch-none items-center select-none", className)} data-slot="slider">
      <div className="relative h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div
        className="absolute size-3 rounded-full border border-ring bg-white ring-ring/50 transition-shadow hover:ring-3 focus-visible:ring-3 pointer-events-none"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  )
}

export { Slider }
