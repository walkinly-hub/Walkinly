import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import ts from 'typescript';

function load(path, imports, extras = {}) {
  const context = { exports: {}, Buffer, URL, Response, ...extras, require: name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return context.exports;
}
const helpers = load('../lib/whatsapp-webhook.ts', { 'node:crypto': crypto });
const secret = 'test-only-app-secret';
const phoneId = '12345';
const fixture = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
  metadata: { phone_number_id: phoneId, display_phone_number: 'PRIVATE_PHONE' },
  messages: [{ text: { body: 'PRIVATE_MESSAGE' } }],
  statuses: [{ id: 'wamid.PRIVATE_ID', status: 'failed', timestamp: '1788514325', recipient_id: 'PRIVATE_RECIPIENT',
    errors: [{ code: 131026, message: 'PRIVATE_ERROR' }] }],
} }] }] };

test('only allowlisted delivery fields are returned, malformed/unrelated events ignored', () => {
  const events = helpers.deliveryEvents(fixture, phoneId);
  assert.equal(events.length, 1);
  assert.equal(events[0].errorCodes[0], 131026);
  assert.equal(events[0].reference, helpers.messageReference('wamid.PRIVATE_ID'));
  assert(!JSON.stringify(events).includes('PRIVATE'));
  assert.equal(helpers.deliveryEvents(fixture, 'other').length, 0);
  for (const value of [null, {}, { entry: [null] }, { object: 'whatsapp_business_account', entry: [{ changes: [null] }] }]) {
    assert.equal(helpers.deliveryEvents(value, phoneId).length, 0);
  }
});

test('webhook verifies challenge, authenticates raw bytes, limits body and logs no private data', async () => {
  const logs = [];
  const route = load('../app/api/whatsapp/webhook/route.ts', {
    'node:crypto': crypto, '@/lib/whatsapp-webhook': helpers,
  }, { process: { env: { WHATSAPP_APP_SECRET: secret, WHATSAPP_PHONE_NUMBER_ID: phoneId, WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-secret' } },
    console: { info: (...args) => logs.push(args) } });
  const response = await route.GET(new Request('https://example.test?hub.mode=subscribe&hub.verify_token=verify-secret&hub.challenge=123'));
  assert.equal(await response.text(), '123');
  assert.equal((await route.GET(new Request('https://example.test?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123'))).status, 403);
  const body = JSON.stringify(fixture);
  const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  const post = (value, sig) => route.POST(new Request('https://example.test', { method: 'POST', body: value, headers: sig ? { 'x-hub-signature-256': sig } : {} }));
  assert.equal((await post(body)).status, 403);
  assert.equal((await post(body + ' ', signature)).status, 403);
  assert.equal((await post(body, 'sha256=bad')).status, 403);
  assert.equal(logs.length, 0);
  assert.equal((await post(body, signature)).status, 200);
  assert.equal(logs.length, 1);
  assert(!JSON.stringify(logs).includes('PRIVATE'));
  assert.equal((await post('x'.repeat(1024 * 1024 + 1))).status, 413);
  const invalid = '{';
  assert.equal((await post(invalid, 'sha256=' + crypto.createHmac('sha256', secret).update(invalid).digest('hex'))).status, 400);
});

test('webhook fails closed without configured secrets', async () => {
  const route = load('../app/api/whatsapp/webhook/route.ts', { 'node:crypto': crypto, '@/lib/whatsapp-webhook': helpers }, { process: { env: {} } });
  assert.equal((await route.GET(new Request('https://example.test'))).status, 503);
  assert.equal((await route.POST(new Request('https://example.test', { method: 'POST', body: '{}' }))).status, 503);
});
