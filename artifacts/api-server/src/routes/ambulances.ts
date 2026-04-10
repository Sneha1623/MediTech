import { Router } from "express";
import { db } from "@workspace/db";
import { ambulancesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListAmbulancesQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/ambulances", async (req, res) => {
  const parseResult = ListAmbulancesQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid params" });
  }

  const { hospitalId, status } = parseResult.data;

  let ambulances;
  if (hospitalId && status) {
    ambulances = await db.select().from(ambulancesTable).where(
      and(
        eq(ambulancesTable.hospitalId, hospitalId),
        eq(ambulancesTable.status, status as "available" | "dispatched" | "maintenance")
      )
    );
  } else if (hospitalId) {
    ambulances = await db.select().from(ambulancesTable).where(eq(ambulancesTable.hospitalId, hospitalId));
  } else if (status) {
    ambulances = await db.select().from(ambulancesTable).where(
      eq(ambulancesTable.status, status as "available" | "dispatched" | "maintenance")
    );
  } else {
    ambulances = await db.select().from(ambulancesTable);
  }

  return res.json(ambulances);
});

export default router;
