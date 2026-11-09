update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'your-admin-email@example.com');

select p.id, u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
