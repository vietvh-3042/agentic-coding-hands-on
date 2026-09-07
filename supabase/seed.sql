-- Seed for local Supabase dev — Sun* Kudos live board (fileKey
-- 9ypp4enmFmdK3YAFJLIu6C) + the profile screen (Profile bản thân — MoMorph
-- 3FoIx6ALVb). Content mirrors the Figma design / kudos-live-board mock data
-- files (components/kudos-board/{feed,highlight,spotlight}-mock-data.ts,
-- components/kudos/kudos-mock-data.ts); nothing invented. Sized (15 profiles,
-- ~40 kudos) per phase-04-seed-data.md so infinite scroll, the top-5
-- highlight, the 10-row leaderboard and the spotlight cloud all render real.
--
-- DEMO_USER_ID below is the single source of truth for the demo user's UUID.
-- lib/profile/current-user.ts mirrors this value — keep them in sync.
-- DEMO_USER_ID = 00000000-0000-4000-8000-000000000001
--
-- Fixed id scheme: profiles 00000000-0000-4000-8000-0000000000NN (01..15),
-- kudos 20000000-0000-4000-8000-0000000000NN (01..40).

-- ===========================================================================
-- auth.users (15) — profiles.id FKs hold against these.
--
-- The empty-string token columns are REQUIRED: GoTrue scans them as Go
-- strings, and a NULL there breaks every /auth/v1/token call with
-- "Database error querying schema" (500). Never seed them as NULL.
--
-- Two identities carry a real bcrypt password (local email/password login:
-- TestLogin123!, local dev only, never a real credential):
--   - demo.user@sun-asterisk.com   (…0001, role='admin' — see below)
--   - sender.one@sun-asterisk.com  (…0002, role='user' — the ordinary-role
--     identity every non-admin path, incl. F004's "own kudos disable the
--     heart control" rule, needs. Also the seeded boxes_unopened = 0
--     identity the secret-box empty state exercises.)
-- The remaining 13 are Google-only (empty encrypted_password) and cannot
-- complete signInWithPassword — they exist to populate receivers/senders,
-- the leaderboard and the spotlight cloud.
-- ===========================================================================
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'demo.user@sun-asterisk.com', extensions.crypt('TestLogin123!', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email","google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'sender.one@sun-asterisk.com', extensions.crypt('TestLogin123!', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email","google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003',
   'authenticated', 'authenticated', 'sender.two@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000004',
   'authenticated', 'authenticated', 'andrew.nelson@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000005',
   'authenticated', 'authenticated', 'bella.turner@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000006',
   'authenticated', 'authenticated', 'nathan.long@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000007',
   'authenticated', 'authenticated', 'hannah.palmer@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000008',
   'authenticated', 'authenticated', 'quinn.doyle@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000009',
   'authenticated', 'authenticated', 'lana.vaughn@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000010',
   'authenticated', 'authenticated', 'adrian.hall@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000011',
   'authenticated', 'authenticated', 'maya.brooks@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000012',
   'authenticated', 'authenticated', 'henry.dawson@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000013',
   'authenticated', 'authenticated', 'anna.young@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000014',
   'authenticated', 'authenticated', 'tracy.mason@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000015',
   'authenticated', 'authenticated', 'charles.barnes@sun-asterisk.com', '',
   now(), '{"provider":"google","providers":["google"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', '');

-- ===========================================================================
-- profiles (15) — display names/hero codes/badges/box counts sourced from
-- the design + the feed/highlight/spotlight/write-kudos mock data files
-- (Nathan Hunter/Nathan Hunt from feed-mock-data.ts & highlight-mock-data.ts;
-- Andrew Nelson..Maya Brooks from kudos-mock-data.ts MOCK_SUNNERS; Henry
-- Dawson/Anna Young/Tracy Mason/Charles Barnes from spotlight-mock-data.ts).
-- Spread across all 4 hero_badge tiers and CEVC1-CEVC4. …0002 is seeded at
-- boxes_unopened = 0 (secret-box empty state, supabase/tests/secret-box.sql
-- Part 3) and, per privileges.sql, is the non-admin identity every column-
-- privilege assertion runs as.
-- ===========================================================================
insert into public.profiles (id, display_name, hero_code, avatar_url, hero_badge, boxes_opened, boxes_unopened, language)
values
  ('00000000-0000-4000-8000-000000000001', 'Huỳnh Dương Xuân Nhật', 'CEVC3',
   '/profile/avatar-sample-1.png', 'legend', 25, 25, 'vi'),
  ('00000000-0000-4000-8000-000000000002', 'Nathan Hunter', 'CEVC1',
   '/kudos/feed/sender-avatar.png', 'new', 2, 0, 'vi'),
  ('00000000-0000-4000-8000-000000000003', 'Nathan Hunt', 'CEVC1',
   '/kudos/feed/receiver-avatar.png', 'legend', 1, 3, 'vi'),
  ('00000000-0000-4000-8000-000000000004', 'Andrew Nelson', 'CEVC2',
   '/kudos/feed/leaderboard-avatar.png', 'rising', 2, 2, 'vi'),
  ('00000000-0000-4000-8000-000000000005', 'Bella Turner', 'CEVC2',
   '/kudos/highlight/avatar-1.png', 'super', 0, 4, 'vi'),
  ('00000000-0000-4000-8000-000000000006', 'Nathan Long', 'CEVC3',
   '/kudos/highlight/avatar-2.png', 'new', 3, 1, 'vi'),
  ('00000000-0000-4000-8000-000000000007', 'Hannah Palmer', 'CEVC3',
   '/kudos/feed/sender-avatar.png', 'rising', 1, 2, 'vi'),
  ('00000000-0000-4000-8000-000000000008', 'Quinn Doyle', 'CEVC4',
   '/kudos/feed/receiver-avatar.png', 'super', 4, 3, 'vi'),
  ('00000000-0000-4000-8000-000000000009', 'Lana Vaughn', 'CEVC4',
   '/kudos/feed/leaderboard-avatar.png', 'legend', 2, 1, 'vi'),
  ('00000000-0000-4000-8000-000000000010', 'Adrian Hall', 'CEVC1',
   '/kudos/highlight/avatar-1.png', 'new', 0, 2, 'vi'),
  ('00000000-0000-4000-8000-000000000011', 'Maya Brooks', 'CEVC2',
   '/kudos/highlight/avatar-2.png', 'rising', 3, 4, 'vi'),
  ('00000000-0000-4000-8000-000000000012', 'Henry Dawson', 'CEVC3',
   '/kudos/feed/sender-avatar.png', 'super', 1, 1, 'vi'),
  ('00000000-0000-4000-8000-000000000013', 'Anna Young', 'CEVC4',
   '/kudos/feed/receiver-avatar.png', 'legend', 2, 3, 'vi'),
  ('00000000-0000-4000-8000-000000000014', 'Tracy Mason', 'CEVC1',
   '/kudos/feed/leaderboard-avatar.png', 'new', 0, 1, 'vi'),
  ('00000000-0000-4000-8000-000000000015', 'Charles Barnes', 'CEVC2',
   '/kudos/highlight/avatar-1.png', 'rising', 4, 2, 'vi')
-- The on_auth_user_created trigger (20260722090000) already inserted bare
-- profile rows for the auth.users above; overwrite them with the design
-- values.
on conflict (id) do update set
  display_name = excluded.display_name,
  hero_code = excluded.hero_code,
  avatar_url = excluded.avatar_url,
  hero_badge = excluded.hero_badge,
  boxes_opened = excluded.boxes_opened,
  boxes_unopened = excluded.boxes_unopened,
  language = excluded.language;

-- ===========================================================================
-- kudos (40) — hearts_count is NEVER set directly here (left at its column
-- default, 0): the sync trigger on kudo_hearts (20260722100000) owns that
-- column, and writing it here would create a drift the app can never
-- repair. created_at is spread 6 hours apart across 40 rows (0..234 hours
-- back, ~10 days), so `created_at desc` paging and the "≥4 distinct days"
-- requirement are both exercised without any random()/absolute timestamp.
--
-- Content: the long "Cảm ơn người em bình thường..." message + "IDOL GIỚI
-- TRẺ" chip + 5 attachments is the design's one authored KUDO Post card
-- (feed-mock-data.ts BASE_POSTS); the design deliberately repeats it across
-- every populated card, so repetition here is fidelity, not laziness. The
-- two short "Cảm ơn anh..." messages are the existing demo-sent content.
-- Exactly 1 row is_spam (id …0002, no title — mirrors the design's
-- untitled "Spam" card), exactly 2 rows is_anonymous (ids …0003/…0004,
-- anonymous_name left null so the mapper falls back to "Ẩn danh", matching
-- the pre-existing anonymous row's behavior). 10 rows carry the 5-image
-- attachment set (≥5 required). Every one of the 15 profiles appears as a
-- receiver at least once (…0001 the demo user receives 8, the rest 2-3
-- each) and the demo user sends exactly 2 (ids …0006/…0007) so the
-- heart-control "own kudos disabled" rule (TC 63645b03) has a fixture.
-- ===========================================================================
insert into public.kudos (id, sender_id, receiver_id, hashtag_title, message, attachment_count, hashtags, is_spam, image_urls, is_anonymous, anonymous_name, created_at)
values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '0 hours'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', true, '{}', false, null, now() - interval '6 hours'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000003', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', true, null, now() - interval '12 hours'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', true, null, now() - interval '18 hours'),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000005', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '24 hours'),
  ('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000006', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '30 hours'),
  ('20000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '36 hours'),
  ('20000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000008', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '42 hours'),
  ('20000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000009', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '48 hours'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000010', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '54 hours'),
  ('20000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000011', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '60 hours'),
  ('20000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000012', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '66 hours'),
  ('20000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000013', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '72 hours'),
  ('20000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000014', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '78 hours'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000015', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '84 hours'),
  ('20000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000001', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '90 hours'),
  ('20000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '96 hours'),
  ('20000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000003', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '102 hours'),
  ('20000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '108 hours'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000005', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '114 hours'),
  ('20000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000006', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '120 hours'),
  ('20000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000007', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '126 hours'),
  ('20000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000008', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '132 hours'),
  ('20000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000009', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '138 hours'),
  ('20000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000010', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '144 hours'),
  ('20000000-0000-4000-8000-000000000026', '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000011', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '150 hours'),
  ('20000000-0000-4000-8000-000000000027', '00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000012', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '156 hours'),
  ('20000000-0000-4000-8000-000000000028', '00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000013', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '162 hours'),
  ('20000000-0000-4000-8000-000000000029', '00000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000014', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '168 hours'),
  ('20000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000015', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '174 hours'),
  ('20000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '180 hours'),
  ('20000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '186 hours'),
  ('20000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '192 hours'),
  ('20000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000004', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '198 hours'),
  ('20000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000005', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '204 hours'),
  ('20000000-0000-4000-8000-000000000036', '00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '210 hours'),
  ('20000000-0000-4000-8000-000000000037', '00000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000001', 'IDOL GIỚI TRẺ', 'Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...', 5, '', false, '{/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png,/kudos/feed/attachment-sample.png}', false, null, now() - interval '216 hours'),
  ('20000000-0000-4000-8000-000000000038', '00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '222 hours'),
  ('20000000-0000-4000-8000-000000000039', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', '', 'Cảm ơn anh đã đồng hành cùng dự án!', 0, '', false, '{}', false, null, now() - interval '228 hours'),
  ('20000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', '', 'Cảm ơn anh đã luôn hỗ trợ team hết mình!', 0, '', false, '{}', false, null, now() - interval '234 hours');

-- ===========================================================================
-- kudo_hashtags — joined on public.hashtags.name, never a literal id (the
-- identity sequence is not guaranteed across resets). 1-4 tags per kudo.
-- 'Wasshoi' is deliberately excluded from the 6 hearts-designated kudos
-- below (ids …0010/…0015/…0020/…0025/…0030/…0035) while appearing on many
-- others, so filtering by it returns real feed matches with no top-5 match
-- (F002 US005 "no shared match").
-- ===========================================================================
insert into public.kudo_hashtags (kudo_id, hashtag_id)
select v.kudo_id, h.id
from (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Be Agile'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Wasshoi'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Hướng mục tiêu'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Hướng khách hàng'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Chuẩn quy trình'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Giải pháp sáng tạo'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Quản lý xuất sắc'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'Quản lý xuất sắc'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'Hiệu suất cao'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Aim High'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Be Agile'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Wasshoi'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'Hướng mục tiêu'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'Hướng khách hàng'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'Chuẩn quy trình'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'Giải pháp sáng tạo'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'Giải pháp sáng tạo'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'Giỏi chuyên môn'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'Hiệu suất cao'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Aim High'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Be Agile'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Wasshoi'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Hướng mục tiêu'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Hướng khách hàng'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Chuẩn quy trình'),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'Chuẩn quy trình'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'Toàn diện'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'Giỏi chuyên môn'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'Aim High'),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'Be Agile'),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'Hướng mục tiêu'),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'Hướng khách hàng'),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'Chuẩn quy trình'),
    ('20000000-0000-4000-8000-000000000016'::uuid, 'Hướng khách hàng'),
    ('20000000-0000-4000-8000-000000000017'::uuid, 'Quản lý xuất sắc'),
    ('20000000-0000-4000-8000-000000000017'::uuid, 'Toàn diện'),
    ('20000000-0000-4000-8000-000000000018'::uuid, 'Hiệu suất cao'),
    ('20000000-0000-4000-8000-000000000018'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000018'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'Aim High'),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'Be Agile'),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'Wasshoi'),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'Hướng mục tiêu'),
    ('20000000-0000-4000-8000-000000000020'::uuid, 'Hướng mục tiêu'),
    ('20000000-0000-4000-8000-000000000021'::uuid, 'Giải pháp sáng tạo'),
    ('20000000-0000-4000-8000-000000000021'::uuid, 'Quản lý xuất sắc'),
    ('20000000-0000-4000-8000-000000000022'::uuid, 'Giỏi chuyên môn'),
    ('20000000-0000-4000-8000-000000000022'::uuid, 'Hiệu suất cao'),
    ('20000000-0000-4000-8000-000000000022'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000023'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000023'::uuid, 'Aim High'),
    ('20000000-0000-4000-8000-000000000023'::uuid, 'Be Agile'),
    ('20000000-0000-4000-8000-000000000023'::uuid, 'Wasshoi'),
    ('20000000-0000-4000-8000-000000000024'::uuid, 'Wasshoi'),
    ('20000000-0000-4000-8000-000000000025'::uuid, 'Chuẩn quy trình'),
    ('20000000-0000-4000-8000-000000000025'::uuid, 'Giải pháp sáng tạo'),
    ('20000000-0000-4000-8000-000000000026'::uuid, 'Toàn diện'),
    ('20000000-0000-4000-8000-000000000026'::uuid, 'Giỏi chuyên môn'),
    ('20000000-0000-4000-8000-000000000026'::uuid, 'Hiệu suất cao'),
    ('20000000-0000-4000-8000-000000000027'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000027'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000027'::uuid, 'Aim High'),
    ('20000000-0000-4000-8000-000000000027'::uuid, 'Be Agile'),
    ('20000000-0000-4000-8000-000000000028'::uuid, 'Be Agile'),
    ('20000000-0000-4000-8000-000000000029'::uuid, 'Hướng khách hàng'),
    ('20000000-0000-4000-8000-000000000029'::uuid, 'Chuẩn quy trình'),
    ('20000000-0000-4000-8000-000000000030'::uuid, 'Quản lý xuất sắc'),
    ('20000000-0000-4000-8000-000000000030'::uuid, 'Toàn diện'),
    ('20000000-0000-4000-8000-000000000030'::uuid, 'Giỏi chuyên môn'),
    ('20000000-0000-4000-8000-000000000031'::uuid, 'Hiệu suất cao'),
    ('20000000-0000-4000-8000-000000000031'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000031'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000031'::uuid, 'Aim High'),
    ('20000000-0000-4000-8000-000000000032'::uuid, 'Aim High'),
    ('20000000-0000-4000-8000-000000000033'::uuid, 'Hướng mục tiêu'),
    ('20000000-0000-4000-8000-000000000033'::uuid, 'Hướng khách hàng'),
    ('20000000-0000-4000-8000-000000000034'::uuid, 'Giải pháp sáng tạo'),
    ('20000000-0000-4000-8000-000000000034'::uuid, 'Quản lý xuất sắc'),
    ('20000000-0000-4000-8000-000000000034'::uuid, 'Toàn diện'),
    ('20000000-0000-4000-8000-000000000035'::uuid, 'Giỏi chuyên môn'),
    ('20000000-0000-4000-8000-000000000035'::uuid, 'Hiệu suất cao'),
    ('20000000-0000-4000-8000-000000000035'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000035'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000036'::uuid, 'Cống hiến'),
    ('20000000-0000-4000-8000-000000000037'::uuid, 'Wasshoi'),
    ('20000000-0000-4000-8000-000000000037'::uuid, 'Hướng mục tiêu'),
    ('20000000-0000-4000-8000-000000000038'::uuid, 'Chuẩn quy trình'),
    ('20000000-0000-4000-8000-000000000038'::uuid, 'Giải pháp sáng tạo'),
    ('20000000-0000-4000-8000-000000000038'::uuid, 'Quản lý xuất sắc'),
    ('20000000-0000-4000-8000-000000000039'::uuid, 'Toàn diện'),
    ('20000000-0000-4000-8000-000000000039'::uuid, 'Giỏi chuyên môn'),
    ('20000000-0000-4000-8000-000000000039'::uuid, 'Hiệu suất cao'),
    ('20000000-0000-4000-8000-000000000039'::uuid, 'Truyền cảm hứng'),
    ('20000000-0000-4000-8000-000000000040'::uuid, 'Truyền cảm hứng')
  ) as v(kudo_id, hashtag_name)
join public.hashtags h on h.name = v.hashtag_name;

-- ===========================================================================
-- kudo_hearts — the ONLY way hearts_count moves (the AFTER trigger from
-- 20260722100000_kudo_hearts.sql owns that column). Each row here is one
-- distinct (kudo, user) like; hearts_value is left at its column default —
-- the BEFORE INSERT trigger (20260906192000_heart_multiplier.sql) resolves
-- it server-side from event_settings (no special day seeded, so every row
-- here resolves to 1). No row hearts a kudo its own user sent (the RLS
-- self-heart guard would reject that from a real client; honored here too
-- even though `postgres` bypasses RLS).
--
-- Six kudos are hearted, producing an unambiguous, strictly descending top
-- 5 with a clear gap below it (every other kudo stays at the column default,
-- 0): …0010 = 12, …0015 = 10, …0020 = 8, …0025 = 7, …0030 = 6 (the top 5),
-- …0035 = 5 (6th place — differs from the 5th by 1, no tie at the
-- boundary). This also satisfies the "demo user already hearted a kudo"
-- fixture (…0001 hearts …0010/…0015/…0020/…0025/…0030/…0035).
-- ===========================================================================
insert into public.kudo_hearts (kudo_id, user_id)
values
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000006'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000007'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000008'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000010'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000011'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000012'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000013'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000006'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000007'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000008'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000009'),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000010'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000007'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000008'),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000009'),
  ('20000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000006'),
  ('20000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000007'),
  ('20000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000006'),
  ('20000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000007'),
  ('20000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000005');

-- ===========================================================================
-- secret_box_icons — the REAL six-badge catalog, inserted directly (not the
-- placeholder "Icon 1".."Icon 6" rows this file used to carry).
--
-- ORDERING BUG this fixes: `supabase db reset` runs every migration BEFORE
-- this file. Migration 20260906192500_secret_box_draw.sql only UPDATEs
-- these rows by sort_order (it does not INSERT) — written on the
-- assumption that seed.sql's placeholder INSERT had already created them.
-- Against a from-scratch reset, that UPDATE runs first against an EMPTY
-- table (a correct no-op), and the placeholder INSERT that used to follow
-- here would leave the catalog wrong (weight = 0 for every icon) with no
-- later step to fix it. Fix: seed.sql now inserts the real catalog
-- directly — the migration's UPDATE stays a harmless no-op on a fresh
-- reset, and the six real names/weights (summing to 100, per
-- supabase/tests/secret-box.sql) are correct from the first read.
-- Artwork is still absent (image_url unchanged, non-blocking per
-- clarifications.md 2026-09-06 run 2) — the UI renders a name-text
-- fallback.
-- ===========================================================================
insert into public.secret_box_icons (id, name, image_url, sort_order, weight)
values
  ('10000000-0000-4000-8000-000000000001', 'Stay Gold', '/profile/icons/icon-1.svg', 1, 30),
  ('10000000-0000-4000-8000-000000000002', 'Flow to Horizon', '/profile/icons/icon-2.svg', 2, 25),
  ('10000000-0000-4000-8000-000000000003', 'Touch of Light', '/profile/icons/icon-3.svg', 3, 20),
  ('10000000-0000-4000-8000-000000000004', 'Beyond the Boundary', '/profile/icons/icon-4.svg', 4, 10),
  ('10000000-0000-4000-8000-000000000005', 'Revival', '/profile/icons/icon-5.svg', 5, 10),
  ('10000000-0000-4000-8000-000000000006', 'Root Further', '/profile/icons/icon-6.svg', 6, 5);

-- 3 unlocks for the demo user (design: "Bộ sưu tập icon của tôi" shows some
-- slots unlocked, the rest gray) — Stay Gold / Flow to Horizon / Touch of
-- Light, matching the first 3 rows above.
insert into public.user_icon_unlocks (user_id, icon_id)
values
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003');

-- Home page (spec A1.8, ID-5/37): promote the demo user to admin so the
-- account menu's "Admin Dashboard" item is exercised in local dev. …0002
-- stays the default 'user' role deliberately — every non-admin-path
-- assertion (privileges.sql, secret-box.sql Part 3, F004's heart-control
-- rule) runs as …0002 so it isn't vacuously true against an admin.
update public.profiles set role = 'admin'
where id = '00000000-0000-4000-8000-000000000001';

-- Home page notification bell (spec A1.6, ID-11/27..29): 2 unread
-- (read_at null) + 2 read rows for the demo user so both badge states and
-- the panel's read/unread styling render.
insert into public.notifications (user_id, title, body, read_at, created_at)
values
  ('00000000-0000-4000-8000-000000000001', 'Bạn nhận được Kudo mới',
   'Huỳnh Dương Xuân Nhật vừa gửi cho bạn một Kudo trong bảng tin.',
   null, '2025-10-30T10:05:00+07:00'),
  ('00000000-0000-4000-8000-000000000001', 'Hộp bí mật đã mở khoá',
   'Bạn vừa mở thêm một hộp bí mật mới trong bộ sưu tập icon.',
   null, '2025-10-30T09:00:00+07:00'),
  ('00000000-0000-4000-8000-000000000001', 'Chào mừng bạn đến với SunKudos',
   'Cảm ơn bạn đã tham gia SunKudos! Hãy bắt đầu gửi lời cảm ơn tới đồng nghiệp.',
   '2025-10-29T08:00:00+07:00', '2025-10-28T08:00:00+07:00'),
  ('00000000-0000-4000-8000-000000000001', 'Kudo của bạn đã được ghi nhận',
   'Lời cảm ơn bạn gửi cho đồng nghiệp đã xuất hiện trên bảng tin Kudos.',
   '2025-10-27T08:00:00+07:00', '2025-10-26T08:00:00+07:00');
