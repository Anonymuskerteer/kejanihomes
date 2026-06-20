
create type public.app_role as enum ('admin', 'landlord', 'tenant');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.profiles to anon;
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "user_roles_select_own" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.get_user_role(_user_id uuid)
returns app_role language sql stable security definer set search_path = public
as $$ select role from public.user_roles where user_id = _user_id
  order by case role when 'admin' then 1 when 'landlord' then 2 else 3 end limit 1 $$;

create policy "user_roles_select_admin" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_role app_role;
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  if new.email = 'admin@kejanihomes.com' then
    v_role := 'admin';
  elsif coalesce(new.raw_user_meta_data->>'role','') = 'landlord' then
    v_role := 'landlord';
  else
    v_role := 'tenant';
  end if;
  insert into public.user_roles (user_id, role) values (new.id, v_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  property_type text not null,
  listing_type text not null default 'rent',
  price_kes integer not null,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  area_sqm integer,
  county text not null,
  town text not null,
  address text,
  latitude double precision,
  longitude double precision,
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  contact_phone text,
  contact_email text,
  status text not null default 'pending',
  rejection_reason text,
  is_featured boolean not null default false,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.properties to authenticated;
grant select on public.properties to anon;
grant all on public.properties to service_role;
alter table public.properties enable row level security;
create policy "properties_select_approved" on public.properties for select using (status = 'approved');
create policy "properties_select_own" on public.properties for select to authenticated using (auth.uid() = owner_id);
create policy "properties_select_admin" on public.properties for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "properties_insert_own" on public.properties for insert to authenticated with check (auth.uid() = owner_id);
create policy "properties_update_own" on public.properties for update to authenticated using (auth.uid() = owner_id);
create policy "properties_update_admin" on public.properties for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "properties_delete_own" on public.properties for delete to authenticated using (auth.uid() = owner_id);
create policy "properties_delete_admin" on public.properties for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create index properties_county_idx on public.properties(county);
create index properties_status_idx on public.properties(status);
create index properties_owner_idx on public.properties(owner_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(property_id, user_id)
);
grant select, insert, update, delete on public.reviews to authenticated;
grant select on public.reviews to anon;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "reviews_update_own" on public.reviews for update to authenticated using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete to authenticated using (auth.uid() = user_id);
create policy "reviews_delete_admin" on public.reviews for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.saved_properties (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
grant select, insert, delete on public.saved_properties to authenticated;
grant all on public.saved_properties to service_role;
alter table public.saved_properties enable row level security;
create policy "saved_select_own" on public.saved_properties for select to authenticated using (auth.uid() = user_id);
create policy "saved_insert_own" on public.saved_properties for insert to authenticated with check (auth.uid() = user_id);
create policy "saved_delete_own" on public.saved_properties for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_properties before update on public.properties for each row execute function public.set_updated_at();
