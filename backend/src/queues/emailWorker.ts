import dotenv from "dotenv";

dotenv.config({ path: "./.env", quiet: true });

import { Worker, Job, Queue } from "bullmq";
import { connection } from "./connection";
import {
  emailQueue,
  emailDlqQueue,
  addToDlq,
  type EmailJobPayload,
  type DlqEntry,
} from "./emailQueue";
import { EmailService } from "../services/EmailService";

const EMAIL_QUEUE_NAME = "fleetflow-email";
const EMAIL_DLQ_NAME = "fleetflow-email-dlq";
const emailService = new EmailService();

// Batch configuration for DLQ processing
const DLQ_BATCH_SIZE = 10; // Process up to 10 DLQ entries at once
const DLQ_BATCH_INTERVAL = 30000; // Process batch every 30 seconds

/**
 * Process main email jobs (forgot password, etc.)
 */
async function processEmailJob(
  job: Job<EmailJobPayload, void, string>,
): Promise<void> {
  const { tag } = job.data;

  console.log(`[EmailWorker] Processing job ${job.id} with tag: ${tag}`);

  // Process based on tag
  switch (tag) {
    case "forgot_password":
      if (job.data.type === "password_reset") {
        await emailService.sendPasswordResetEmail(
          job.data.email,
          job.data.resetToken,
        );
        console.log(
          `[EmailWorker] ✓ Password reset email sent to ${job.data.email}`,
        );
      }
      break;

    default:
      throw new Error(`Unknown email job tag: ${tag}`);
  }
}

/**
 * Process DLQ entries - sends batch alerts to admin
 */
async function processDlqJob(job: Job<DlqEntry, void, string>): Promise<void> {
  const entry = job.data;
  console.log(
    `[DLQWorker] Processing DLQ entry: ${entry.error.substring(0, 50)}...`,
  );

  // Send individual alert to admin about this failed job
  await emailService.sendDeadLetterAlert(entry);
  console.log(`[DLQWorker] ✓ Admin alert sent for failed job`);
}

// Main email worker - processes all regular email jobs
const emailWorker = new Worker<EmailJobPayload, void, string>(
  EMAIL_QUEUE_NAME,
  processEmailJob,
  {
    connection,
    concurrency: 5, // Process up to 5 emails concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per 1 second (rate limiting)
    },
  },
);

// DLQ worker - processes failed jobs and sends admin alerts
const dlqWorker = new Worker<DlqEntry, void, string>(
  EMAIL_DLQ_NAME,
  processDlqJob,
  {
    connection,
    concurrency: 2, // Process DLQ entries slowly
    limiter: {
      max: 5, // Max 5 DLQ alerts
      duration: 60000, // Per minute (don't spam admin)
    },
  },
);

// Email worker event handlers
emailWorker.on("failed", async (job, err) => {
  if (!job) return;

  const maxAttempts = job.opts.attempts ?? 3;
  console.error(
    `[EmailWorker] ✗ Job ${job.id} failed (attempt ${job.attemptsMade}/${maxAttempts}):`,
    err?.message,
  );

  // On final failure, add to DLQ
  if (job.attemptsMade >= maxAttempts) {
    await addToDlq({
      originalJob: job.data,
      error: err?.message ?? String(err),
      stack: err?.stack,
      timestamp: new Date().toISOString(),
      attemptsMade: job.attemptsMade,
      jobId: job.id,
    });
    console.error(
      `[EmailWorker] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`,
    );
  }
});

emailWorker.on("completed", (job) => {
  console.log(`[EmailWorker] ✓ Job ${job.id} (${job.data.tag}) completed`);
});

emailWorker.on("error", (err) => {
  console.error("[EmailWorker] Worker error:", err);
});

// DLQ worker event handlers
dlqWorker.on("completed", (job) => {
  console.log(`[DLQWorker] ✓ DLQ entry ${job.id} processed - admin alerted`);
});

dlqWorker.on("failed", (job, err) => {
  console.error(
    `[DLQWorker] ✗ Failed to process DLQ entry ${job?.id}:`,
    err?.message,
  );
  // Don't retry - just log it
});

dlqWorker.on("error", (err) => {
  console.error("[DLQWorker] Worker error:", err);
});

/**
 * Initialize both email and DLQ workers - exports for integration into main server
 */
export function startEmailWorker() {
  console.log("[EmailWorker] 🚀 Email worker started - processing email jobs");
  console.log("[DLQWorker] 🚀 DLQ worker started - monitoring failed jobs");
  return { emailWorker, dlqWorker };
}

/**
 * Graceful shutdown handler for both workers
 */
export async function stopEmailWorker(): Promise<void> {
  console.log("[Workers] Shutting down gracefully...");
  await Promise.all([emailWorker.close(), dlqWorker.close()]);
  console.log("[Workers] All workers stopped");
}

// Only start worker if this file is run directly (backward compatibility)
if (require.main === module) {
  startEmailWorker();

  process.on("SIGINT", async () => {
    await stopEmailWorker();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await stopEmailWorker();
    process.exit(0);
  });
}
