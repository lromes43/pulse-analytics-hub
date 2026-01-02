import { FunnelData } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface FunnelChartProps {
  data: FunnelData[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxCount = data[0]?.count || 1;
  
  const colors = [
    'bg-chart-1',
    'bg-chart-2',
    'bg-chart-3',
    'bg-chart-4',
    'bg-chart-5',
  ];

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const width = (item.count / maxCount) * 100;
        const conversionFromPrev = index > 0 
          ? Math.round((item.count / data[index - 1].count) * 100) 
          : 100;
        
        return (
          <div key={item.stage} className="group relative">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{item.stage}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {item.count.toLocaleString()}
                </span>
                {index > 0 && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    conversionFromPrev >= 50 ? "bg-chart-2/20 text-chart-2" : "bg-chart-3/20 text-chart-3"
                  )}>
                    {conversionFromPrev}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-10 w-full overflow-hidden rounded-lg bg-secondary">
              <div
                className={cn(
                  "h-full transition-all duration-500 ease-out",
                  colors[index % colors.length]
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
