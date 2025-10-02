import {
  pgTable,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
});

export const form = pgTable("forms", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").default(""),
});

export const fields = pgTable("fields", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  formId: varchar("form_id", { length: 36 })
    .notNull()
    .references(() => form.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  label: varchar("label", { length: 255 }).default(""),
  required: boolean("required").default(false),
  validation: jsonb("validation").default("{}"),
});

export const formSubmissions = pgTable("form_submissions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  formId: varchar("form_id", { length: 36 })
    .notNull()
    .references(() => form.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at").default(sql`now()`),
});

export const fieldAnswers = pgTable("field_answers", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id", { length: 36 })
    .notNull()
    .references(() => formSubmissions.id, { onDelete: "cascade" }),
  fieldId: varchar("field_id", { length: 36 })
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
});
