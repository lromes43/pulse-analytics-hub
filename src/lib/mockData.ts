// Generate realistic mock data for 6+ months

const COUNTRIES = [
  { code: 'US', name: 'United States', weight: 35 },
  { code: 'GB', name: 'United Kingdom', weight: 12 },
  { code: 'DE', name: 'Germany', weight: 10 },
  { code: 'FR', name: 'France', weight: 8 },
  { code: 'CA', name: 'Canada', weight: 7 },
  { code: 'AU', name: 'Australia', weight: 6 },
  { code: 'JP', name: 'Japan', weight: 5 },
  { code: 'BR', name: 'Brazil', weight: 5 },
  { code: 'IN', name: 'India', weight: 7 },
  { code: 'NL', name: 'Netherlands', weight: 5 },
];

const SUBSCRIPTION_TIERS = ['free', 'starter', 'pro', 'enterprise'] as const;
const ACQUISITION_CHANNELS = ['organic', 'paid_search', 'social', 'referral', 'direct', 'email'] as const;
const FEATURES = ['dashboard', 'reports', 'api', 'integrations', 'exports', 'automations', 'team', 'sso'];

type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number];
type AcquisitionChannel = typeof ACQUISITION_CHANNELS[number];

export interface User {
  id: string;
  email: string;
  signupDate: Date;
  subscriptionTier: SubscriptionTier;
  churned: boolean;
  churnDate: Date | null;
  country: string;
  acquisitionChannel: AcquisitionChannel;
  monthlyRevenue: number;
}

export interface RevenueData {
  date: string;
  mrr: number;
  newRevenue: number;
  churnedRevenue: number;
  expansionRevenue: number;
  oneTimePayments: number;
  refunds: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
}

export interface UsageData {
  feature: string;
  daily: number[];
  total: number;
}

export interface GeoData {
  country: string;
  code: string;
  users: number;
  revenue: number;
}

export interface CampaignData {
  id: string;
  name: string;
  channel: AcquisitionChannel;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
}

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate 500+ users
export function generateUsers(count: number = 550): User[] {
  const users: User[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);
  
  const tierPrices: Record<SubscriptionTier, number> = {
    free: 0,
    starter: 29,
    pro: 99,
    enterprise: 299,
  };
  
  for (let i = 0; i < count; i++) {
    const signupDate = new Date(
      sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
    );
    
    const tier = randomFromArray(SUBSCRIPTION_TIERS);
    const country = weightedRandom(COUNTRIES);
    
    // Churn probability varies by tier
    const churnProbabilities: Record<SubscriptionTier, number> = {
      free: 0.4,
      starter: 0.15,
      pro: 0.08,
      enterprise: 0.03,
    };
    
    const churned = Math.random() < churnProbabilities[tier];
    const churnDate = churned 
      ? new Date(signupDate.getTime() + randomBetween(30, 120) * 24 * 60 * 60 * 1000)
      : null;
    
    users.push({
      id: generateUUID(),
      email: `user${i + 1}@example.com`,
      signupDate,
      subscriptionTier: tier,
      churned,
      churnDate: churnDate && churnDate < now ? churnDate : null,
      country: country.code,
      acquisitionChannel: randomFromArray(ACQUISITION_CHANNELS),
      monthlyRevenue: tierPrices[tier],
    });
  }
  
  return users.sort((a, b) => a.signupDate.getTime() - b.signupDate.getTime());
}

// Generate revenue data for last 6 months
export function generateRevenueData(): RevenueData[] {
  const data: RevenueData[] = [];
  const now = new Date();
  
  let baseMrr = 45000; // Starting MRR
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toISOString().slice(0, 7);
    
    // Add some growth trend with variance
    const growthRate = 0.05 + (Math.random() * 0.08);
    const newRevenue = baseMrr * (0.08 + Math.random() * 0.05);
    const churnedRevenue = baseMrr * (0.02 + Math.random() * 0.03);
    const expansionRevenue = baseMrr * (0.02 + Math.random() * 0.02);
    
    baseMrr = baseMrr + newRevenue - churnedRevenue + expansionRevenue;
    
    data.push({
      date: monthStr,
      mrr: Math.round(baseMrr),
      newRevenue: Math.round(newRevenue),
      churnedRevenue: Math.round(churnedRevenue),
      expansionRevenue: Math.round(expansionRevenue),
      oneTimePayments: Math.round(randomBetween(2000, 8000)),
      refunds: Math.round(randomBetween(200, 1500)),
    });
  }
  
  return data;
}

