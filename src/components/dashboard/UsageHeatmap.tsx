import { UsageData } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface UsageHeatmapProps {
  data: UsageData[];
}

export function UsageHeatmap({ data }: UsageHeatmapProps) {
  // Get the max value across all features for normalization
  const allValues = data.flatMap(d => d.daily);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);

  const getIntensity = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    if (normalized >= 0.8) return "bg-chart-1";
    if (normalized >= 0.6) return "bg-chart-1/70";
    if (normalized >= 0.4) return "bg-chart-1/50";
    if (normalized >= 0.2) return "bg-chart-1/30";
    return "bg-chart-1/10";
  };

  const formatFeatureName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Get day labels for last 30 days
  const getDayLabel = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - daysAgo));
    return date.getDate();
  };

  return (
    <div className="space-y-4">
      {/* Day labels */}
      <div className="flex items-center">
        <div className="w-24" />
        <div className="flex flex-1 justify-between text-xs text-muted-foreground">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Heatmap rows */}
      <div className="space-y-2">
        {data.slice(0, 6).map((feature) => (
          <div key={feature.feature} className="flex items-center gap-2">
            <div className="w-24 truncate text-sm font-medium">
              {formatFeatureName(feature.feature)}
            </div>
            <div className="flex flex-1 gap-0.5">
              {feature.daily.map((value, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-6 flex-1 rounded-sm transition-all duration-200 hover:ring-2 hover:ring-primary/50",
                    getIntensity(value)
                  )}
                  title={`${formatFeatureName(feature.feature)}: ${value.toLocaleString()} uses (Day ${getDayLabel(i)})`}
                />
              ))}
            </div>
            <div className="w-16 text-right text-sm text-muted-foreground">
              {(feature.total / 1000).toFixed(1)}k
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-4 w-4 rounded bg-chart-1/10" />
          <div className="h-4 w-4 rounded bg-chart-1/30" />
          <div className="h-4 w-4 rounded bg-chart-1/50" />
          <div className="h-4 w-4 rounded bg-chart-1/70" />
          <div className="h-4 w-4 rounded bg-chart-1" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
