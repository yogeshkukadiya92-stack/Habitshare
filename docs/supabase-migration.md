# Supabase Migration

This Habit Share app now expects Supabase for auth and the social habit data flow.

## Environment variables

Add these variables in local `.env.local` and Railway:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Required tables

Create these tables in Supabase:

### `profiles`

- `id` `uuid` primary key
- `email` `text` unique
- `name` `text`
- `avatar_url` `text`
- `branch` `text`
- `role` `text`
- `permissions` `jsonb`
- `created_at` `timestamptz` default `now()`
- `updated_at` `timestamptz` default `now()`

### `habit_share_habits`

- `id` `text` primary key
- `user_id` `uuid`
- `user_name` `text`
- `user_email` `text`
- `name` `text`
- `description` `text`
- `check_ins` `text[]` default `'{}'`
- `cheers` `integer` default `0`
- `is_shared` `boolean` default `false`
- `shared_with_ids` `text[]` default `'{}'`
- `created_at` `timestamptz` default `now()`
- `updated_at` `timestamptz` default `now()`

### `habit_friend_requests`

- `id` `text` primary key
- `requester_id` `uuid`
- `requester_name` `text`
- `requester_email` `text`
- `receiver_id` `uuid`
- `receiver_name` `text`
- `receiver_email` `text`
- `status` `text`
- `created_at` `timestamptz` default `now()`

## Notes

- The live habit-share dashboard and auth now read from Supabase.
- Legacy HR/KRA screens in this repo still contain Firebase-specific code and should be migrated in a second pass before removing Firebase dependencies completely.
