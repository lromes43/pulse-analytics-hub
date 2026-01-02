-- Create enum types
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE acquisition_channel AS ENUM ('organic', 'paid_search', 'social', 'referral', 'direct', 'email');

-- Users table (analytics users, not auth users)
CREATE TABLE public.analytics_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  signup_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  churned BOOLEAN NOT NULL DEFAULT false,
  churn_date TIMESTAMPTZ,
  country TEXT NOT NULL DEFAULT 'US',
  acquisition_channel acquisition_channel NOT NULL DEFAULT 'organic',
  monthly_revenue INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Revenue table for monthly metrics
CREATE TABLE public.revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  mrr INTEGER NOT NULL DEFAULT 0,
  new_revenue INTEGER NOT NULL DEFAULT 0,
  churned_revenue INTEGER NOT NULL DEFAULT 0,
  expansion_revenue INTEGER NOT NULL DEFAULT 0,
  one_time_payments INTEGER NOT NULL DEFAULT 0,
  refunds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usage metrics table
CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature TEXT NOT NULL,
  date DATE NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feature, date)
);

-- Marketing campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel acquisition_channel NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL DEFAULT 0,
  revenue INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.analytics_users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS on all tables (public read for analytics)
ALTER TABLE public.analytics_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (analytics dashboard is public)
CREATE POLICY "Public read access" ON public.analytics_users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.revenue FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.usage_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.support_tickets FOR SELECT USING (true);

-- Create indexes for common queries
CREATE INDEX idx_analytics_users_signup ON public.analytics_users(signup_date);
CREATE INDEX idx_analytics_users_tier ON public.analytics_users(subscription_tier);
CREATE INDEX idx_analytics_users_country ON public.analytics_users(country);
CREATE INDEX idx_analytics_users_churned ON public.analytics_users(churned);
CREATE INDEX idx_revenue_date ON public.revenue(date);
CREATE INDEX idx_usage_metrics_feature ON public.usage_metrics(feature);
CREATE INDEX idx_usage_metrics_date ON public.usage_metrics(date);
CREATE INDEX idx_campaigns_channel ON public.campaigns(channel);