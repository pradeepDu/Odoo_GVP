import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

function getRedisConfig(): { host: string; port: number } {
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

let redis: Redis | null = null;
let redisSub: Redis | null = null;

function createClient(): Redis {
  const config = getRedisConfig();
  return new Redis({
    host: config.host,
    port: config.port,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 200, 3000),
  });
}

/** Main Redis client for queue/list commands. */
export function getRedis(): Redis {
  if (!redis) redis = createClient();
  return redis;
}

/** Dedicated subscriber client (use only for SUBSCRIBE; cannot run other commands). */
export function getRedisSubscriber(): Redis {
  if (!redisSub) redisSub = createClient();
  return redisSub;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
  if (redisSub) {
    await redisSub.quit();
    redisSub = null;
  }
}

export const EMAIL_QUEUE_KEY = "fleetflow:email:queue";
export const EMAIL_DLQ_KEY = "fleetflow:email:dlq";
export const EMAIL_PROCESS_CHANNEL = "fleetflow:email:process";
