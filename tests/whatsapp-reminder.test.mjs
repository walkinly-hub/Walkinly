import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync(new URL('../app/api/whatsapp/reminder/route.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const id = '00000000-0000-0000-0000-000000000001';
function setup({ disabled = false, claimError = false, skip = false, failSend = false } = {}) {
  const sent = [], saved = [], logs = [];
  let claimed = false;
  const db = {
    rpc: async () => {
      if (claimError) return { error: {} };
      if (claimed || skip) return { data: [] };
      claimed = true;
      return { data: [{ recipient_phone: '+41790000000', customer_name: 'Lina', salon_name: 'Test Salon' }] };
    },
    from: () => ({ update: values => ({ eq: async () => { saved.push(values); return {}; } }) }),
  };
  const imports = { 'node:crypto': crypto, '@supabase/supabase-js': { createClient: () => db },
    '@/lib/whatsapp': { sendWhatsAppReminder: async values => {
      sent.push(values);
      if (failSend) throw new Error('PRIVATE_PHONE_AND_TOKEN');
      return 'test-reference';
    } } };
  const context = { exports: {}, Response, console: { error: value => logs.push(value) },
    process: { env: { WHATSAPP_DISPATCH_SECRET: 'secret', NEXT_PUBLIC_SUPABASE_URL: 'url', SUPABASE_SERVICE_ROLE_KEY: 'key', WHATSAPP_AUTOMATION_ENABLED: disabled ? 'false' : 'true' } },
    require: name => imports[name] };
  vm.runInNewContext(code, context);
  const call = (auth = 'Bearer secret', record = { queue_entry_id: id, recipient_phone: 'ATTACKER' }) => context.exports.POST(new Request('https://example.test', {
    method: 'POST', headers: { authorization: auth }, body: JSON.stringify({ type: 'INSERT', schema: 'public', table: 'whatsapp_reminders', record }),
  }));
  return { call, sent, saved, logs };
}
test('disabled and unauthenticated requests never send', async () => {
  const disabled = setup({ disabled: true });
  assert.equal((await disabled.call()).status, 503);
  const active = setup();
  assert.equal((await active.call('Bearer wrong')).status, 403);
  assert.equal((await active.call('Bearer secret', {})).status, 400);
  assert.equal(active.sent.length + disabled.sent.length, 0);
});
test('uses claimed database names/number, ignores payload contact data, duplicate claim skips', async () => {
  const app = setup();
  await Promise.all([app.call(), app.call()]);
  assert.equal(app.sent.length, 1);
  assert.equal(app.sent[0].customerName, 'Lina');
  assert.equal(app.sent[0].salonName, 'Test Salon');
  assert.equal(app.sent[0].recipientPhone, '+41790000000');
  assert.equal(app.saved[0].state, 'accepted');
});
test('ineligible entry or database failure never sends', async () => {
  const skipped = setup({ skip: true });
  assert.equal((await skipped.call()).status, 200);
  const failed = setup({ claimError: true });
  assert.equal((await failed.call()).status, 503);
  assert.equal(skipped.sent.length + failed.sent.length, 0);
});
test('uncertain send is acknowledged without retry or private error logging', async () => {
  const app = setup({ failSend: true });
  assert.equal((await app.call()).status, 200);
  await app.call();
  assert.equal(app.sent.length, 1);
  assert.equal(app.saved[0].state, 'failed');
  assert(!JSON.stringify(app.logs).includes('PRIVATE'));
});
