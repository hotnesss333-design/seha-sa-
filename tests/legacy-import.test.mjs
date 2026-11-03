import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { prepareLegacyImport } from '../lib/legacy-import.mjs';
import { open } from '../lib/security.mjs';
const legacy = () => ({id:'legacy-id',PatientId:'1234567890',NormalizedServiceCode:'GSL123456789012',PatientName:'Test patient',Notes:'Preserved notes',CreatedAt:'2026-01-01',extraLegacyField:'retained'});
test('imports legacy fields without loss, preserves originals and deduplicates identical backups', () => {
  const secret = randomBytes(32).toString('hex'); globalThis.Netlify = {env:{get:()=>secret}};
  try {
    const record = legacy(); const before = JSON.stringify(record);
    const result = prepareLegacyImport([[record],[{...record}]],'owner-id');
    assert.equal(result.inputCount,2); assert.equal(result.rows.length,1); assert.equal(result.duplicateCount,1);
    assert.equal(JSON.stringify(record),before);
    const row=result.rows[0]; const restored=open(row.encrypted,row.id);
    assert.equal(restored.LegacyId,record.id); assert.equal(restored.extraLegacyField,record.extraLegacyField); assert.equal(restored.Notes,record.Notes); assert.equal(row.ownerId,'owner-id');
    assert.equal(restored.id,row.id); assert.notEqual(restored.id,record.id);
  } finally {delete globalThis.Netlify;}
});
test('aborts conflicting or invalid imports rather than silently dropping records', () => {
  const secret=randomBytes(32).toString('hex'); globalThis.Netlify={env:{get:()=>secret}};
  try {
    assert.throws(()=>prepareLegacyImport([[legacy(),{...legacy(),Notes:'different'}]],'owner-id'));
    assert.throws(()=>prepareLegacyImport([[legacy(),{...legacy(),PatientId:''}]],'owner-id'));
    assert.throws(()=>prepareLegacyImport([{}],'owner-id'));
  } finally {delete globalThis.Netlify;}
});
