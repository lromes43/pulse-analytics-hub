import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'stats';
    const tier = url.searchParams.get('tier') || 'all';
    const segment = url.searchParams.get('segment') || 'all';

    console.log(`Analytics request: ${endpoint}, tier: ${tier}, segment: ${segment}`);

    switch (endpoint) {
      case 'stats': {
        // Get dashboard stats
        let query = supabase.from('analytics_users').select('*');
        
        if (tier !== 'all') {
          query = query.eq('subscription_tier', tier);
        }
        if (segment === 'active') {
          query = query.eq('churned', false);
        } else if (segment === 'churned') {
          query = query.eq('churned', true);
        }

        const { data: users, error: usersError } = await query;
        if (usersError) throw usersError;

        const { data: revenueData, error: revenueError } = await supabase
          .from('revenue')
          .select('*')
          .order('date', { ascending: true });
        if (revenueError) throw revenueError;

        const activeUsers = users?.filter(u => !u.churned) || [];
        const latestMrr = revenueData?.[revenueData.length - 1]?.mrr || 0;
        const previousMrr = revenueData?.[revenueData.length - 2]?.mrr || latestMrr;
        const mrrGrowth = previousMrr ? ((latestMrr - previousMrr) / previousMrr) * 100 : 0;
        const churnedCount = users?.filter(u => u.churned).length || 0;

        return new Response(JSON.stringify({
          totalUsers: users?.length || 0,
          activeUsers: activeUsers.length,
          mrr: latestMrr,
          mrrGrowth: Math.round(mrrGrowth * 10) / 10,
          churnRate: users?.length ? Math.round((churnedCount / users.length) * 100 * 10) / 10 : 0,
          avgRevenuePerUser: activeUsers.length ? Math.round(latestMrr / activeUsers.length) : 0,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'revenue': {
        const { data, error } = await supabase
          .from('revenue')
          .select('*')
          .order('date', { ascending: true });
        if (error) throw error;

        return new Response(JSON.stringify(data?.map(r => ({
          date: r.date.slice(0, 7),
          mrr: r.mrr,
          newRevenue: r.new_revenue,
          churnedRevenue: r.churned_revenue,
          expansionRevenue: r.expansion_revenue,
          oneTimePayments: r.one_time_payments,
          refunds: r.refunds,
        })) || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'funnel': {
        // Calculate funnel from users
        const { data: users, error } = await supabase.from('analytics_users').select('*');
        if (error) throw error;

        const total = users?.length || 0;
        // Simulate funnel stages based on user data
        const signups = total;
        const activated = Math.round(total * 0.65);
        const trialStarted = Math.round(total * 0.35);
        const converted = users?.filter(u => u.subscription_tier !== 'free').length || 0;
        const websiteVisits = Math.round(signups / 0.08); // ~8% conversion

        const funnel = [
          { stage: 'Website Visits', count: websiteVisits, percentage: 100 },
          { stage: 'Sign Ups', count: signups, percentage: Math.round((signups / websiteVisits) * 100 * 10) / 10 },
          { stage: 'Activated', count: activated, percentage: Math.round((activated / websiteVisits) * 100 * 10) / 10 },
          { stage: 'Trial Started', count: trialStarted, percentage: Math.round((trialStarted / websiteVisits) * 100 * 10) / 10 },
          { stage: 'Converted', count: converted, percentage: Math.round((converted / websiteVisits) * 100 * 10) / 10 },
        ];

        return new Response(JSON.stringify(funnel), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'cohorts': {
        const { data: users, error } = await supabase
          .from('analytics_users')
          .select('*')
          .order('signup_date', { ascending: true });
        if (error) throw error;

        // Group users by signup month
        const cohortMap = new Map<string, { total: number; churned: number[]; signupMonth: Date }>();
        const now = new Date();

        users?.forEach(user => {
          const signupDate = new Date(user.signup_date);
          const cohortKey = `${signupDate.getFullYear()}-${String(signupDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!cohortMap.has(cohortKey)) {
            cohortMap.set(cohortKey, { total: 0, churned: [], signupMonth: signupDate });
          }
          
          const cohort = cohortMap.get(cohortKey)!;
          cohort.total++;
          
          if (user.churned && user.churn_date) {
            const churnDate = new Date(user.churn_date);
            const monthsToChurn = Math.floor(
              (churnDate.getTime() - signupDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
            );
            cohort.churned.push(monthsToChurn);
          }
        });

        const cohorts = Array.from(cohortMap.entries())
          .slice(-7) // Last 7 months
          .map(([key, data]) => {
            const monthsActive = Math.floor(
              (now.getTime() - data.signupMonth.getTime()) / (30 * 24 * 60 * 60 * 1000)
            );
            
            const retention = [100];
            let remaining = data.total;
            
            for (let month = 1; month <= Math.min(monthsActive, 6); month++) {
              const churnedThisMonth = data.churned.filter(m => m < month).length;
              remaining = data.total - churnedThisMonth;
              retention.push(Math.round((remaining / data.total) * 100));
            }

            const date = new Date(key + '-01');
            return {
              cohort: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
              size: data.total,
              retention,
            };
          });

        return new Response(JSON.stringify(cohorts), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'usage': {
        const { data, error } = await supabase
          .from('usage_metrics')
          .select('*')
          .order('date', { ascending: true });
        if (error) throw error;

        // Group by feature
        const usageMap = new Map<string, { daily: number[]; total: number }>();
        
        data?.forEach(row => {
          if (!usageMap.has(row.feature)) {
            usageMap.set(row.feature, { daily: [], total: 0 });
          }
          const feature = usageMap.get(row.feature)!;
          feature.daily.push(row.usage_count);
          feature.total += row.usage_count;
        });

        const usage = Array.from(usageMap.entries()).map(([feature, data]) => ({
          feature,
          daily: data.daily.slice(-30),
          total: data.total,
        }));

        return new Response(JSON.stringify(usage), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'geo': {
        let query = supabase.from('analytics_users').select('*');
        
        if (tier !== 'all') {
          query = query.eq('subscription_tier', tier);
        }

        const { data: users, error } = await query;
        if (error) throw error;

        const geoMap = new Map<string, { users: number; revenue: number }>();
        
        users?.forEach(user => {
          const existing = geoMap.get(user.country) || { users: 0, revenue: 0 };
          existing.users++;
          if (!user.churned) {
            existing.revenue += user.monthly_revenue;
          }
          geoMap.set(user.country, existing);
        });

        const countryNames: Record<string, string> = {
          US: 'United States', GB: 'United Kingdom', DE: 'Germany',
          FR: 'France', CA: 'Canada', AU: 'Australia',
          JP: 'Japan', BR: 'Brazil', IN: 'India', NL: 'Netherlands',
        };

        const geoData = Array.from(geoMap.entries())
          .map(([code, data]) => ({
            country: countryNames[code] || code,
            code,
            users: data.users,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.users - a.users);

        return new Response(JSON.stringify(geoData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'campaigns': {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('start_date', { ascending: false });
        if (error) throw error;

        return new Response(JSON.stringify(data?.map(c => ({
          id: c.id,
          name: c.name,
          channel: c.channel,
          impressions: c.impressions,
          clicks: c.clicks,
          conversions: c.conversions,
          cost: c.cost,
          revenue: c.revenue,
          roi: c.cost > 0 ? Math.round(((c.revenue - c.cost) / c.cost) * 100) : 0,
        })) || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Analytics error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
