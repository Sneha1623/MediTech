import { pgTable, text, serial, real, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hospitalTypeEnum = pgEnum("hospital_type", ["government", "private", "trust"]);
export const hospitalStatusEnum = pgEnum("hospital_status", ["active", "inactive"]);

export const hospitalsTable = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  phone: text("phone").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  type: hospitalTypeEnum("type").notNull().default("private"),
  status: hospitalStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHospitalSchema = createInsertSchema(hospitalsTable).omit({ id: true, createdAt: true });
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitalsTable.$inferSelect;
