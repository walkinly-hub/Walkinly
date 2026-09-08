import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(new URL('../supabase/migrations/20260908000000_enable_besbarber_whatsapp_notifications.sql', import.meta.url), 'utf8');

test('BESBARBER enablement is narrowly scoped and fails if the salon is absent', () => {
  assert.match(sql, /set whatsapp_notifications_enabled = true/i);
  assert.match(sql, /where id = 'besbarber'/i);
  assert.match(sql, /if not exists \(select 1 from public\.salons where id = 'besbarber'\)/i);
  assert.doesNotMatch(sql, /update public\.salons\s+set whatsapp_notifications_enabled = true\s*;/i);
  assert.doesNotMatch(sql, /insert|delete|truncate/i);
});
