import { useState, useEffect } from "react";
import { Users, DollarSign, TrendingUp, UserMinus, Database } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { CohortTable } from "@/components/dashboard/CohortTable";
import { UsageHeatmap } from "@/components/dashboard/UsageHeatmap";
import { GeoChart } from "@/components/dashboard/GeoChart";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import {
  StatCardSkeleton,
  ChartCardSkeleton,
  TableSkeleton,
} from "@/components/dashboard/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useStats,
  useRevenue,
  useFunnel,
  useCohorts,
  useUsage,
  useGeo,
  useCampaigns,
  seedDatabase,
} from "@/hooks/useAnalytics";

export default function Index() {
  const [dateRange, setDateRange] = useState("6m");
  const [segment, setSegment] = useState("all");
  const [tier, setTier] = useState("all");
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  // Fetch data from API
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStats(tier, segment);
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useRevenue();
  const { data: funnelData, isLoading: funnelLoading, refetch: refetchFunnel } = useFunnel();
  const { data: cohortData, isLoading: cohortLoading, refetch: refetchCohorts } = useCohorts();
  const { data: usageData, isLoading: usageLoading, refetch: refetchUsage } = useUsage();
  const { data: geoData, isLoading: geoLoading, refetch: refetchGeo } = useGeo(tier);
  const { data: campaignData, isLoading: campaignLoading, refetch: refetchCampaigns } = useCampaigns();

  const isLoading = statsLoading || revenueLoading;
  const hasNoData = !statsLoading && (!stats || stats.totalUsers === 0);

  const handleRefresh = () => {
    refetchStats();
    refetchRevenue();
    refetchFunnel();
    refetchCohorts();
    refetchUsage();
    refetchGeo();
    refetchCampaigns();
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDatabase();
      toast({
        title: result.success ? "Data seeded successfully" : "Seeding skipped",
        description: result.message,
      });
      handleRefresh();
    } catch (error) {
      toast({
        title: "Error seeding data",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Show seed button if no data
  if (hasNoData) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Database className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">No Data Found</h2>
              <p className="text-muted-foreground max-w-md">
                The database is empty. Click the button below to seed it with 550+ users, 
                6 months of revenue data, usage metrics, and marketing campaigns.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handleSeedData} 
              disabled={isSeeding}
              className="gap-2"
            >
              {isSeeding ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Seeding Data...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Seed Sample Data
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="mb-8">
          <FilterBar
            dateRange={dateRange}
            setDateRange={setDateRange}
            segment={segment}
            setSegment={setSegment}
            tier={tier}
            setTier={setTier}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : stats ? (
            <>
              <StatCard
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                change={12.5}
                changeLabel="vs last month"
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                title="Monthly Revenue"
                value={formatCurrency(stats.mrr)}
                change={stats.mrrGrowth}
                changeLabel="vs last month"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <StatCard
                title="ARPU"
                value={formatCurrency(stats.avgRevenuePerUser)}
                change={5.2}
                changeLabel="vs last month"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatCard
                title="Churn Rate"
                value={`${stats.churnRate}%`}
                change={-2.1}
                changeLabel="vs last month"
                icon={<UserMinus className="h-5 w-5" />}
              />
            </>
          ) : null}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Trends */}
          {revenueLoading ? (
            <ChartCardSkeleton className="lg:col-span-2" />
          ) : revenueData ? (
            <ChartCard
              title="Revenue Trends"
              description="Monthly recurring revenue and new revenue over time"
              className="lg:col-span-2"
            >
              <RevenueChart data={revenueData} />
            </ChartCard>
          ) : null}

          {/* Acquisition Funnel */}
          {funnelLoading ? (
            <ChartCardSkeleton height="h-[300px]" />
          ) : funnelData ? (
            <ChartCard
              title="Acquisition Funnel"
              description="User journey from visit to conversion"
            >
              <FunnelChart data={funnelData} />
            </ChartCard>
          ) : null}

          {/* Geographic Distribution */}
          {geoLoading ? (
            <ChartCardSkeleton height="h-[300px]" />
          ) : geoData ? (
            <ChartCard
              title="Geographic Distribution"
              description="User distribution by country"
            >
              <GeoChart data={geoData} />
            </ChartCard>
          ) : null}

          {/* Cohort Retention */}
          {cohortLoading ? (
            <TableSkeleton />
          ) : cohortData ? (
            <ChartCard
              title="Cohort Retention"
              description="Monthly user retention by signup cohort"
              className="lg:col-span-2"
            >
              <CohortTable data={cohortData} />
            </ChartCard>
          ) : null}

          {/* Feature Usage Heatmap */}
          {usageLoading ? (
            <ChartCardSkeleton height="h-[250px]" />
          ) : usageData ? (
            <ChartCard
              title="Feature Usage"
              description="Daily feature usage over the last 30 days"
              className="lg:col-span-2"
            >
              <UsageHeatmap data={usageData} />
            </ChartCard>
          ) : null}

          {/* Campaign Performance */}
          {campaignLoading ? (
            <TableSkeleton />
          ) : campaignData ? (
            <ChartCard
              title="Campaign Performance"
              description="Marketing campaign metrics and ROI"
              className="lg:col-span-2"
            >
              <CampaignTable data={campaignData} />
            </ChartCard>
          ) : null}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>Pulse Analytics Dashboard • Built with React, TypeScript & Lovable Cloud</p>
        </footer>
      </main>
    </div>
  );
}
