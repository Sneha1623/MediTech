import { pgTable, serial, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskLevelEnum = pgEnum("risk_level", ["high", "medium", "low"]);
export const alertSeverityEnum = pgEnum("alert_severity", ["critical", "warning", "info"]);

export const emergencyHotspotsTable = pgTable("emergency_hotspots", {
  id: serial("id").primaryKey(),
  area: text("area").notNull(),
  city: text("city").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull().default("medium"),
  incidentCount: integer("incident_count").notNull().default(0),
  predictedDemand: integer("predicted_demand").notNull().default(0),
  description: text("description").notNull(),
});

export const analyticsTable = pgTable("analytics_trends", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(),
  emergencyCalls: integer("emergency_calls").notNull().default(0),
  ambulancesDispatched: integer("ambulances_dispatched").notNull().default(0),
  avgResponseTime: real("avg_response_time").notNull().default(0),
  criticalCases: integer("critical_cases").notNull().default(0),
});

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: alertSeverityEnum("severity").notNull().default("info"),
  hospitalId: integer("hospital_id"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHotspotSchema = createInsertSchema(emergencyHotspotsTable).omit({ id: true });
export type InsertHotspot = z.infer<typeof insertHotspotSchema>;
export type EmergencyHotspot = typeof emergencyHotspotsTable.$inferSelect;

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
