import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hospitalsTable } from "./hospitals";

export const hospitalResourcesTable = pgTable("hospital_resources", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitalsTable.id, { onDelete: "cascade" }),
  icuBeds: integer("icu_beds").notNull().default(0),
  icuBedsAvailable: integer("icu_beds_available").notNull().default(0),
  generalBeds: integer("general_beds").notNull().default(0),
  generalBedsAvailable: integer("general_beds_available").notNull().default(0),
  oxygenCylinders: integer("oxygen_cylinders").notNull().default(0),
  oxygenCylindersAvailable: integer("oxygen_cylinders_available").notNull().default(0),
  ambulancesTotal: integer("ambulances_total").notNull().default(0),
  ambulancesAvailable: integer("ambulances_available").notNull().default(0),
  doctorsOnDuty: integer("doctors_on_duty").notNull().default(0),
  ventilators: integer("ventilators").notNull().default(0),
  ventilatorsAvailable: integer("ventilators_available").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(hospitalResourcesTable).omit({ id: true, updatedAt: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type HospitalResource = typeof hospitalResourcesTable.$inferSelect;
