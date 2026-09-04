// Optional isolated PostgreSQL test. Set PGLITE_MODULE to a local PGlite module
// URL/path; no app dependency, secrets or remote database are used.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

test('PostgreSQL triggers, consent, atomic claims and privileges', { skip: !process.env.PGLITE_MODULE }, async () => {
  const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create table salons(id text primary key, name text, whatsapp_notifications_enabled boolean);
      create table queue_entries(id uuid primary key, salon_id text references salons(id), name text, status text, position integer);
      create table customer_notification_preferences(queue_entry_id uuid primary key references queue_entries(id), channel text, phone_e164 text);
      insert into salons values ('s', 'Salon', true), ('off', 'Disabled', false);
    `);
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/20260904010000_add_whatsapp_reminder_outbox.sql', import.meta.url), 'utf8'));
    const uuid = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
    const add = async (n, pos, consent = true, salon = 's') => {
      await db.query("insert into queue_entries values ($1,$2,'Lina','waiting',$3)", [uuid(n), salon, pos]);
      if (consent) await db.query("insert into customer_notification_preferences values ($1,'whatsapp','+41790000000')", [uuid(n)]);
    };
    const claim = async n => (await db.query('select * from claim_whatsapp_reminder($1)', [uuid(n)])).rows;
    const state = async n => (await db.query('select state from whatsapp_reminders where queue_entry_id=$1', [uuid(n)])).rows[0]?.state;
    await add(1, 2);
    assert.equal(await state(1), undefined);
    await db.query('update queue_entries set position=1 where id=$1', [uuid(1)]);
    assert.equal(await state(1), 'pending');
    assert.equal((await claim(1))[0].customer_name, 'Lina');
    assert.equal((await claim(1)).length, 0);
    await db.query('update queue_entries set position=2 where id=$1', [uuid(1)]);
    await db.query('update queue_entries set position=1 where id=$1', [uuid(1)]);
    assert.equal(await state(1), 'sending');
    await add(2, 1);
    assert.equal(await state(2), 'pending');
    await add(3, 1, false);
    await add(4, 1, true, 'off');
    assert.equal(await state(3), undefined);
    assert.equal(await state(4), undefined);
    await db.query("update queue_entries set status='removed' where id=$1", [uuid(2)]);
    assert.equal((await claim(2)).length, 0);
    assert.equal(await state(2), 'skipped');
    await add(5, 1);
    await db.query("update whatsapp_reminders set created_at=now()-interval '6 minutes' where queue_entry_id=$1", [uuid(5)]);
    assert.equal((await claim(5)).length, 0);
    assert.equal(await state(5), 'skipped');
    const privileges = (await db.query(`select
      has_function_privilege('anon','claim_whatsapp_reminder(uuid)','execute') as anon,
      has_function_privilege('authenticated','claim_whatsapp_reminder(uuid)','execute') as authenticated,
      has_function_privilege('service_role','claim_whatsapp_reminder(uuid)','execute') as service`)).rows[0];
    assert.deepEqual(privileges, { anon: false, authenticated: false, service: true });
  } finally { await db.close(); }
});
