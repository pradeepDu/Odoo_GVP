import { Queue } from "bullmq";
import { connection } from "./connection";

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
