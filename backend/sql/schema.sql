create extension if not exists "pgcrypto";

create table if not exists roles (
  id serial primary key,
  code varchar(50) unique not null,
  name varchar(100) not null
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role_id integer not null references roles(id),
  full_name varchar(150) not null,
  email varchar(150) unique not null,
  password_hash text not null,
  status varchar(30) not null default 'active',
  college varchar(150),
  skills text[] not null default '{}',
  social_links jsonb not null default '{}'::jsonb,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null,
  slug varchar(170) unique not null,
  description text not null,
  status varchar(30) not null default 'active',
  start_date date,
  end_date date,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists program_memberships (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status varchar(30) not null default 'pending',
  application_note text,
  referral_code varchar(40) unique default substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10),
  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (program_id, user_id)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  title varchar(150) not null,
  description text not null,
  task_type varchar(60) not null,
  proof_type varchar(60) not null default 'mixed',
  status varchar(30) not null default 'active',
  points integer not null default 0,
  due_date timestamptz,
  created_by uuid not null references users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  ambassador_id uuid not null references users(id) on delete cascade,
  assigned_by uuid not null references users(id),
  status varchar(30) not null default 'assigned',
  assigned_at timestamptz not null default now(),
  unique (task_id, ambassador_id)
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  task_assignment_id uuid not null references task_assignments(id) on delete cascade,
  ambassador_id uuid not null references users(id),
  submission_text text,
  proof_links text[] not null default '{}',
  proof_files text[] not null default '{}',
  status varchar(30) not null default 'pending',
  feedback text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references users(id)
);

create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  submission_id uuid unique references submissions(id) on delete set null,
  points_delta integer not null,
  reason varchar(255) not null,
  created_at timestamptz not null default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  code varchar(60) unique not null,
  name varchar(100) not null,
  description text not null,
  icon varchar(20) not null default 'award',
  points_threshold integer default 0,
  streak_threshold integer default 0,
  submissions_threshold integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references badges(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (badge_id, user_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title varchar(150) not null,
  message text not null,
  type varchar(60) not null,
  is_read boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists user_program_stats (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  current_points integer not null default 0,
  completed_tasks integer not null default 0,
  approved_submissions integer not null default 0,
  streak_count integer not null default 0,
  last_activity_on date,
  unique (program_id, user_id)
);

create index if not exists idx_program_memberships_program on program_memberships(program_id);
create index if not exists idx_task_assignments_ambassador on task_assignments(ambassador_id);
create index if not exists idx_points_ledger_user_program on points_ledger(user_id, program_id);
create index if not exists idx_notifications_user on notifications(user_id, created_at desc);

create or replace view leaderboard_overall_v as
select
  ups.program_id,
  ups.user_id,
  u.full_name,
  u.college,
  ups.current_points as points,
  ups.streak_count,
  rank() over (
    partition by ups.program_id
    order by ups.current_points desc, ups.streak_count desc, u.full_name asc
  ) as rank
from user_program_stats ups
join users u on u.id = ups.user_id;

create or replace view leaderboard_weekly_v as
select
  pl.program_id,
  pl.user_id,
  u.full_name,
  u.college,
  sum(pl.points_delta) as points,
  rank() over (
    partition by pl.program_id
    order by sum(pl.points_delta) desc, u.full_name asc
  ) as rank
from points_ledger pl
join users u on u.id = pl.user_id
where pl.created_at >= date_trunc('week', now())
group by pl.program_id, pl.user_id, u.full_name, u.college;
