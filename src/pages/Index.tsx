import { useState, useEffect, useMemo } from "react";
import { Users, DollarSign, TrendingUp, UserMinus } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { CohortTable } from "@/components/dashboard/CohortTable";
import { UsageHeatmap } from "@/components/dashboard/UsageHeatmap";
import { GeoChart } from "@/components/dashboard/GeoChart";
import {
  StatCardSkeleton,
  ChartCardSkeleton,
  TableSkeleton,
} from "@/components/dashboard/LoadingSkeleton";
import {
  generateUsers,
  generateRevenueData,
  generateFunnelData,
  generateCohortData,
  generateUsageData,
  generateGeoData,
  generateDashboardStats,
} from "@/lib/mockData";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("6m");
  const [segment, setSegment] = useState("all");
  const [tier, setTier] = useState("all");

  // Generate all data
  const users = useMemo(() => generateUsers(550), []);
  const revenueData = useMemo(() => generateRevenueData(), []);
  const funnelData = useMemo(() => generateFunnelData(), []);
  const cohortData = useMemo(() => generateCohortData(), []);
  const usageData = useMemo(() => generateUsageData(), []);
  const geoData = useMemo(() => generateGeoData(users), [users]);
  const stats = useMemo(() => generateDashboardStats(users, revenueData), [users, revenueData]);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
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
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Trends */}
          {isLoading ? (
            <ChartCardSkeleton />
          ) : (
            <ChartCard
              title="Revenue Trends"
              description="Monthly recurring revenue and new revenue over time"
              className="lg:col-span-2"
            >
              <RevenueChart data={revenueData} />
            </ChartCard>
          )}

          {/* Acquisition Funnel */}
          {isLoading ? (
            <ChartCardSkeleton height="h-[300px]" />
          ) : (
            <ChartCard
              title="Acquisition Funnel"
              description="User journey from visit to conversion"
            >
              <FunnelChart data={funnelData} />
            </ChartCard>
          )}

          {/* Geographic Distribution */}
          {isLoading ? (
            <ChartCardSkeleton height="h-[300px]" />
          ) : (
            <ChartCard
              title="Geographic Distribution"
              description="User distribution by country"
            >
              <GeoChart data={geoData} />
            </ChartCard>
          )}

          {/* Cohort Retention */}
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <ChartCard
              title="Cohort Retention"
              description="Monthly user retention by signup cohort"
              className="lg:col-span-2"
            >
              <CohortTable data={cohortData} />
            </ChartCard>
          )}

          {/* Feature Usage Heatmap */}
          {isLoading ? (
            <ChartCardSkeleton height="h-[250px]" />
          ) : (
            <ChartCard
              title="Feature Usage"
              description="Daily feature usage over the last 30 days"
              className="lg:col-span-2"
            >
              <UsageHeatmap data={usageData} />
            </ChartCard>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>Pulse Analytics Dashboard • Built with React & TypeScript</p>
        </footer>
      </main>
    </div>
  );
}
