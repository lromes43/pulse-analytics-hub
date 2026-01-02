import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const COUNTRIES = ['US', 'GB', 'DE', 'FR', 'CA', 'AU', 'JP', 'BR', 'IN', 'NL'];
const COUNTRY_WEIGHTS = [35, 12, 10, 8, 7, 6, 5, 5, 7, 5];
const TIERS = ['free', 'starter', 'pro', 'enterprise'] as const;
const CHANNELS = ['organic', 'paid_search', 'social', 'referral', 'direct', 'email'] as const;
const FEATURES = ['dashboard', 'reports', 'api', 'integrations', 'exports', 'automations', 'team', 'sso'];

function weightedRandomCountry(): string {
  const totalWeight = COUNTRY_WEIGHTS.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < COUNTRIES.length; i++) {
    random -= COUNTRY_WEIGHTS[i];
    if (random <= 0) return COUNTRIES[i];
  }
  return COUNTRIES[0];
}

const TIER_PRICES: Record<string, number> = {
  free: 0,
  starter: 29,
  pro: 99,
  enterprise: 299,
};

const CHURN_PROBABILITIES: Record<string, number> = {
  free: 0.4,
  starter: 0.15,
  pro: 0.08,
  enterprise: 0.03,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting data seed...');

    // Check if data already exists
    const { count: userCount } = await supabase
      .from('analytics_users')
      .select('*', { count: 'exact', head: true });

    if (userCount && userCount > 0) {
      console.log('Data already seeded, skipping...');
      return new Response(
        JSON.stringify({ message: 'Data already seeded', userCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 550 users
    const now = new Date();
    const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);
    const users: any[] = [];

    for (let i = 0; i < 550; i++) {
      const signupDate = new Date(
        sevenMonthsAgo.getTime() + Math.random() * (now.getTime() - sevenMonthsAgo.getTime())
      );
      
      const tier = randomFromArray(TIERS);
      const country = weightedRandomCountry();
      const churned = Math.random() < CHURN_PROBABILITIES[tier];
      const churnDate = churned 
        ? new Date(signupDate.getTime() + randomBetween(30, 120) * 24 * 60 * 60 * 1000)
        : null;

      users.push({
        email: `user${i + 1}@example.com`,
        signup_date: signupDate.toISOString(),
        subscription_tier: tier,
        churned,
        churn_date: churnDate && churnDate < now ? churnDate.toISOString() : null,
        country,
        acquisition_channel: randomFromArray(CHANNELS),
        monthly_revenue: TIER_PRICES[tier],
      });
    }

    // Insert users in batches
    console.log('Inserting users...');
    for (let i = 0; i < users.length; i += 100) {
      const batch = users.slice(i, i + 100);
      const { error } = await supabase.from('analytics_users').insert(batch);
      if (error) {
        console.error('User insert error:', error);
        throw error;
      }
    }
    console.log(`Inserted ${users.length} users`);

    // Generate revenue data for last 7 months
    console.log('Generating revenue data...');
    const revenueData: any[] = [];
    let baseMrr = 45000;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const newRevenue = Math.round(baseMrr * (0.08 + Math.random() * 0.05));
      const churnedRevenue = Math.round(baseMrr * (0.02 + Math.random() * 0.03));
      const expansionRevenue = Math.round(baseMrr * (0.02 + Math.random() * 0.02));
      baseMrr = baseMrr + newRevenue - churnedRevenue + expansionRevenue;

      revenueData.push({
        date: date.toISOString().slice(0, 10),
        mrr: Math.round(baseMrr),
        new_revenue: newRevenue,
        churned_revenue: churnedRevenue,
        expansion_revenue: expansionRevenue,
        one_time_payments: randomBetween(2000, 8000),
        refunds: randomBetween(200, 1500),
      });
    }

    const { error: revenueError } = await supabase.from('revenue').insert(revenueData);
    if (revenueError) {
      console.error('Revenue insert error:', revenueError);
      throw revenueError;
    }
    console.log('Inserted revenue data');

    // Generate usage metrics for last 30 days
    console.log('Generating usage metrics...');
    const usageData: any[] = [];
    for (const feature of FEATURES) {
      const baseUsage = randomBetween(1000, 10000);
      for (let day = 0; day < 30; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (29 - day));
        const dayOfWeek = date.getDay();
        const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1;
        
        usageData.push({
          feature,
          date: date.toISOString().slice(0, 10),
          usage_count: Math.round(baseUsage * weekendFactor * (0.8 + Math.random() * 0.4)),
        });
      }
    }

    // Insert usage in batches
    for (let i = 0; i < usageData.length; i += 100) {
      const batch = usageData.slice(i, i + 100);
      const { error } = await supabase.from('usage_metrics').insert(batch);
      if (error) {
        console.error('Usage insert error:', error);
        throw error;
      }
    }
    console.log('Inserted usage metrics');

    // Generate campaigns
    console.log('Generating campaigns...');
    const campaignNames = [
      'Summer Sale 2024', 'Product Launch', 'Black Friday', 'Q4 Push',
      'Retargeting', 'Brand Awareness', 'Feature Announcement', 'Holiday Special',
    ];
    const campaigns: any[] = [];

    for (const name of campaignNames) {
      const channel = randomFromArray(CHANNELS);
      const impressions = randomBetween(50000, 500000);
      const ctr = 0.01 + Math.random() * 0.04;
      const clicks = Math.round(impressions * ctr);
      const conversionRate = 0.02 + Math.random() * 0.08;
      const conversions = Math.round(clicks * conversionRate);
      const cpc = 0.5 + Math.random() * 2;
      const cost = Math.round(clicks * cpc);
      const avgRevenue = randomBetween(50, 200);
      
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - randomBetween(1, 6));

      campaigns.push({
        name,
        channel,
        impressions,
        clicks,
        conversions,
        cost,
        revenue: conversions * avgRevenue,
        start_date: startDate.toISOString().slice(0, 10),
      });
    }

    const { error: campaignError } = await supabase.from('campaigns').insert(campaigns);
    if (campaignError) {
      console.error('Campaign insert error:', campaignError);
      throw campaignError;
    }
    console.log('Inserted campaigns');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data seeded successfully',
        counts: {
          users: users.length,
          revenue: revenueData.length,
          usage: usageData.length,
          campaigns: campaigns.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