// Generate funnel data
export function generateFunnelData(): FunnelData[] {
  const stages = [
    { stage: 'Website Visits', base: 50000 },
    { stage: 'Sign Ups', base: 5000 },
    { stage: 'Activated', base: 2500 },
    { stage: 'Trial Started', base: 1200 },
    { stage: 'Converted', base: 450 },
  ];
  
  const total = stages[0].base;
  
  return stages.map((s, i) => {
    const count = Math.round(s.base * (0.9 + Math.random() * 0.2));
    return {
      stage: s.stage,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
    };
  });
}

// Generate cohort retention data
export function generateCohortData(): CohortData[] {
  const cohorts: CohortData[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const size = randomBetween(60, 120);
    
    const retention: number[] = [100]; // Month 0 is always 100%
    let currentRetention = 100;
    
    for (let month = 1; month <= 6 - i; month++) {
      // Retention drops more in early months
      const drop = month === 1 ? randomBetween(15, 25) : randomBetween(3, 10);
      currentRetention = Math.max(0, currentRetention - drop);
      retention.push(Math.round(currentRetention));
    }
    
    cohorts.push({ cohort: cohortName, size, retention });
  }
  
  return cohorts;
}

// Generate feature usage data
export function generateUsageData(): UsageData[] {
  return FEATURES.map(feature => {
    const baseUsage = randomBetween(1000, 10000);
    const daily: number[] = [];
    
    for (let i = 0; i < 30; i++) {
      // Add day-of-week pattern (less on weekends)
      const dayOfWeek = (new Date().getDay() - (29 - i) + 7) % 7;
      const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1;
      daily.push(Math.round(baseUsage * weekendFactor * (0.8 + Math.random() * 0.4)));
    }
    
    return {
      feature,
      daily,
      total: daily.reduce((a, b) => a + b, 0),
    };
  });
}

// Generate geographic data
export function generateGeoData(users: User[]): GeoData[] {
  const geoMap = new Map<string, { users: number; revenue: number }>();
  
  users.forEach(user => {
    const existing = geoMap.get(user.country) || { users: 0, revenue: 0 };
    existing.users += 1;
    if (!user.churned) {
      existing.revenue += user.monthlyRevenue;
    }
    geoMap.set(user.country, existing);
  });
  
  return COUNTRIES.map(c => ({
    country: c.name,
    code: c.code,
    users: geoMap.get(c.code)?.users || 0,
    revenue: geoMap.get(c.code)?.revenue || 0,
  })).sort((a, b) => b.users - a.users);
}

// Generate campaign data
export function generateCampaignData(): CampaignData[] {
  const campaigns: CampaignData[] = [];
  const campaignNames = [
    'Summer Sale 2024', 'Product Launch', 'Black Friday', 'Q4 Push',
    'Retargeting', 'Brand Awareness', 'Feature Announcement', 'Holiday Special',
  ];
  
  campaignNames.forEach((name, i) => {
    const channel = randomFromArray(ACQUISITION_CHANNELS);
    const impressions = randomBetween(50000, 500000);
    const ctr = 0.01 + Math.random() * 0.04;
    const clicks = Math.round(impressions * ctr);
    const conversionRate = 0.02 + Math.random() * 0.08;
    const conversions = Math.round(clicks * conversionRate);
    const cpc = 0.5 + Math.random() * 2;
    const cost = Math.round(clicks * cpc);
    const avgRevenue = randomBetween(50, 200);
    
    campaigns.push({
      id: generateUUID(),
      name,
      channel,
      impressions,
      clicks,
      conversions,
      cost,
      revenue: conversions * avgRevenue,
    });
  });
  
  return campaigns;
}

// Summary stats
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  mrr: number;
  mrrGrowth: number;
  churnRate: number;
  avgRevenuePerUser: number;
}

export function generateDashboardStats(users: User[], revenueData: RevenueData[]): DashboardStats {
  const activeUsers = users.filter(u => !u.churned).length;
  const latestMrr = revenueData[revenueData.length - 1]?.mrr || 0;
  const previousMrr = revenueData[revenueData.length - 2]?.mrr || latestMrr;
  const mrrGrowth = previousMrr ? ((latestMrr - previousMrr) / previousMrr) * 100 : 0;
  const churnedUsers = users.filter(u => u.churned).length;
  
  return {
    totalUsers: users.length,
    activeUsers,
    mrr: latestMrr,
    mrrGrowth: Math.round(mrrGrowth * 10) / 10,
    churnRate: Math.round((churnedUsers / users.length) * 100 * 10) / 10,
    avgRevenuePerUser: activeUsers ? Math.round(latestMrr / activeUsers) : 0,
  };
}
