import { Worker } from "bullmq";
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

const worker = new Worker(
  "fleetflow-notifications",
  async (job) => {
    const { type, payload } = job.data as { type: string; payload: Record<string, unknown> };
    console.log(`[Worker] Processing job ${job.id}: ${type}`, payload);
    switch (type) {
      case "license_expiry_reminder":
        // In production: send email/push to safety officer
        console.log(`License expiry reminder for driver ${payload.driverId}`);
        break;
      case "maintenance_alert":
        console.log(`Maintenance alert for vehicle ${payload.vehicleId}`);
        break;
      case "trip_completed":
        console.log(`Trip ${payload.tripId} completed - cost-per-km can be updated`);
        break;
      default:
        console.log("Unknown job type:", type);
    }
  },
  { connection }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));

console.log("FleetFlow queue worker started. Waiting for jobs...");
