import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(new URL('../supabase/migrations/20260906010000_add_pg_net_whatsapp_dispatch.sql', import.meta.url), 'utf8');

test('pg_net fallback keeps secrets out of source and emits the expected authenticated payload', () => {
  assert.match(sql, /vault\.decrypted_secrets/);
  assert.match(sql, /walkinly_whatsapp_dispatch_secret/);
  assert.match(sql, /'Authorization', 'Bearer ' \|\| v_secret/);
  assert.match(sql, /'type', 'INSERT'/);
  assert.match(sql, /'record', to_jsonb\(new\)/);
  assert.match(sql, /timeout_milliseconds := 10000/);
  assert.match(sql, /after insert on public\.whatsapp_reminders/i);
  assert.doesNotMatch(sql, /WHATSAPP_DISPATCH_SECRET\s*=|Bearer [A-Za-z0-9_-]{32,}/);
});
