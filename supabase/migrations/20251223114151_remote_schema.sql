drop extension if exists "pg_net";


  create table "public"."departments" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "organization_id" uuid not null
      );


alter table "public"."departments" enable row level security;


  create table "public"."employee_review_to" (
    "id" uuid not null default gen_random_uuid(),
    "reviewer_id" uuid not null,
    "reviewee_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."employee_review_to" enable row level security;


  create table "public"."employees" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "role" text not null,
    "email" text not null,
    "department_id" uuid not null,
    "organization_id" uuid not null
      );


alter table "public"."employees" enable row level security;


  create table "public"."organization" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "email" text not null,
    "name" character varying not null,
    "address" text,
    "phone" text,
    "user_id" uuid not null default auth.uid()
      );


alter table "public"."organization" enable row level security;


  create table "public"."reports" (
    "id" uuid not null default gen_random_uuid(),
    "employee_id" uuid not null,
    "month" character varying(7) not null,
    "ranking" real not null,
    "improvements" text[] default '{}'::text[],
    "qualities" text[] default '{}'::text[],
    "summary" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "criterias" jsonb
      );


alter table "public"."reports" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "content" text not null,
    "target_employee_id" uuid not null,
    "reviewed_by_id" uuid,
    "organization_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."reviews" enable row level security;

CREATE UNIQUE INDEX departments_pkey ON public.departments USING btree (id);

CREATE UNIQUE INDEX employee_reports_to_pkey ON public.employee_review_to USING btree (id);

CREATE UNIQUE INDEX employees_pkey ON public.employees USING btree (id);

CREATE UNIQUE INDEX organization_email_key ON public.organization USING btree (email);

CREATE UNIQUE INDEX organization_pkey ON public.organization USING btree (id);

CREATE UNIQUE INDEX organization_user_id_key ON public.organization USING btree (user_id);

CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX unique_employee_month ON public.reports USING btree (employee_id, month);

CREATE UNIQUE INDEX unique_reviewer_reviewee ON public.employee_review_to USING btree (reviewer_id, reviewee_id);

alter table "public"."departments" add constraint "departments_pkey" PRIMARY KEY using index "departments_pkey";

alter table "public"."employee_review_to" add constraint "employee_reports_to_pkey" PRIMARY KEY using index "employee_reports_to_pkey";

alter table "public"."employees" add constraint "employees_pkey" PRIMARY KEY using index "employees_pkey";

alter table "public"."organization" add constraint "organization_pkey" PRIMARY KEY using index "organization_pkey";

alter table "public"."reports" add constraint "reports_pkey" PRIMARY KEY using index "reports_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."departments" add constraint "fk_organization" FOREIGN KEY (organization_id) REFERENCES public.organization(id) ON DELETE CASCADE not valid;

alter table "public"."departments" validate constraint "fk_organization";

