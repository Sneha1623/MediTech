import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hospitalsTable } from "./hospitals";
import { ambulancesTable } from "./ambulances";

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "dispatched", "completed", "cancelled"]);
export const emergencyLevelEnum = pgEnum("emergency_level", ["critical", "moderate", "low"]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  destinationHospitalId: integer("destination_hospital_id").notNull().references(() => hospitalsTable.id),
  ambulanceId: integer("ambulance_id").references(() => ambulancesTable.id),
  status: bookingStatusEnum("status").notNull().default("pending"),
  emergency: emergencyLevelEnum("emergency").notNull().default("moderate"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
