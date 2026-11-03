import { randomUUID } from 'node:crypto';
import { identifiers, lookup, seal } from './security.mjs';

// Preparation is separate from insertion: any malformed record aborts the entire
// import before the database is changed. Legacy fields are retained encrypted.
export function prepareLegacyImport(sources, ownerId) {
  if (!Array.isArray(sources) || !sources.length || typeof ownerId !== 'string' || !ownerId) throw new Error('Invalid import configuration');
  const rows = new Map();
  let inputCount = 0, duplicateCount = 0;
  for (const source of sources) {
    if (!Array.isArray(source)) throw new Error('Each source must be an array of records');
    for (const legacy of source) {
      inputCount++;
      if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) throw new Error('Invalid legacy record');
      const [patient, code] = identifiers(legacy.PatientId, legacy.NormalizedServiceCode);
      const hash = lookup(patient, code);
      const previous = rows.get(hash);
      if (previous) {
        // Never silently discard divergent versions of the same record.
        const ordered = value => JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b]) => a.localeCompare(b))));
        if (ordered(previous.original) !== ordered(legacy)) throw new Error('Conflicting legacy records require review before import');
        duplicateCount++; continue;
      }
      const id = randomUUID();
      const data = { ...legacy, LegacyId: legacy.id ?? null, id };
      rows.set(hash, { original: legacy, row: { id, ownerId, lookupHash: hash, encrypted: seal(data, id) } });
    }
  }
  return { rows: [...rows.values()].map(value => value.row), inputCount, duplicateCount };
}
