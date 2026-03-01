-- Supabase Database Schema for GEO System
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
alter table auth.users enable row level security;

-- Tenants table (for multi-tenant SaaS)
create table if not exists tenants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text unique not null,
    plan text default 'free' check (plan in ('free', 'starter', 'professional', 'enterprise')),
    status text default 'active' check (status in ('active', 'suspended', 'cancelled')),
    limits jsonb default '{"projects": 1, "api_calls": 100}'::jsonb,
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Projects table (law firms)
create table if not exists projects (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id) on delete cascade,
    name text not null,
    address text not null,
    city text not null default 'Houston',
    state text not null default 'TX',
    zip text,
    phone text,
    email text,
    website text,
    coordinates jsonb, -- { lat, lng, elevation }
    gmb_url text,
    specialties text[], -- ['green card', 'citizenship', 'deportation defense']
    settings jsonb default '{}'::jsonb,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Rankings table (tracked daily)
create table if not exists rankings (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references projects(id) on delete cascade,
    keyword text not null,
    position integer,
    previous_position integer,
    serp_features jsonb, -- ['local_pack', 'knowledge_panel', 'ads']
    search_volume integer,
    captured_at timestamp with time zone default now()
);

-- GEO Audits table
create table if not exists geo_audits (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references projects(id) on delete cascade,
    score integer not null,
    breakdown jsonb not null, -- { coordinatePrecision, parking, schema, poi }
    recommendations jsonb,
    competitor_data jsonb,
    raw_data jsonb, -- Full Apify response
    created_at timestamp with time zone default now()
);

-- Competitors table
create table if not exists competitors (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references projects(id) on delete cascade,
    name text not null,
    address text,
    coordinates jsonb,
    gmb_url text,
    website text,
    current_rank integer,
    geo_score integer,
    last_scraped timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- Alerts table
create table if not exists alerts (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references projects(id) on delete cascade,
    type text not null check (type in ('ranking_drop', 'competitor_change', 'gmb_update', 'algorithm_alert')),
    severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
    message text not null,
    is_read boolean default false,
    created_at timestamp with time zone default now()
);

-- Audit logs (for lead capture)
create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    firm_name text not null,
    address text not null,
    score integer,
    breakdown jsonb,
    is_converted boolean default false,
    converted_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_projects_tenant on projects(tenant_id);
create index if not exists idx_rankings_project on rankings(project_id);
create index if not exists idx_rankings_keyword on rankings(keyword);
create index if not exists idx_rankings_date on rankings(captured_at);
create index if not exists idx_geo_audits_project on geo_audits(project_id);
create index if not exists idx_alerts_project on alerts(project_id);
create index if not exists idx_audit_logs_email on audit_logs(email);

-- Row Level Security Policies
alter table projects enable row level security;
alter table rankings enable row level security;
alter table geo_audits enable row level security;
alter table competitors enable row level security;
alter table alerts enable row level security;

-- Projects: Users can only see their tenant's projects
create policy tenant_projects_isolation on projects
    for all
    using (tenant_id = auth.uid());

-- Rankings: Cascade through project
create policy tenant_rankings_isolation on rankings
    for all
    using (project_id in (
        select id from projects where tenant_id = auth.uid()
    ));

-- Functions

-- Update timestamp trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply update trigger
create trigger update_tenants_updated_at before update on tenants
    for each row execute function update_updated_at_column();

create trigger update_projects_updated_at before update on projects
    for each row execute function update_updated_at_column();

-- Calculate average ranking for project
create or replace function get_project_avg_ranking(project_uuid uuid)
returns float as $$
declare
    avg_rank float;
begin
    select avg(position)::float into avg_rank
    from rankings
    where project_id = project_uuid
    and captured_at >= now() - interval '7 days';
    
    return avg_rank;
end;
$$ language plpgsql;

-- Get ranking change (current vs 30 days ago)
create or replace function get_ranking_change(project_uuid uuid, keyword_text text)
returns table (
    current_rank integer,
    previous_rank integer,
    change integer
) as $$
begin
    return query
    with current_ranking as (
        select position
        from rankings
        where project_id = project_uuid
        and keyword = keyword_text
        order by captured_at desc
        limit 1
    ),
    previous_ranking as (
        select position
        from rankings
        where project_id = project_uuid
        and keyword = keyword_text
        and captured_at <= now() - interval '30 days'
        order by captured_at desc
        limit 1
    )
    select 
        c.position as current_rank,
        p.position as previous_rank,
        (p.position - c.position) as change
    from current_ranking c
    cross join previous_ranking p;
end;
$$ language plpgsql;
