import { pgTable, text, integer, timestamp, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const records = pgTable('health_records', {
  id: text().primaryKey(), ownerId: text('owner_id').notNull(),
  lookupHash: text('lookup_hash').notNull().unique(), encrypted: text().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  pgPolicy('health_select', { for: 'select', using: sql`current_setting('app.role', true) = 'admin' OR (${table.ownerId} = current_setting('app.user_id', true) AND current_setting('app.role', true) = 'doctor') OR ${table.lookupHash} = current_setting('app.lookup_hash', true)` }),
  pgPolicy('health_insert', { for: 'insert', withCheck: sql`current_setting('app.role', true) IN ('admin', 'doctor') AND ${table.ownerId} = current_setting('app.user_id', true)` }),
  pgPolicy('health_update', { for: 'update', using: sql`current_setting('app.role', true) = 'admin' OR (${table.ownerId} = current_setting('app.user_id', true) AND current_setting('app.role', true) = 'doctor')`, withCheck: sql`current_setting('app.role', true) = 'admin' OR (${table.ownerId} = current_setting('app.user_id', true) AND current_setting('app.role', true) = 'doctor')` }),
  pgPolicy('health_delete', { for: 'delete', using: sql`current_setting('app.role', true) = 'admin' OR (${table.ownerId} = current_setting('app.user_id', true) AND current_setting('app.role', true) = 'doctor')` }),
]).enableRLS();
export const sessions = pgTable('app_sessions', {
  id: text().primaryKey(), userId: text('user_id').notNull(),
  csrfHash: text('csrf_hash').notNull(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const limits = pgTable('request_limits', {
  id: text().primaryKey(), count: integer().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const contacts = pgTable('contact_messages', { id: text().primaryKey(), encrypted: text().notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow() });
