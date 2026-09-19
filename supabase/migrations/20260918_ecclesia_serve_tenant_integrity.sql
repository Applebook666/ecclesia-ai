-- ECCLESIA AI
-- Applied migration: ecclesia_serve_tenant_integrity
-- Preflight confirmed zero existing cross-church mismatches.
alter table public.people add constraint people_church_id_id_key unique (church_id,id);
alter table public.ministries add constraint ministries_church_id_id_key unique (church_id,id);
alter table public.volunteers add constraint volunteers_church_id_id_key unique (church_id,id);
alter table public.services add constraint services_church_id_id_key unique (church_id,id);
alter table public.service_positions add constraint service_positions_church_id_id_key unique (church_id,id);

alter table public.volunteers drop constraint volunteers_person_id_fkey,
 add constraint volunteers_church_person_fkey foreign key (church_id,person_id) references public.people(church_id,id) on delete cascade;

alter table public.ministry_volunteers drop constraint ministry_volunteers_ministry_id_fkey,
 add constraint ministry_volunteers_church_ministry_fkey foreign key (church_id,ministry_id) references public.ministries(church_id,id) on delete cascade,
 drop constraint ministry_volunteers_volunteer_id_fkey,
 add constraint ministry_volunteers_church_volunteer_fkey foreign key (church_id,volunteer_id) references public.volunteers(church_id,id) on delete cascade;

alter table public.service_positions drop constraint service_positions_service_id_fkey,
 add constraint service_positions_church_service_fkey foreign key (church_id,service_id) references public.services(church_id,id) on delete cascade,
 drop constraint service_positions_ministry_id_fkey,
 add constraint service_positions_church_ministry_fkey foreign key (church_id,ministry_id) references public.ministries(church_id,id) on delete cascade;

alter table public.service_assignments drop constraint service_assignments_ministry_id_fkey,
 add constraint service_assignments_church_ministry_fkey foreign key (church_id,ministry_id) references public.ministries(church_id,id) on delete cascade,
 drop constraint service_assignments_volunteer_id_fkey,
 add constraint service_assignments_church_volunteer_fkey foreign key (church_id,volunteer_id) references public.volunteers(church_id,id) on delete cascade,
 drop constraint service_assignments_service_id_fkey,
 add constraint service_assignments_church_service_fkey foreign key (church_id,service_id) references public.services(church_id,id) on delete cascade,
 drop constraint service_assignments_service_position_id_fkey,
 add constraint service_assignments_church_position_fkey foreign key (church_id,service_position_id) references public.service_positions(church_id,id) on delete set null (service_position_id);
