import { pgTable, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

// Stores both sick leave records and companion records (distinguished by
// isCompanion), mirroring the flexible record shape the dashboard already
// sends. Full payload is kept in `data` so no field the UI relies on is lost.
export const sickLeaves = pgTable("sick_leaves", {
  id: text("id").primaryKey(),
  normalizedServiceCode: text("normalized_service_code"),
  patientId: text("patient_id"),
  isCompanion: boolean("is_companion").notNull().default(false),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
