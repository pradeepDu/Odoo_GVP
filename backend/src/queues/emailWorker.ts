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

// Batch configuration
const EMAIL_BATCH_SIZE = 100; // Process up to 100 emails at once
const EMAIL_BATCH_TIMEOUT = 2000; // Or process after 2 seconds
const DLQ_BATCH_SIZE = 100; // Process up to 100 DLQ entries at once
const DLQ_BATCH_TIMEOUT = 2000; // Or process after 2 seconds

// Track batch processing stats
let emailBatchCount = 0;
let emailBatchStartTime = Date.now();
let dlqBatchCount = 0;
let dlqBatchStartTime = Date.now();

/**
 * Process main email jobs (forgot password, etc.)
 */
async function processEmailJob(
  job: Job<EmailJobPayload, void, string>,
): Promise<void> {
  const { tag } = job.data;

  // Increment batch counter
  emailBatchCount++;
  const batchElapsed = Date.now() - emailBatchStartTime;

  // Log batch progress (simple counter, no timing)
  console.log(
    `[EmailWorker] 📧 Processing: ${emailBatchCount}/${EMAIL_BATCH_SIZE}`,
  );

  // Process based on tag
  switch (tag) {
    case "forgot_password":
      if (job.data.type === "password_reset") {
        await emailService.sendPasswordResetEmail(
          job.data.email,
          job.data.resetToken,
        );
      }
      break;

    default:
      throw new Error(`Unknown email job tag: ${tag}`);
  }

  // Reset batch counter if batch size reached or timeout exceeded
  if (
    emailBatchCount >= EMAIL_BATCH_SIZE ||
    batchElapsed >= EMAIL_BATCH_TIMEOUT
  ) {
    console.log(
      `[EmailWorker] ✓ Batch complete: ${emailBatchCount} emails sent in ${batchElapsed}ms\n`,
    );
    emailBatchCount = 0;
    emailBatchStartTime = Date.now();
  }
}

/**
 * Process DLQ entries - sends batch alerts to admin
 */
async function processDlqJob(job: Job<DlqEntry, void, string>): Promise<void> {
  const entry = job.data;

  // Increment batch counter
  dlqBatchCount++;
  const batchElapsed = Date.now() - dlqBatchStartTime;

  // Log batch progress (simple counter, no timing)
  console.log(`[DLQWorker] 🚨 Processing: ${dlqBatchCount}/${DLQ_BATCH_SIZE}`);

  // Send individual alert to admin about this failed job
  await emailService.sendDeadLetterAlert(entry);

  // Reset batch counter if batch size reached or timeout exceeded
  if (dlqBatchCount >= DLQ_BATCH_SIZE || batchElapsed >= DLQ_BATCH_TIMEOUT) {
    console.log(
      `[DLQWorker] ✓ Batch complete: ${dlqBatchCount} DLQ alerts sent in ${batchElapsed}ms\n`,
    );
    dlqBatchCount = 0;
    dlqBatchStartTime = Date.now();
  }
}

// Main email worker - processes all regular email jobs
const emailWorker = new Worker<EmailJobPayload, void, string>(
  EMAIL_QUEUE_NAME,
  processEmailJob,
  {
    connection,
    concurrency: 50, // Process up to 50 emails concurrently for batch-like behavior
    limiter: {
      max: EMAIL_BATCH_SIZE, // Max batch size
      duration: EMAIL_BATCH_TIMEOUT, // Time window for batch
    },
  },
);

// DLQ worker - processes failed jobs and sends admin alerts
const dlqWorker = new Worker<DlqEntry, void, string>(
  EMAIL_DLQ_NAME,
  processDlqJob,
  {
    connection,
    concurrency: 20, // Process up to 20 DLQ entries concurrently
    limiter: {
      max: DLQ_BATCH_SIZE, // Max batch size
      duration: DLQ_BATCH_TIMEOUT, // Time window for batch
    },
  },
);

// Email worker event handlers
emailWorker.on("failed", async (job, err) => {
  if (!job) return;

  const maxAttempts = job.opts.attempts ?? 3;

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
  }
});

emailWorker.on("error", (err) => {
  console.error("[EmailWorker] Worker error:", err);
});

// DLQ worker event handlers
dlqWorker.on("error", (err) => {
  console.error("[DLQWorker] Worker error:", err);
});

/**
 * Initialize both email and DLQ workers - exports for integration into main server
 */
export async function startEmailWorker() {
  console.log("\n[Queue System] 🚀 Starting email queue workers...");
  console.log("[EmailWorker] ✓ Email worker started (batch: 100 jobs or 2s)");
  console.log("[DLQWorker] ✓ DLQ worker started (batch: 100 jobs or 2s)");
  console.log("[Queue System] Ready for batch processing\n");

  // Note: Periodic stats logger disabled - using real-time logs instead
  // Uncomment below to enable periodic health checks every 2 minutes
  // startQueueStatsLogger();

  return { emailWorker, dlqWorker };
}

/**
 * Periodic queue statistics logger - shows batch processing info
 */
let statsInterval: NodeJS.Timeout | null = null;

function startQueueStatsLogger() {
  // Log stats every 2 minutes
  statsInterval = setInterval(async () => {
    try {
      const emailCounts = await emailQueue.getJobCounts();
      const dlqCounts = await emailDlqQueue.getJobCounts();

      console.log("\n" + "─".repeat(60));
      console.log(
        `[Queue Stats] 📊 Periodic Health Check - ${new Date().toLocaleTimeString()}`,
      );
      console.log("─".repeat(60));
      console.log(
        `[EmailQueue] Waiting: ${emailCounts.waiting} | Active: ${emailCounts.active} | Completed: ${emailCounts.completed} | Failed: ${emailCounts.failed}`,
      );
      console.log(
        `[DLQ Queue] Waiting: ${dlqCounts.waiting} | Active: ${dlqCounts.active} | Completed: ${dlqCounts.completed} | Failed: ${dlqCounts.failed}`,
      );

      // Show batch processing info if there are jobs
      if (emailCounts.waiting > 0) {
        console.log(
          `[EmailQueue] ⏳ ${emailCounts.waiting} jobs queued for batch processing`,
        );
      }
      if (dlqCounts.waiting > 0) {
        console.log(
          `[DLQ Queue] ⚠️  ${dlqCounts.waiting} failed jobs awaiting admin review`,
        );
      }

      console.log("─".repeat(60) + "\n");
    } catch (error) {
      console.error("[Queue Stats] Error fetching stats:", error);
    }
  }, 120000); // Every 2 minutes

  console.log(
    "[Queue Stats] 📊 Periodic stats logger started (every 2 minutes)\n",
  );
}

/**
 * Graceful shutdown handler for both workers
 */
export async function stopEmailWorker(): Promise<void> {
  console.log("\n[Workers] Shutting down gracefully...");

  // Stop stats logger
  if (statsInterval) {
    clearInterval(statsInterval);
    console.log("[Queue Stats] Stats logger stopped");
  }

  // Close workers
  await Promise.all([emailWorker.close(), dlqWorker.close()]);
  console.log("[Workers] All workers stopped\n");
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
