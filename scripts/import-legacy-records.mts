// Run with: node --import tsx scripts/import-legacy-records.mts --owner <Identity user ID> < private-export.json
// Supply the target database and encryption key through a trusted environment.
// No source endpoints or fallback connections are retained by the application.
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { database } from '../db/index.js';
import { records } from '../db/schema.js';
import { sql, eq } from 'drizzle-orm';
import { prepareLegacyImport } from '../lib/legacy-import.mjs';
import { open } from '../lib/security.mjs';

try {
  const args = process.argv.slice(2);
  if (args[0] !== '--owner' || !args[1] || args.length !== 2) throw new Error('Owner required');
  if (!process.env.HEALTH_DATA_KEY || !process.env.NETLIFY_DB_URL) throw new Error('Target environment not configured');
  // Adapt the environment for shared encryption helpers outside Functions.
  (globalThis as unknown as { Netlify: { env: { get: (name: string) => string | undefined } } }).Netlify = { env: { get: name => process.env[name] } };
  let bytes = 0; const chunks: Buffer[] = [];
  for await (const part of process.stdin) {
    const buffer = Buffer.from(part); bytes += buffer.length;
    if (bytes > 20 * 1024 * 1024) throw new Error('Input too large');
    chunks.push(buffer);
  }
  const source = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const prepared = prepareLegacyImport([source], args[1]);
  if (!prepared.rows.length) throw new Error('Empty import');
  const db = database();
  const result = await db.transaction(async tx => {
    await tx.execute(sql`select set_config('app.role', 'admin', true), set_config('app.user_id', ${args[1]}, true)`);
    let inserted = 0, retained = 0;
    for (const row of prepared.rows) {
      const [existing] = await tx.select().from(records).where(eq(records.lookupHash, row.lookupHash)).limit(1);
      if (existing) {
        // Verify that the existing record can be decrypted by the current key.
        // Abort on differing content rather than overwriting either version.
        const old = open(existing.encrypted, existing.id);
        const incoming = open(row.encrypted, row.id);
        const stable = (value: Record<string, unknown>) => JSON.stringify(Object.fromEntries(Object.entries(value).filter(([key]) => !['id', 'LegacyId'].includes(key)).sort(([a],[b]) => a.localeCompare(b))));
        if (stable(old) !== stable(incoming)) throw new Error('Existing record differs');
        retained++; continue;
      }
      await tx.insert(records).values(row);
      const [verified] = await tx.select().from(records).where(eq(records.id, row.id));
      if (!verified || JSON.stringify(open(verified.encrypted, verified.id)) !== JSON.stringify(open(row.encrypted, row.id))) throw new Error('Import verification failed');
      inserted++;
    }
    return { inserted, retained };
  });
  console.log(JSON.stringify({ success: true, ...result, sourceCount: prepared.inputCount, duplicates: prepared.duplicateCount }));
} catch {
  // Never print driver errors, source data, credentials, tokens or connection URLs.
  console.error('Import aborted. No partial transaction was saved. Check configuration and resolve conflicting source records privately.');
  process.exitCode = 1;
}
