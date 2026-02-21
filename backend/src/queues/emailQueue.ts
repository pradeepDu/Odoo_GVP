import { Queue } from "bullmq";
import { connection } from "./connection";

const EMAIL_QUEUE_NAME = "fleetflow-email";
const EMAIL_DLQ_NAME = "fleetflow-email-dlq";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500 },
  },
});

// DLQ for collecting failed jobs - processes in batches
export const emailDlqQueue = new Queue(EMAIL_DLQ_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 1, // Don't retry DLQ entries
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 }, // Keep some failed DLQ jobs for debugging
  },
});

export type EmailJobPayload = {
  tag: "forgot_password";
  type: "password_reset";
  email: string;
  resetToken: string;
};

/** Dead letter entry stored in DLQ for batch processing */
export type DlqEntry = {
  originalJob: EmailJobPayload;
  error: string;
  stack?: string;
  timestamp: string;
  attemptsMade: number;
  jobId?: string;
};

/**
 * Route drops the email request into the queue; worker processes with retries.
 * Non-blocking: returns immediately after queueing.
 */
export async function addPasswordResetEmail(
  email: string,
  resetToken: string,
): Promise<void> {
  await emailQueue.add(
    "email:forgot_password",
    {
      tag: "forgot_password",
      type: "password_reset",
      email,
      resetToken,
    } as EmailJobPayload,
    {
      priority: 1, // High priority
      removeOnComplete: { count: 100 },
      removeOnFail: false, // Keep failed jobs for DLQ processing
    },
  );
  console.log(`[Queue] Password reset email queued for ${email}`);
}

/**
 * Add a failed email job to the Dead Letter Queue.
 * DLQ worker will batch process these and send admin alerts.
 */
export async function addToDlq(entry: DlqEntry): Promise<void> {
  await emailDlqQueue.add("dlq:failed_email", entry, {
    priority: 1,
    removeOnComplete: { count: 100 },
  });
  console.log(`[DLQ] Failed job added to DLQ:`, entry.error.substring(0, 100));
}
