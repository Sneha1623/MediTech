import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hospitalsTable } from "./hospitals";

export const ambulanceStatusEnum = pgEnum("ambulance_status", ["available", "dispatched", "maintenance"]);
export const ambulanceTypeEnum = pgEnum("ambulance_type", ["basic", "advanced", "icu"]);

export const ambulancesTable = pgTable("ambulances", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => hospitalsTable.id, { onDelete: "cascade" }),
  vehicleNumber: text("vehicle_number").notNull(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
  status: ambulanceStatusEnum("status").notNull().default("available"),
  type: ambulanceTypeEnum("type").notNull().default("basic"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAmbulanceSchema = createInsertSchema(ambulancesTable).omit({ id: true, updatedAt: true });
export type InsertAmbulance = z.infer<typeof insertAmbulanceSchema>;
export type Ambulance = typeof ambulancesTable.$inferSelect;
