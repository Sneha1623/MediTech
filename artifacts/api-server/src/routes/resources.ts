import { Router } from "express";
import { db } from "@workspace/db";
import { hospitalResourcesTable, bookingsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router = Router();

router.get("/resources/summary", async (_req, res) => {
  const resources = await db.select().from(hospitalResourcesTable);

  const totalHospitals = resources.length;
  const totalIcuBeds = resources.reduce((s, r) => s + r.icuBeds, 0);
  const availableIcuBeds = resources.reduce((s, r) => s + r.icuBedsAvailable, 0);
  const totalGeneralBeds = resources.reduce((s, r) => s + r.generalBeds, 0);
  const availableGeneralBeds = resources.reduce((s, r) => s + r.generalBedsAvailable, 0);
  const totalAmbulances = resources.reduce((s, r) => s + r.ambulancesTotal, 0);
  const availableAmbulances = resources.reduce((s, r) => s + r.ambulancesAvailable, 0);
  const totalOxygen = resources.reduce((s, r) => s + r.oxygenCylinders, 0);
  const availableOxygen = resources.reduce((s, r) => s + r.oxygenCylindersAvailable, 0);
  const totalDoctors = resources.reduce((s, r) => s + r.doctorsOnDuty, 0);

  const activeBookingsResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "dispatched"));
  const activeBookings = activeBookingsResult[0]?.count ?? 0;

  return res.json({
    totalHospitals,
    totalIcuBeds,
    availableIcuBeds,
    totalGeneralBeds,
    availableGeneralBeds,
    totalAmbulances,
    availableAmbulances,
    totalOxygen,
    availableOxygen,
    totalDoctors,
    activeBookings,
  });
});

export default router;
