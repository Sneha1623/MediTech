import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hospitalsRouter from "./hospitals";
import resourcesRouter from "./resources";
import ambulancesRouter from "./ambulances";
import bookingsRouter from "./bookings";
import analyticsRouter from "./analytics";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(hospitalsRouter);
router.use(resourcesRouter);
router.use(ambulancesRouter);
router.use(bookingsRouter);
router.use(analyticsRouter);
router.use(dashboardRouter);

export default router;
