import { CampaignData } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CampaignTableProps {
  data: CampaignData[];
}

export function CampaignTable({ data }: CampaignTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      organic: 'bg-chart-2/20 text-chart-2',
      paid_search: 'bg-chart-1/20 text-chart-1',
      social: 'bg-chart-5/20 text-chart-5',
      referral: 'bg-chart-3/20 text-chart-3',
      direct: 'bg-secondary text-secondary-foreground',
      email: 'bg-chart-4/20 text-chart-4',
    };
    return colors[channel] || 'bg-secondary text-secondary-foreground';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-3 text-left font-medium text-muted-foreground">Campaign</th>
            <th className="px-3 py-3 text-left font-medium text-muted-foreground">Channel</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Impressions</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Clicks</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Conv.</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Cost</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Revenue</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">ROI</th>
          </tr>
        </thead>
        <tbody>
          {data.map((campaign) => {
            const isPositiveRoi = campaign.roi >= 0;
            return (
              <tr key={campaign.id} className="border-b border-border/50 transition-colors hover:bg-secondary/50">
                <td className="px-3 py-3 font-medium">{campaign.name}</td>
                <td className="px-3 py-3">
                  <Badge variant="secondary" className={cn("capitalize", getChannelColor(campaign.channel))}>
                    {campaign.channel.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right text-muted-foreground">{formatNumber(campaign.impressions)}</td>
                <td className="px-3 py-3 text-right text-muted-foreground">{formatNumber(campaign.clicks)}</td>
                <td className="px-3 py-3 text-right text-muted-foreground">{campaign.conversions}</td>
                <td className="px-3 py-3 text-right text-muted-foreground">{formatCurrency(campaign.cost)}</td>
                <td className="px-3 py-3 text-right font-medium">{formatCurrency(campaign.revenue)}</td>
                <td className="px-3 py-3">
                  <div className={cn(
                    "flex items-center justify-end gap-1 font-medium",
                    isPositiveRoi ? "text-chart-2" : "text-chart-4"
                  )}>
                    {isPositiveRoi ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {campaign.roi}%
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
