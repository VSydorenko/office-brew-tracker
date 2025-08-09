
-- 1) KPI: покупки, сума, середній чек, борги (всього/мої), активні користувачі
create or replace function public.get_dashboard_kpis(start_date date, end_date date)
returns table (
  purchases_count bigint,
  total_spent numeric,
  average_check numeric,
  unpaid_total numeric,
  my_unpaid_total numeric,
  active_users bigint
)
language sql
stable
set search_path to 'public'
as $$
  with purchases_in_range as (
    select *
    from public.purchases p
    where (start_date is null or p.date >= start_date)
      and (end_date is null or p.date <= end_date)
  ),
  distributions_in_range as (
    select pd.*
    from public.purchase_distributions pd
    join purchases_in_range p on p.id = pd.purchase_id
  ),
  agg as (
    select
      (select count(*) from purchases_in_range) as purchases_count,
      (select coalesce(sum(p.total_amount), 0) from purchases_in_range p) as total_spent,
      (select coalesce(sum(case when pd.is_paid then coalesce(pd.adjusted_amount, pd.calculated_amount) end), 0)
         from distributions_in_range pd) as paid_total,
      (select coalesce(sum(case when not pd.is_paid then coalesce(pd.adjusted_amount, pd.calculated_amount) end), 0)
         from distributions_in_range pd) as unpaid_total,
      (select coalesce(sum(case when not pd.is_paid and pd.user_id = auth.uid()
         then coalesce(pd.adjusted_amount, pd.calculated_amount) end), 0)
         from distributions_in_range pd) as my_unpaid_total
  )
  select
    purchases_count,
    total_spent,
    case when purchases_count > 0 then total_spent / nullif(purchases_count, 0) else 0 end as average_check,
    unpaid_total,
    my_unpaid_total,
    (
      select count(distinct uid) from (
        select buyer_id as uid from purchases_in_range
        union
        select user_id as uid from distributions_in_range
      ) s
    ) as active_users
  from agg;
$$;

-- 2) Динаміка витрат по місяцях
create or replace function public.get_spending_timeseries(start_date date, end_date date)
returns table (
  month_start date,
  purchases_count bigint,
  total_spent numeric
)
language sql
stable
set search_path to 'public'
as $$
  select
    date_trunc('month', p.date)::date as month_start,
    count(*) as purchases_count,
    coalesce(sum(p.total_amount), 0) as total_spent
  from public.purchases p
  where (start_date is null or p.date >= start_date)
    and (end_date is null or p.date <= end_date)
  group by 1
  order by 1;
$$;

-- 3) ТОП-5 кав за кількістю
create or replace function public.get_top_coffees_by_qty(start_date date, end_date date, limit_n int default 5)
returns table (
  coffee_type_id uuid,
  coffee_name text,
  total_qty bigint
)
language sql
stable
set search_path to 'public'
as $$
  select
    pi.coffee_type_id,
    ct.name as coffee_name,
    sum(pi.quantity)::bigint as total_qty
  from public.purchase_items pi
  join public.purchases p on p.id = pi.purchase_id
  join public.coffee_types ct on ct.id = pi.coffee_type_id
  where (start_date is null or p.date >= start_date)
    and (end_date is null or p.date <= end_date)
  group by pi.coffee_type_id, ct.name
  order by total_qty desc
  limit limit_n;
$$;

-- 4) ТОП водіїв + помісячна розкладка по ТОП-5
create or replace function public.get_top_drivers_with_monthly(start_date date, end_date date, limit_n int default 5)
returns table (
  driver_id uuid,
  driver_name text,
  month_start date,
  trips bigint,
  total_trips bigint
)
language sql
stable
set search_path to 'public'
as $$
  with drivers as (
    select
      p.driver_id,
      pr.name as driver_name,
      count(*) as total_trips
    from public.purchases p
    join public.profiles pr on pr.id = p.driver_id
    where p.driver_id is not null
      and (start_date is null or p.date >= start_date)
      and (end_date is null or p.date <= end_date)
    group by p.driver_id, pr.name
    order by total_trips desc
    limit limit_n
  ),
  monthly as (
    select
      p.driver_id,
      date_trunc('month', p.date)::date as month_start,
      count(*) as trips
    from public.purchases p
    join drivers d on d.driver_id = p.driver_id
    where (start_date is null or p.date >= start_date)
      and (end_date is null or p.date <= end_date)
    group by p.driver_id, month_start
  )
  select
    d.driver_id,
    d.driver_name,
    m.month_start,
    coalesce(m.trips, 0) as trips,
    d.total_trips
  from drivers d
  left join monthly m on m.driver_id = d.driver_id
  order by d.total_trips desc, m.month_start asc;
$$;

-- 5) Останні покупки + оплатні метрики
create or replace function public.get_recent_purchases_enriched(limit_n int default 5)
returns table (
  id uuid,
  date date,
  total_amount numeric,
  distribution_status text,
  buyer_name text,
  participants_count int,
  paid_count int,
  unpaid_count int,
  amount_paid numeric,
  amount_unpaid numeric
)
language sql
stable
set search_path to 'public'
as $$
  select
    p.id,
    p.date,
    p.total_amount,
    p.distribution_status,
    pr.name as buyer_name,
    coalesce(d_stats.participants_count, 0)::int as participants_count,
    coalesce(d_stats.paid_count, 0)::int as paid_count,
    coalesce(d_stats.unpaid_count, 0)::int as unpaid_count,
    coalesce(d_stats.amount_paid, 0) as amount_paid,
    coalesce(d_stats.amount_unpaid, 0) as amount_unpaid
  from public.purchases p
  left join public.profiles pr on pr.id = p.buyer_id
  left join lateral (
    select
      count(*) as participants_count,
      count(*) filter (where pd.is_paid) as paid_count,
      count(*) filter (where not pd.is_paid) as unpaid_count,
      coalesce(sum(coalesce(pd.adjusted_amount, pd.calculated_amount)) filter (where pd.is_paid), 0) as amount_paid,
      coalesce(sum(coalesce(pd.adjusted_amount, pd.calculated_amount)) filter (where not pd.is_paid), 0) as amount_unpaid
    from public.purchase_distributions pd
    where pd.purchase_id = p.id
  ) d_stats on true
  order by p.date desc
  limit limit_n;
$$;

-- 6) Розподіл статусів покупок
create or replace function public.get_status_breakdown(start_date date, end_date date)
returns table (
  status text,
  cnt bigint
)
language sql
stable
set search_path to 'public'
as $$
  select
    coalesce(p.distribution_status, 'draft') as status,
    count(*) as cnt
  from public.purchases p
  where (start_date is null or p.date >= start_date)
    and (end_date is null or p.date <= end_date)
  group by 1
  order by cnt desc;
$$;
