import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const form = fs.readFileSync(new URL('../components/customer/CheckInForm.tsx', import.meta.url), 'utf8');
const flow = fs.readFileSync(new URL('../components/customer/CustomerFlow.tsx', import.meta.url), 'utf8');
const sql = fs.readFileSync(new URL('../supabase/migrations/20260909000000_require_position_three_for_whatsapp_opt_in.sql', import.meta.url), 'utf8');

test('WhatsApp option uses the next queue position and cannot be submitted while unavailable', () => {
  assert.match(flow, /prospectiveQueuePosition=\{waitingCount \+ 1\}/);
  assert.match(form, /whatsappNotificationsEnabled && prospectiveQueuePosition >= 3/);
  assert.match(form, /p_whatsapp_opt_in: whatsappOptionAvailable && wantsWhatsAppNotification/);
  assert.match(form, /p_whatsapp_phone: whatsappOptionAvailable && wantsWhatsAppNotification/);
  assert.match(form, /\{whatsappOptionAvailable && \(/);
});

test('database validates the final locked position before storing the entry and consent', () => {
  const lock = sql.indexOf('pg_advisory_xact_lock');
  const position = sql.indexOf('into v_position');
  const restriction = sql.indexOf('v_position < 3');
  const queueInsert = sql.indexOf('insert into public.queue_entries');
  const preferenceInsert = sql.indexOf('insert into public.customer_notification_preferences');
  assert(lock >= 0 && lock < position);
  assert(position < restriction && restriction < queueInsert && queueInsert < preferenceInsert);
  assert.match(sql, /coalesce\(p_whatsapp_opt_in, false\) and v_position < 3/);
});
