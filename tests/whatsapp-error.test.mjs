import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/whatsapp-error.ts', import.meta.url), 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context);
const describe = context.exports.describeWhatsAppError;

test('keeps useful reasons, ignores unselected fields and deduplicates', () => {
  const report = describe({ message: 'Invalid parameter', error_user_msg: 'Invalid parameter',
    error_data: { details: 'Registration unavailable', private: 'hidden' }, token: 'hidden' }, []);
  assert.equal(report, 'Invalid parameter | Registration unavailable');
});

test('redacts raw, encoded, escaped and formatted credentials before truncating', () => {
  const token = 'test/token+with=special"characters';
  const pin = '012345';
  const report = describe({ message: [token, encodeURIComponent(token),
    JSON.stringify(token).slice(1, -1), pin, '0 1 2 3 4 5', '+41 79 123 45 67',
    'Bearer other-secret', 'A'.repeat(50)].join(' | ') }, [token, pin]);
  for (const secret of [token, encodeURIComponent(token), pin, '0 1 2 3 4 5',
    'other-secret', 'A'.repeat(50), '+41 79 123 45 67']) assert(!report.includes(secret));
  assert(report.includes('[vertraulich]'));
  const longReport = describe({ message: 'x '.repeat(390) + token }, [token]);
  assert(longReport.length <= 800);
  assert(!longReport.includes('test/token'));
});

test('handles absent, non-string and malformed descriptions safely', () => {
  for (const error of [null, undefined, 'oops', { message: {}, error_data: null },
    { error_user_title: 42, error_data: { details: [] } }]) assert.equal(describe(error, []), '');
});
