import { pgTable, serial, text, timestamp, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("المسؤول"),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  token: text("token").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  username: text("username").notNull().default(""),
  success: boolean("success").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("login_attempts_ip_created_idx").on(t.ip, t.createdAt)]);

export const sickLeaves = pgTable("sick_leaves", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull(),
  patientId: text("patient_id").notNull(),
  serviceCode: text("service_code").notNull(),
  patientName: text("patient_name").notNull().default(""),
  hospital: text("hospital").notNull().default(""),
  doctorName: text("doctor_name").notNull().default(""),
  status: text("status").notNull().default("نشطة / سارية"),
  isCompanion: boolean("is_companion").notNull().default(false),
  fromDate: text("from_date").notNull().default(""),
  toDate: text("to_date").notNull().default(""),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("sick_leaves_service_code_idx").on(t.serviceCode),
  index("sick_leaves_patient_idx").on(t.patientId),
]);
