-- =====================================================================
-- 05_make_admin.sql  (run by hand, only when you need a new admin)
-- This is the ONLY way to create an admin. It runs in the Supabase SQL
-- Editor with the database owner's rights. The website cannot do it,
-- because customers are not allowed to change profiles.role.
--
-- 1. Register the person in the website first (or Authentication -> Users).
-- 2. Replace the email below, then run this query.
-- DO NOT commit your real email address to GitHub.
-- =====================================================================

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'your-admin-email@example.com');

-- Check the result:
select p.id, u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
