-- Remove the fixed-ID candidate accounts created solely for employer portal
-- applicant, interview, and talent-search demos. Related public records are
-- removed through their auth.users ON DELETE CASCADE foreign keys.
delete from auth.users
where id in (
  'a1111111-1111-4111-8111-111111111111'::uuid,
  'a2222222-2222-4222-8222-222222222222'::uuid,
  'a3333333-3333-4333-8333-333333333333'::uuid,
  'a4444444-4444-4444-8444-444444444444'::uuid,
  'a5555555-5555-4555-8555-555555555555'::uuid,
  'a6666666-6666-4666-8666-666666666666'::uuid,
  'a7777777-7777-4777-8777-777777777777'::uuid,
  'a8888888-8888-4888-8888-888888888888'::uuid,
  'a9999999-9999-4999-8999-999999999999'::uuid,
  'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
  'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid,
  'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid
);
