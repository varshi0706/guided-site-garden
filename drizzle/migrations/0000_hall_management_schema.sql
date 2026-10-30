
create type public.app_role as enum ('admin','student');
create type public.req_status as enum ('pending','approved','rejected');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  roll_no text,
  category text not null default 'BTech',
  phone text,
  created_at timestamptz not null default now()
);
create unique index profiles_roll_no_key on public.profiles (upper(roll_no)) where roll_no is not null and roll_no <> '';
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles visible" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "read own or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "insert own" on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- signup trigger: profile + role (first user becomes admin)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, roll_no, category)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'roll_no',''),
    coalesce(nullif(new.raw_user_meta_data->>'category',''),'BTech'));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'student');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- halls
create table public.halls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'residence' check (kind in ('residence','event')),
  description text not null default '',
  capacity int not null default 0,
  location text not null default '',
  guest_rooms int not null default 0,
  mess_fee numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.halls to authenticated;
grant select on public.halls to anon;
grant all on public.halls to service_role;
alter table public.halls enable row level security;
create policy "halls public read" on public.halls for select to anon, authenticated using (true);
create policy "admins manage halls" on public.halls for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.halls(id) on delete cascade,
  room_no text not null,
  room_type text not null default 'sharing' check (room_type in ('single','sharing')),
  capacity int not null default 2 check (capacity > 0),
  unique (hall_id, room_no)
);
grant select, insert, update, delete on public.rooms to authenticated;
grant all on public.rooms to service_role;
alter table public.rooms enable row level security;
create policy "rooms read" on public.rooms for select to authenticated using (true);
create policy "admins manage rooms" on public.rooms for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- allocations
create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  active boolean not null default true,
  allocated_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index one_active_allocation on public.allocations(student_id) where active;
grant select, insert, update, delete on public.allocations to authenticated;
grant all on public.allocations to service_role;
alter table public.allocations enable row level security;
create policy "alloc read own or admin" on public.allocations for select to authenticated
  using (student_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage alloc" on public.allocations for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.check_room_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare cap int; used int;
begin
  if new.active then
    select capacity into cap from rooms where id = new.room_id;
    select count(*) into used from allocations where room_id = new.room_id and active and id <> new.id;
    if used >= cap then raise exception 'This room is already full'; end if;
  end if;
  return new;
end; $$;
create trigger alloc_capacity before insert or update on public.allocations
  for each row execute function public.check_room_capacity();

-- vacancy view helper (any signed-in user)
create or replace function public.hall_vacancy()
returns table (hall_id uuid, total_beds bigint, occupied bigint)
language sql stable security definer set search_path = public as $$
  select h.id,
    coalesce((select sum(r.capacity) from rooms r where r.hall_id = h.id),0)::bigint,
    (select count(*) from allocations a join rooms r on r.id = a.room_id where r.hall_id = h.id and a.active)::bigint
  from halls h where h.kind = 'residence'
$$;

-- hall change / swap requests
create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('change','swap')),
  desired_hall_id uuid references public.halls(id) on delete set null,
  swap_with_roll_no text,
  reason text not null default '',
  status req_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.change_requests to authenticated;
