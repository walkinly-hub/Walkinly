# Supabase migrations

`migrations/20260721000000_baseline.sql` documents the existing Walkinly
database schema, RLS policies, indexes and RPC functions as of 2026-07-21.

It is a baseline for a new Supabase environment. Do **not** execute it in the
current production project: the same objects already exist there.

For every database change from now on:

1. Add one timestamped SQL file in `supabase/migrations/`.
2. Run that exact file once in the Supabase SQL Editor for the current project.
3. Test the app.
4. Commit the migration together with the related application code.

This keeps the database and the Git history reproducible without storing any
Supabase credentials in the repository.