alter table "public"."employee_review_to" add constraint "employee_reports_to_reviewee_id_fkey" FOREIGN KEY (reviewee_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."employee_review_to" validate constraint "employee_reports_to_reviewee_id_fkey";

alter table "public"."employee_review_to" add constraint "employee_reports_to_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."employee_review_to" validate constraint "employee_reports_to_reviewer_id_fkey";

alter table "public"."employee_review_to" add constraint "unique_reviewer_reviewee" UNIQUE using index "unique_reviewer_reviewee";

alter table "public"."employees" add constraint "employees_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL not valid;

alter table "public"."employees" validate constraint "employees_department_id_fkey";

alter table "public"."employees" add constraint "employees_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organization(id) ON DELETE CASCADE not valid;

alter table "public"."employees" validate constraint "employees_organization_id_fkey";

alter table "public"."organization" add constraint "organization_email_key" UNIQUE using index "organization_email_key";

alter table "public"."organization" add constraint "organization_user_id_key" UNIQUE using index "organization_user_id_key";

alter table "public"."reports" add constraint "reports_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."reports" validate constraint "reports_employee_id_fkey";

alter table "public"."reports" add constraint "reports_month_check" CHECK (((month)::text ~ '^\d{4}-(0[1-9]|1[0-2])$'::text)) not valid;

alter table "public"."reports" validate constraint "reports_month_check";

alter table "public"."reports" add constraint "reports_ranking_check" CHECK (((ranking >= (0)::double precision) AND (ranking <= (10)::double precision))) not valid;

alter table "public"."reports" validate constraint "reports_ranking_check";

alter table "public"."reports" add constraint "unique_employee_month" UNIQUE using index "unique_employee_month";

alter table "public"."reviews" add constraint "reviews_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organization(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_organization_id_fkey";

alter table "public"."reviews" add constraint "reviews_reviewed_by_id_fkey" FOREIGN KEY (reviewed_by_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_reviewed_by_id_fkey";

alter table "public"."reviews" add constraint "reviews_target_employee_id_fkey" FOREIGN KEY (target_employee_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_target_employee_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_current_employee_id()
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT id FROM employees WHERE email = auth.email() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
   BEGIN
     -- Set default role to what was passed during signup
     IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
       NEW.raw_app_meta_data := 
         jsonb_build_object('role', NEW.raw_user_meta_data->>'role');
     END IF;
     RETURN NEW;
   END;
   $function$
;

grant delete on table "public"."departments" to "anon";

grant insert on table "public"."departments" to "anon";

grant references on table "public"."departments" to "anon";

grant select on table "public"."departments" to "anon";

grant trigger on table "public"."departments" to "anon";

grant truncate on table "public"."departments" to "anon";

grant update on table "public"."departments" to "anon";

grant delete on table "public"."departments" to "authenticated";

grant insert on table "public"."departments" to "authenticated";

grant references on table "public"."departments" to "authenticated";

grant select on table "public"."departments" to "authenticated";

grant trigger on table "public"."departments" to "authenticated";

grant truncate on table "public"."departments" to "authenticated";

grant update on table "public"."departments" to "authenticated";

grant delete on table "public"."departments" to "service_role";

grant insert on table "public"."departments" to "service_role";

grant references on table "public"."departments" to "service_role";

grant select on table "public"."departments" to "service_role";

grant trigger on table "public"."departments" to "service_role";

grant truncate on table "public"."departments" to "service_role";

grant update on table "public"."departments" to "service_role";

grant delete on table "public"."employee_review_to" to "anon";

grant insert on table "public"."employee_review_to" to "anon";

grant references on table "public"."employee_review_to" to "anon";

grant select on table "public"."employee_review_to" to "anon";

grant trigger on table "public"."employee_review_to" to "anon";

grant truncate on table "public"."employee_review_to" to "anon";

grant update on table "public"."employee_review_to" to "anon";

grant delete on table "public"."employee_review_to" to "authenticated";

grant insert on table "public"."employee_review_to" to "authenticated";

grant references on table "public"."employee_review_to" to "authenticated";

grant select on table "public"."employee_review_to" to "authenticated";

grant trigger on table "public"."employee_review_to" to "authenticated";

grant truncate on table "public"."employee_review_to" to "authenticated";

grant update on table "public"."employee_review_to" to "authenticated";

grant delete on table "public"."employee_review_to" to "service_role";

grant insert on table "public"."employee_review_to" to "service_role";

grant references on table "public"."employee_review_to" to "service_role";

grant select on table "public"."employee_review_to" to "service_role";

grant trigger on table "public"."employee_review_to" to "service_role";

grant truncate on table "public"."employee_review_to" to "service_role";

grant update on table "public"."employee_review_to" to "service_role";

grant delete on table "public"."employees" to "anon";

grant insert on table "public"."employees" to "anon";

grant references on table "public"."employees" to "anon";

grant select on table "public"."employees" to "anon";

grant trigger on table "public"."employees" to "anon";

grant truncate on table "public"."employees" to "anon";

grant update on table "public"."employees" to "anon";

grant delete on table "public"."employees" to "authenticated";

grant insert on table "public"."employees" to "authenticated";

grant references on table "public"."employees" to "authenticated";

grant select on table "public"."employees" to "authenticated";

grant trigger on table "public"."employees" to "authenticated";

grant truncate on table "public"."employees" to "authenticated";

grant update on table "public"."employees" to "authenticated";

grant delete on table "public"."employees" to "service_role";

grant insert on table "public"."employees" to "service_role";

grant references on table "public"."employees" to "service_role";

grant select on table "public"."employees" to "service_role";

grant trigger on table "public"."employees" to "service_role";

grant truncate on table "public"."employees" to "service_role";

grant update on table "public"."employees" to "service_role";

grant delete on table "public"."organization" to "anon";

grant insert on table "public"."organization" to "anon";

grant references on table "public"."organization" to "anon";

grant select on table "public"."organization" to "anon";

grant trigger on table "public"."organization" to "anon";

grant truncate on table "public"."organization" to "anon";

grant update on table "public"."organization" to "anon";

grant delete on table "public"."organization" to "authenticated";

grant insert on table "public"."organization" to "authenticated";

grant references on table "public"."organization" to "authenticated";

grant select on table "public"."organization" to "authenticated";

grant trigger on table "public"."organization" to "authenticated";

grant truncate on table "public"."organization" to "authenticated";

grant update on table "public"."organization" to "authenticated";

grant delete on table "public"."organization" to "service_role";

grant insert on table "public"."organization" to "service_role";

grant references on table "public"."organization" to "service_role";

grant select on table "public"."organization" to "service_role";

grant trigger on table "public"."organization" to "service_role";

grant truncate on table "public"."organization" to "service_role";

grant update on table "public"."organization" to "service_role";

grant delete on table "public"."reports" to "anon";

grant insert on table "public"."reports" to "anon";

grant references on table "public"."reports" to "anon";

grant select on table "public"."reports" to "anon";

grant trigger on table "public"."reports" to "anon";

grant truncate on table "public"."reports" to "anon";

grant update on table "public"."reports" to "anon";

grant delete on table "public"."reports" to "authenticated";

grant insert on table "public"."reports" to "authenticated";

grant references on table "public"."reports" to "authenticated";

grant select on table "public"."reports" to "authenticated";

grant trigger on table "public"."reports" to "authenticated";

grant truncate on table "public"."reports" to "authenticated";

grant update on table "public"."reports" to "authenticated";

grant delete on table "public"."reports" to "service_role";

grant insert on table "public"."reports" to "service_role";

grant references on table "public"."reports" to "service_role";

grant select on table "public"."reports" to "service_role";

grant trigger on table "public"."reports" to "service_role";

grant truncate on table "public"."reports" to "service_role";

grant update on table "public"."reports" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";


  create policy "Allow read for authenticated users on same organization"
  on "public"."departments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.email = auth.email()) AND (employees.organization_id = departments.organization_id)))));



  create policy "Enable delete for users based on user_id"
  on "public"."departments"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.organization
  WHERE ((organization.id = departments.organization_id) AND (organization.user_id = auth.uid())))));



  create policy "Enable insert for authenticated users only"
  on "public"."departments"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.organization
  WHERE ((organization.id = departments.organization_id) AND (organization.user_id = auth.uid())))));



  create policy "Enable organization to view their own data only"
  on "public"."departments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.organization
  WHERE ((organization.id = departments.organization_id) AND (organization.user_id = auth.uid())))));



  create policy "Allow employees to view their review assignments"
  on "public"."employee_review_to"
  as permissive
  for select
  to authenticated
