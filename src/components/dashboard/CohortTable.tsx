import { CohortData } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface CohortTableProps {
  data: CohortData[];
}

export function CohortTable({ data }: CohortTableProps) {
  const getRetentionColor = (value: number) => {
    if (value >= 80) return "bg-chart-2/80 text-chart-2";
    if (value >= 60) return "bg-chart-2/50";
    if (value >= 40) return "bg-chart-3/50";
    if (value >= 20) return "bg-chart-4/30";
    return "bg-chart-4/20";
  };

  const maxMonths = Math.max(...data.map(d => d.retention.length));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-3 text-left font-medium text-muted-foreground">Cohort</th>
            <th className="px-3 py-3 text-center font-medium text-muted-foreground">Users</th>
            {Array.from({ length: maxMonths }).map((_, i) => (
              <th key={i} className="px-3 py-3 text-center font-medium text-muted-foreground">
                M{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((cohort) => (
            <tr key={cohort.cohort} className="border-b border-border/50 transition-colors hover:bg-secondary/50">
              <td className="px-3 py-3 font-medium">{cohort.cohort}</td>
              <td className="px-3 py-3 text-center text-muted-foreground">{cohort.size}</td>
              {cohort.retention.map((value, i) => (
                <td key={i} className="px-3 py-3">
                  <div
                    className={cn(
                      "mx-auto flex h-8 w-12 items-center justify-center rounded text-xs font-medium",
                      getRetentionColor(value)
                    )}
                  >
                    {value}%
                  </div>
                </td>
              ))}
              {Array.from({ length: maxMonths - cohort.retention.length }).map((_, i) => (
                <td key={`empty-${i}`} className="px-3 py-3">
                  <div className="mx-auto h-8 w-12 rounded bg-secondary/30" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
