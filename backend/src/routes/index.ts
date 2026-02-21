import { Router } from "express";
import authRoutes from "./auth";
import dashboardRoutes from "./dashboard";
import vehicleRoutes from "./vehicles";
import driverRoutes from "./drivers";
import tripRoutes from "./trips";
import maintenanceRoutes from "./maintenance";
import fuelRoutes from "./fuel";
import analyticsRoutes from "./analytics";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/drivers", driverRoutes);
router.use("/trips", tripRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/fuel", fuelRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
