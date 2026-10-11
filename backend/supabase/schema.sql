-- Draft schema mirroring src/lib/types.ts. Not applied anywhere yet.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  age int,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  preferred_unit text not null default 'kg' check (preferred_unit in ('kg', 'lbs'))
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  name text not null default '',
  started_at timestamptz not null default now()
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts on delete cascade,
  position int not null,
  name text not null,
  target_part text not null check (
    target_part in ('Back', 'Biceps', 'Chest', 'Triceps', 'Legs', 'Shoulder', 'Core')
  )
);

create table sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises on delete cascade,
  position int not null,
  weight numeric not null check (weight >= 0),
  unit text not null check (unit in ('kg', 'lbs')),
  reps int not null check (reps > 0)
);

alter table profiles enable row level security;
alter table workouts enable row level security;
alter table exercises enable row level security;
alter table sets enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own workouts" on workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own exercises" on exercises for all
  using (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "own sets" on sets for all
  using (exists (
    select 1 from exercises e join workouts w on w.id = e.workout_id
    where e.id = exercise_id and w.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from exercises e join workouts w on w.id = e.workout_id
    where e.id = exercise_id and w.user_id = auth.uid()
  ));
