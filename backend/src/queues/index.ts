import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config({ path: "./.env", quiet: true });

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let connection: { host: string; port: number };
try {
  const u = new URL(REDIS_URL);
  connection = { host: u.hostname || "127.0.0.1", port: u.port ? Number(u.port) : 6379 };
} catch {
  connection = { host: "127.0.0.1", port: 6379 };
}

export const notificationQueue = new Queue("fleetflow-notifications", { connection });

export async function notifyLicenseExpiryReminder(driverId: number, driverName: string, expiry: Date) {
  await notificationQueue.add(
    "license_expiry_reminder",
    { driverId, driverName, expiry: expiry.toISOString() },
    { delay: 0 }
  );
}

export async function notifyMaintenanceAlert(vehicleId: number, vehicleName: string) {
  await notificationQueue.add("maintenance_alert", { vehicleId, vehicleName }, { delay: 0 });
}

export async function notifyTripCompleted(tripId: number, vehicleId: number) {
  await notificationQueue.add("trip_completed", { tripId, vehicleId }, { delay: 0 });
}
