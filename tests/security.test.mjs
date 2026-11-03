import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { csrf, jsonBody, identifiers, validateRecord, seal, open, lookup, response } from '../lib/security.mjs';
const valid = () => ({ PatientId: '1234567890', NormalizedServiceCode: 'GSL123456789012', PatientName: 'اسم اختباري', From: '2026-11-01', To: '2026-11-03', SickLeaveDate: '2026-11-01', Duration: 3 });
test('requires both inquiry identifiers, including types and bounds', () => {
  for (const args of [['', ''], ['1234567890', ''], ['', 'GSL123456'], [1234567890,'GSL123456'], ['1234567890',"' OR 1=1--"]]) assert.throws(() => identifiers(...args));
  assert.deepEqual(identifiers('1234567890', 'GSL123456789012'), ['1234567890','gsl123456789012']);
});
test('rejects stored XSS, unexpected fields, malformed dates and inconsistent durations', () => {
  assert.equal(validateRecord(valid()).Duration, 3);
  for (const patch of [{PatientName:'<img src=x onerror=alert(1)>'}, {Notes:'x'.repeat(2001)}, {role:'admin'}, {From:'2026-02-30'}, {To:'2026-10-31'}, {Duration:300}, {Duration:'3'}, {Relationship:99}, {isCompanion:'true'}, {PatientName:{name:'test'}}]) assert.throws(() => validateRecord({...valid(),...patch}));
});
test('CSRF rejects foreign origins, missing tokens and cross-site requests', () => {
  const secret = 'a'.repeat(64);
  const request = headers => new Request('https://example.test/api/sick-leaves', {method:'POST',headers});
  assert.equal(csrf(request({origin:'https://example.test','x-csrf-token':secret}),secret),secret);
  for (const headers of [{origin:'https://evil.test','x-csrf-token':secret},{origin:'https://example.test'},{origin:'https://example.test','x-csrf-token':'b'.repeat(64)},{origin:'https://example.test','x-csrf-token':secret,'sec-fetch-site':'cross-site'}]) assert.throws(() => csrf(request(headers),secret));
});
test('body parsing enforces JSON object and actual streamed byte limit', async () => {
  const request = (body,type='application/json') => new Request('https://example.test', {method:'POST',headers:{'Content-Type':type},body});
  for (const body of ['null','[]','invalid','"test"',JSON.stringify({Notes:'x'.repeat(17000)})]) await assert.rejects(jsonBody(request(body)));
  await assert.rejects(jsonBody(request('{}','text/plain')));
  assert.deepEqual(await jsonBody(request('{"Duration":3}')), {Duration:3});
});
test('AES-GCM uses unique IVs, authenticates record IDs and detects tampering', () => {
  const bytes = randomBytes(32); globalThis.Netlify = {env:{get:()=>bytes.toString('hex')}};
  const data = valid(), id = 'test-record'; const a = seal(data,id), b = seal(data,id);
  assert.notEqual(a,b); assert.deepEqual(open(a,id),data); assert.ok(!a.includes(data.PatientName));
  assert.throws(()=>open(a,'other-record'));
  const parts = a.split('.'); const content = Buffer.from(parts[3],'base64'); content[0] ^= 1; parts[3] = content.toString('base64');
  assert.throws(()=>open(parts.join('.'),id));
  assert.equal(lookup(data.PatientId,data.NormalizedServiceCode),lookup(data.PatientId,data.NormalizedServiceCode.toLowerCase()));
  assert.notEqual(lookup(data.PatientId,data.NormalizedServiceCode),lookup('2234567890',data.NormalizedServiceCode));
  delete globalThis.Netlify; assert.throws(()=>seal(data,id)); assert.throws(()=>lookup(data.PatientId,data.NormalizedServiceCode));
});
test('sensitive responses cannot be cached', () => { assert.equal(response([]).headers.get('cache-control'),'no-store, private'); });