using ((reviewer_id = ( SELECT employees.id
   FROM public.employees
  WHERE (employees.email = auth.email())
 LIMIT 1)));



  create policy "Enable delete for users based on user_id"
  on "public"."employee_review_to"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM (public.employees e
     JOIN public.organization o ON ((e.organization_id = o.id)))
  WHERE ((o.user_id = auth.uid()) AND (e.id = employee_review_to.reviewer_id)))));



  create policy "Enable insert for users based on user_id"
  on "public"."employee_review_to"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM ((public.employees reviewer
     JOIN public.employees reviewee ON ((reviewee.id = employee_review_to.reviewee_id)))
     JOIN public.organization o ON ((reviewer.organization_id = o.id)))
  WHERE ((o.user_id = auth.uid()) AND (reviewer.id = employee_review_to.reviewer_id) AND (reviewer.organization_id = reviewee.organization_id)))));



  create policy "Enable users to view their own data only"
  on "public"."employee_review_to"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.employees e
     JOIN public.organization o ON ((e.organization_id = o.id)))
  WHERE ((o.user_id = auth.uid()) AND (e.id = employee_review_to.reviewer_id)))));



  create policy "Policy with table joins"
  on "public"."employee_review_to"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM (public.employees e
     JOIN public.organization o ON ((e.organization_id = o.id)))
  WHERE ((o.user_id = auth.uid()) AND (e.id = employee_review_to.reviewer_id)))));



  create policy "Allow employees to view assigned reviewees"
  on "public"."employees"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable delete for users based on user_id"
  on "public"."employees"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.organization
  WHERE ((organization.user_id = auth.uid()) AND (organization.id = employees.organization_id)))));



  create policy "Enable employees to access their data"
  on "public"."employees"
  as permissive
  for select
  to authenticated
