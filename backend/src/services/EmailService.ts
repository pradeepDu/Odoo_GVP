import nodemailer from "nodemailer";
import type { DlqEntry } from "../queues/emailQueue";

const fromEmail =
  process.env.SMTP_USER || process.env.MAILER_USER || "mavinash422@gmail.com";
const fromName = "FleetFlow";
const adminEmail = process.env.ADMIN_EMAIL || fromEmail;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: fromEmail,
    pass: process.env.SMTP_PASS || process.env.MAILER_PASS || "",
  },
});

export class EmailService {
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Password Reset Request - FleetFlow",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #2563eb; text-decoration: none; border-radius: 6px; margin: 20px 0; border: 2px solid #2563eb; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚛 FleetFlow</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password for your FleetFlow account. Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br><strong>FleetFlow Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FleetFlow - Fleet & Logistics Management</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - FleetFlow
        
        Hello,
        
        We received a request to reset your password. Click the link below to reset your password:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        FleetFlow Team
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  }

  /**
   * Send alert to admins about failed email job in DLQ
   */
  async sendDeadLetterAlert(entry: DlqEntry): Promise<void> {
    const originalJob = entry.originalJob;
    const payloadInfo =
      originalJob.tag === "forgot_password"
        ? `Forgot Password Email to: ${originalJob.email}`
        : `Email Type: ${originalJob.type}`;

    const mailOptions = {
      from: `"${fromName} Alerts" <${fromEmail}>`,
      to: adminEmail,
      subject: `🚨 FleetFlow - Failed Email Job Alert`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .error-box { background-color: #fee; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; font-family: monospace; font-size: 13px; }
            .info-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Failed Email Job</h1>
            </div>
            <div class="content">
              <h2>Dead Letter Queue Alert</h2>
              
              <div class="info-box">
                <p><strong>Timestamp:</strong> ${entry.timestamp}</p>
                <p><strong>Job ID:</strong> ${entry.jobId || "N/A"}</p>
                <p><strong>Job Tag:</strong> ${originalJob.tag}</p>
                <p><strong>Job Type:</strong> ${originalJob.type}</p>
                <p><strong>Attempts Made:</strong> ${entry.attemptsMade}</p>
                <p><strong>${payloadInfo}</strong></p>
              </div>
              
              <div class="error-box">
                <strong>Error:</strong><br>
                ${entry.error}
                ${entry.stack ? `<br><br><strong>Stack Trace:</strong><br>${entry.stack.replace(/\n/g, "<br>")}` : ""}
              </div>
              
              <p>This email job has failed after <strong>${entry.attemptsMade} retry attempts</strong> and has been moved to the Dead Letter Queue.</p>
              <p>Please investigate and take appropriate action.</p>
              
              <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
                <strong>Original Job Details:</strong><br>
                <code style="background: #f3f4f6; padding: 8px; display: block; margin-top: 8px; border-radius: 4px;">
                  ${JSON.stringify(originalJob, null, 2).replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")}
                </code>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FleetFlow - Automated Alert System</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Dead Letter Queue Alert - FleetFlow
        
        Timestamp: ${entry.timestamp}
        Job ID: ${entry.jobId || "N/A"}
        Job Tag: ${originalJob.tag}
        Job Type: ${originalJob.type}
        Attempts Made: ${entry.attemptsMade}
        ${payloadInfo}
        
        Error: ${entry.error}
        ${entry.stack ? `\n\nStack Trace:\n${entry.stack}` : ""}
        
        Original Job Details:
        ${JSON.stringify(originalJob, null, 2)}
        
        This email job has failed after ${entry.attemptsMade} retry attempts.
        Please investigate and take appropriate action.
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[DLQ] Alert sent to admin about failed email job`);
    } catch (error) {
      console.error(`[DLQ] Failed to send admin alert:`, error);
      // Don't throw - we don't want DLQ processing to fail
    }
  }
}
