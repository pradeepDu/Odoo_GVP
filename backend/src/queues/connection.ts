import dotenv from "dotenv";

dotenv.config({ path: "./.env", quiet: true });

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

function getConfig(): { host: string; port: number } {
  try {
    const u = new URL(REDIS_URL);
    return {
      host: u.hostname || "127.0.0.1",
      port: u.port ? Number(u.port) : 6379,
    };
  } catch {
    return { host: "127.0.0.1", port: 6379 };
  }
}

/** Shared BullMQ Redis connection (same as notification queue). */
export const connection = getConfig();
