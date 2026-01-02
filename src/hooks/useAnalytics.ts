import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  mrr: number;
  mrrGrowth: number;
  churnRate: number;
  avgRevenuePerUser: number;
}

interface RevenueData {
  date: string;
  mrr: number;
  newRevenue: number;
  churnedRevenue: number;
  expansionRevenue: number;
  oneTimePayments: number;
  refunds: number;
}

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
}

interface UsageData {
  feature: string;
  daily: number[];
  total: number;
}

interface GeoData {
  country: string;
  code: string;
  users: number;
  revenue: number;
}

interface CampaignData {
  id: string;
  name: string;
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  roi: number;
}

async function fetchAnalytics<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const queryParams = new URLSearchParams({ endpoint, ...params });
  const response = await fetch(`${SUPABASE_URL}/functions/v1/analytics?${queryParams}`);
  
  if (!response.ok) {
    throw new Error(`Analytics request failed: ${response.statusText}`);
  }
  
  return response.json();
}

export function useStats(tier: string = 'all', segment: string = 'all') {
  return useQuery<DashboardStats>({
    queryKey: ['stats', tier, segment],
    queryFn: () => fetchAnalytics<DashboardStats>('stats', { tier, segment }),
    staleTime: 30000,
  });
}

export function useRevenue() {
  return useQuery<RevenueData[]>({
    queryKey: ['revenue'],
    queryFn: () => fetchAnalytics<RevenueData[]>('revenue'),
    staleTime: 60000,
  });
}

export function useFunnel() {
  return useQuery<FunnelData[]>({
    queryKey: ['funnel'],
    queryFn: () => fetchAnalytics<FunnelData[]>('funnel'),
    staleTime: 60000,
  });
}

export function useCohorts() {
  return useQuery<CohortData[]>({
    queryKey: ['cohorts'],
    queryFn: () => fetchAnalytics<CohortData[]>('cohorts'),
    staleTime: 60000,
  });
}

export function useUsage() {
  return useQuery<UsageData[]>({
    queryKey: ['usage'],
    queryFn: () => fetchAnalytics<UsageData[]>('usage'),
    staleTime: 60000,
  });
}

export function useGeo(tier: string = 'all') {
  return useQuery<GeoData[]>({
    queryKey: ['geo', tier],
    queryFn: () => fetchAnalytics<GeoData[]>('geo', { tier }),
    staleTime: 60000,
  });
}

export function useCampaigns() {
  return useQuery<CampaignData[]>({
    queryKey: ['campaigns'],
    queryFn: () => fetchAnalytics<CampaignData[]>('campaigns'),
    staleTime: 60000,
  });
}

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/seed-data`, {
    method: 'POST',
  });
  return response.json();
}

export type { DashboardStats, RevenueData, FunnelData, CohortData, UsageData, GeoData, CampaignData };
