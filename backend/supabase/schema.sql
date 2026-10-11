-- Repwise schema. Run once in the Supabase SQL editor.
--
-- Auth is handled by Clerk (added to Supabase as a third-party auth provider),
-- so users are identified by the Clerk user id in the JWT `sub` claim, not by
-- a row in auth.users.

create table profiles (
  user_id text primary key default (auth.jwt() ->> 'sub'),
  name text not null default '',
  age int,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  preferred_unit text not null default 'kg' check (preferred_unit in ('kg', 'lbs'))
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  date date not null,
  name text not null default '',
  started_at timestamptz not null default now()
);
create index workouts_user_date on workouts (user_id, date);

-- Exercises and sets are saved while still being typed in, so everything the
-- user has not confirmed yet is nullable; `logged` / `done` mark confirmed rows.
create table exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts on delete cascade,
  position int not null,
  name text not null default '',
  target_part text check (
    target_part in ('Back', 'Biceps', 'Chest', 'Triceps', 'Legs', 'Shoulder', 'Core')
  ),
  logged boolean not null default false
);
create index exercises_workout on exercises (workout_id);

create table sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises on delete cascade,
  position int not null,
  weight numeric,
  unit text not null check (unit in ('kg', 'lbs')),
  reps numeric,
  done boolean not null default false
);
create index sets_exercise on sets (exercise_id);

-- ---- access: each user sees and changes only their own rows ----

alter table profiles enable row level security;
alter table workouts enable row level security;
alter table exercises enable row level security;
alter table sets enable row level security;

grant select, insert, update, delete on profiles, workouts, exercises, sets to authenticated;

create policy "own profile" on profiles for all to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "own workouts" on workouts for all to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "own exercises" on exercises for all to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = workout_id and w.user_id = (select auth.jwt() ->> 'sub')
  ))
  with check (exists (
    select 1 from workouts w
    where w.id = workout_id and w.user_id = (select auth.jwt() ->> 'sub')
  ));

create policy "own sets" on sets for all to authenticated
  using (exists (
    select 1 from exercises e join workouts w on w.id = e.workout_id
    where e.id = exercise_id and w.user_id = (select auth.jwt() ->> 'sub')
  ))
  with check (exists (
    select 1 from exercises e join workouts w on w.id = e.workout_id
    where e.id = exercise_id and w.user_id = (select auth.jwt() ->> 'sub')
  ));

-- ---- save_workout: write one workout with all its exercises and sets ----
--
-- Takes the workout exactly as the app holds it (see Workout in
-- src/lib/types.ts) and replaces what is stored, in a single transaction.
-- Runs with the caller's rights, so the policies above still apply.

create function save_workout(p_workout jsonb) returns void
language plpgsql security invoker set search_path = public
as $$
declare
  v_id uuid := (p_workout ->> 'id')::uuid;
begin
  insert into workouts (id, date, name, started_at)
  values (
    v_id,
    (p_workout ->> 'date')::date,
    coalesce(p_workout ->> 'name', ''),
    (p_workout ->> 'startedAt')::timestamptz
  )
  on conflict (id) do update set date = excluded.date, name = excluded.name;

  delete from exercises where workout_id = v_id;

  insert into exercises (id, workout_id, position, name, target_part, logged)
  select
    (e.value ->> 'id')::uuid,
    v_id,
    e.ordinality,
    coalesce(e.value ->> 'name', ''),
    nullif(e.value ->> 'targetPart', ''),
    coalesce((e.value ->> 'logged')::boolean, false)
  from jsonb_array_elements(p_workout -> 'exercises') with ordinality as e;

  insert into sets (id, exercise_id, position, weight, unit, reps, done)
  select
    (s.value ->> 'id')::uuid,
    (e.value ->> 'id')::uuid,
    s.ordinality,
    (s.value ->> 'weight')::numeric,
    s.value ->> 'unit',
    (s.value ->> 'reps')::numeric,
    coalesce((s.value ->> 'done')::boolean, false)
  from jsonb_array_elements(p_workout -> 'exercises') as e,
    jsonb_array_elements(e.value -> 'sets') with ordinality as s;
end;
$$;

revoke execute on function save_workout(jsonb) from public, anon;
grant execute on function save_workout(jsonb) to authenticated;