using ((email = auth.email()));



  create policy "Enable insert for users based on user_id"
  on "public"."employees"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.organization
  WHERE ((organization.user_id = auth.uid()) AND (organization.id = employees.organization_id)))));



  create policy "Enable organization to view their own data only"
  on "public"."employees"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.organization
  WHERE ((organization.user_id = auth.uid()) AND (organization.id = employees.organization_id)))));



  create policy "Enable update for users based on email"
  on "public"."employees"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.organization
  WHERE ((organization.user_id = auth.uid()) AND (organization.id = employees.organization_id)))));



  create policy "Enable insert for users based on user_id"
  on "public"."organization"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable update for users based on email"
  on "public"."organization"
  as permissive
  for update
  to public
using (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = email))
with check (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = email));



  create policy "Enable users to view their own data only"
  on "public"."organization"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Organizations can create reports for their own employees"
  on "public"."reports"
  as permissive
  for insert
  to authenticated
with check ((employee_id IN ( SELECT e.id
   FROM (public.employees e
     JOIN public.organization o ON ((e.organization_id = o.id)))
  WHERE (o.user_id = auth.uid()))));



  create policy "Organizations can delete their own employee reports"
  on "public"."reports"
  as permissive
  for delete
  to authenticated
using ((employee_id IN ( SELECT e.id
   FROM (public.employees e
     JOIN public.organization o ON ((e.organization_id = o.id)))
  WHERE (o.user_id = auth.uid()))));



  create policy "Organizations can update their own employee reports"
  on "public"."reports"
  as permissive
  for update
  to authenticated
using ((employee_id IN ( SELECT e.id
   FROM (public.employees e
     JOIN public.organization o ON ((e.organization_id = o.id)))
  WHERE (o.user_id = auth.uid()))))
with check ((employee_id IN ( SELECT e.id
   FROM (public.employees e
     JOIN public.organization o ON ((e.organization_id = o.id)))
  WHERE (o.user_id = auth.uid()))));



  create policy "Organizations can view their own employee reports"
  on "public"."reports"
  as permissive
  for select
  to authenticated
using ((employee_id IN ( SELECT e.id
   FROM (public.employees e
     JOIN public.organization o ON ((e.organization_id = o.id)))
  WHERE (o.user_id = auth.uid()))));



  create policy "Employees can create reviews for assigned reviewees"
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
with check (((EXISTS ( SELECT 1
   FROM public.employees reviewer
  WHERE ((reviewer.email = auth.email()) AND (reviewer.id = reviews.reviewed_by_id) AND (EXISTS ( SELECT 1
           FROM public.employees target
          WHERE ((target.id = reviews.target_employee_id) AND (target.organization_id = reviewer.organization_id))))))) AND (EXISTS ( SELECT 1
   FROM public.employee_review_to
  WHERE ((employee_review_to.reviewer_id = reviews.reviewed_by_id) AND (employee_review_to.reviewee_id = reviews.target_employee_id))))));



  create policy "Employees can view reviews for their assigned reviewees"
  on "public"."reviews"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.employees reviewer
     JOIN public.employee_review_to ert ON ((reviewer.id = ert.reviewer_id)))
  WHERE ((reviewer.email = auth.email()) AND (ert.reviewee_id = reviews.target_employee_id)))));



  create policy "Organization owners can view all reviews"
  on "public"."reviews"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.organization
  WHERE ((organization.id = reviews.organization_id) AND (organization.user_id = auth.uid())))));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