grant all on public.change_requests to service_role;
alter table public.change_requests enable row level security;
create policy "cr read" on public.change_requests for select to authenticated
  using (student_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "cr insert own" on public.change_requests for insert to authenticated
  with check (student_id = auth.uid() and status = 'pending');
create policy "cr admin update" on public.change_requests for update to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy "cr delete own pending" on public.change_requests for delete to authenticated
  using (student_id = auth.uid() and status = 'pending');

-- approve a hall change: move student to a new room
create or replace function public.approve_hall_change(_request_id uuid, _room_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare req change_requests;
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Only admins can do this'; end if;
  select * into req from change_requests where id = _request_id;
  if req.id is null or req.kind <> 'change' or req.status <> 'pending' then raise exception 'Request not available'; end if;
  update allocations set active = false, ended_at = now() where student_id = req.student_id and active;
  insert into allocations (student_id, room_id) values (req.student_id, _room_id);
  update change_requests set status = 'approved' where id = _request_id;
end; $$;

-- approve a mutual swap: exchange the two students' rooms
create or replace function public.approve_swap(_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare req change_requests; other uuid; a_room uuid; b_room uuid;
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Only admins can do this'; end if;
  select * into req from change_requests where id = _request_id;
  if req.id is null or req.kind <> 'swap' or req.status <> 'pending' then raise exception 'Request not available'; end if;
  select id into other from profiles where upper(roll_no) = upper(req.swap_with_roll_no);
  if other is null then raise exception 'No student found with that roll number'; end if;
  select room_id into a_room from allocations where student_id = req.student_id and active;
  select room_id into b_room from allocations where student_id = other and active;
  if a_room is null or b_room is null then raise exception 'Both students must have a room before swapping'; end if;
  update allocations set active = false, ended_at = now() where student_id in (req.student_id, other) and active;
  insert into allocations (student_id, room_id) values (req.student_id, b_room), (other, a_room);
  update change_requests set status = 'approved' where id = _request_id;
end; $$;

-- complaints
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  hall_id uuid references public.halls(id) on delete set null,
  category text not null check (category in ('maintenance','mess')),
  title text not null,
  description text not null default '',
  status text not null default 'submitted' check (status in ('submitted','forwarded','resolved','rejected')),
  admin_note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.complaints to authenticated;
grant all on public.complaints to service_role;
alter table public.complaints enable row level security;
create policy "c read" on public.complaints for select to authenticated
  using (student_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "c insert own" on public.complaints for insert to authenticated
  with check (student_id = auth.uid() and status = 'submitted');
create policy "c admin update" on public.complaints for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- guest room bookings
create table public.guest_bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  hall_id uuid not null references public.halls(id) on delete cascade,
  guest_name text not null,
  start_date date not null,
  end_date date not null,
  status req_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.guest_bookings to authenticated;
grant all on public.guest_bookings to service_role;
alter table public.guest_bookings enable row level security;
create policy "g read" on public.guest_bookings for select to authenticated
  using (student_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "g insert own" on public.guest_bookings for insert to authenticated
  with check (student_id = auth.uid() and status = 'pending');
create policy "g admin update" on public.guest_bookings for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

create or replace function public.check_guest_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare rooms_avail int; taken int;
begin
  if new.end_date < new.start_date then raise exception 'Check-out date must be on or after check-in date'; end if;
  if new.status = 'approved' then
    select guest_rooms into rooms_avail from halls where id = new.hall_id;
    select count(*) into taken from guest_bookings
      where hall_id = new.hall_id and status = 'approved' and id <> new.id
        and start_date <= new.end_date and end_date >= new.start_date;
    if taken >= coalesce(rooms_avail,0) then raise exception 'No guest room free in this hall for those dates'; end if;
  end if;
  return new;
end; $$;
create trigger guest_check before insert or update on public.guest_bookings
  for each row execute function public.check_guest_booking();

-- event hall bookings
create table public.hall_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  hall_id uuid not null references public.halls(id) on delete cascade,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  purpose text not null,
  attendance int not null default 1 check (attendance > 0),
  status req_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.hall_bookings to authenticated;
grant all on public.hall_bookings to service_role;
alter table public.hall_bookings enable row level security;
create policy "hb read" on public.hall_bookings for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "hb insert own" on public.hall_bookings for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy "hb admin update" on public.hall_bookings for update to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy "hb delete own pending" on public.hall_bookings for delete to authenticated
  using (user_id = auth.uid() and status = 'pending');

create or replace function public.check_hall_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare h halls;
begin
  if new.start_time >= new.end_time then raise exception 'Start time must be earlier than end time'; end if;
  select * into h from halls where id = new.hall_id;
  if h.id is null or not h.is_active or h.kind <> 'event' then raise exception 'This hall cannot be booked'; end if;
  if new.attendance > h.capacity then raise exception 'Expected attendance is more than the hall capacity (%)', h.capacity; end if;
  if new.status in ('pending','approved') and exists (
    select 1 from hall_bookings b where b.hall_id = new.hall_id and b.id <> new.id
      and b.status = 'approved' and b.booking_date = new.booking_date
      and b.start_time < new.end_time and b.end_time > new.start_time) then
    raise exception 'This hall is already booked for an overlapping time';
  end if;
  return new;
end; $$;
create trigger hall_booking_check before insert or update on public.hall_bookings
  for each row execute function public.check_hall_booking();

-- approved slots visible to everyone signed in (no personal details)
create or replace function public.booked_slots(_hall_id uuid, _date date)
returns table (start_time time, end_time time)
language sql stable security definer set search_path = public as $$
  select start_time, end_time from hall_bookings
  where hall_id = _hall_id and booking_date = _date and status = 'approved' order by start_time
$$;

-- dues
create table public.dues (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount numeric not null check (amount >= 0),
  due_date date not null,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.dues to authenticated;
grant all on public.dues to service_role;
alter table public.dues enable row level security;
create policy "d read" on public.dues for select to authenticated
  using (student_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "d admin manage" on public.dues for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- staff (HMC employees, catering/cleaning)
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid references public.halls(id) on delete set null,
  name text not null,
  role text not null,
  phone text,
  is_recruiting boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.staff to authenticated;
grant all on public.staff to service_role;
alter table public.staff enable row level security;
create policy "staff read" on public.staff for select to authenticated using (true);
create policy "staff admin manage" on public.staff for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- seed data
insert into public.halls (name, kind, description, capacity, location, guest_rooms, mess_fee) values
  ('Azad Hall', 'residence', 'Boys hall of residence with mess, gym and reading room.', 0, 'North Campus', 2, 4500),
  ('Sarojini Hall', 'residence', 'Girls hall of residence with mess and common room.', 0, 'South Campus', 2, 4500),
  ('Vikram Hall', 'residence', 'Hall for MTech, MS and PhD scholars.', 0, 'East Campus', 1, 5000),
  ('Main Auditorium', 'event', 'Large auditorium with stage, projector and sound system.', 800, 'Academic Block 1', 0, 0),
  ('Seminar Hall A', 'event', 'Seminar hall for talks and workshops.', 150, 'Academic Block 2', 0, 0),
  ('Conference Room', 'event', 'Meeting room for small groups.', 30, 'Admin Block', 0, 0);

insert into public.rooms (hall_id, room_no, room_type, capacity)
select h.id, (f*100 + n)::text, case when n <= 2 then 'single' else 'sharing' end, case when n <= 2 then 1 else 2 end
from public.halls h, generate_series(1,2) f, generate_series(1,5) n
where h.kind = 'residence';

insert into public.staff (hall_id, name, role, phone, is_recruiting)
select h.id, s.name, s.role, s.phone, s.rec from public.halls h
join (values
  ('Azad Hall','Mr. R. Prasad','Hall Manager','9000000001',false),
  ('Azad Hall','Mess team','Catering staff',null,true),
  ('Sarojini Hall','Ms. K. Lakshmi','Hall Manager','9000000002',false),
  ('Sarojini Hall','Cleaning team','Cleaning staff',null,true),
  ('Vikram Hall','Mr. S. Rao','Hall Supervisor','9000000003',false)
) as s(hall, name, role, phone, rec) on s.hall = h.name;
