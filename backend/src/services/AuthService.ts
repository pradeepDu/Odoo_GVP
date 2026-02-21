import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../../config/prisma";
import { signToken } from "../middleware/auth";
import type { RoleName } from "@prisma/client";
import { EmailService } from "./EmailService";

const SALT_ROUNDS = 10;
const emailService = new EmailService();

export class AuthService {
  async register(
    email: string,
    password: string,
    name?: string,
    roleName?: RoleName,
  ) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Email already registered");
    }
    let role = await prisma.role.findFirst({
      where: { name: roleName ?? "DISPATCHER" },
    });
    if (!role) {
      role = (await prisma.role.findFirst({ where: {} })) ?? undefined;
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name ?? null,
        roleId: role?.id ?? null,
      },
      include: { role: true },
    });
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role?.name ?? "DISPATCHER",
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user) {
      throw new Error("Invalid email or password");
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid email or password");
    }
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role?.name ?? "DISPATCHER",
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name,
      },
      token,
    };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error("Current password is incorrect");
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { ok: true };
  }

  async forgotPassword(email: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      // Always return success to prevent email enumeration attacks
      if (!user) {
        console.log(
          `Password reset requested for non-existent email: ${email}`,
        );
        return {
          message: "If that email exists, a password reset link has been sent",
        };
      }

      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Invalidate any existing tokens for this user
      await prisma.passwordReset.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      // Create new password reset token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt,
        },
      });

      // Send email with the unhashed token
      await emailService.sendPasswordResetEmail(email, resetToken);

      return {
        message: "If that email exists, a password reset link has been sent",
      };
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to process password reset",
      );
    }
  }

  async resetPassword(token: string, newPassword: string) {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new Error("Invalid or expired reset token");
    }

    if (resetRecord.used) {
      throw new Error("This reset link has already been used");
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new Error("This reset link has expired");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    return { message: "Password has been reset successfully" };
  }

  async verifyResetToken(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
    });

    if (!resetRecord) {
      return { valid: false, message: "Invalid reset token" };
    }

    if (resetRecord.used) {
      return { valid: false, message: "This reset link has already been used" };
    }

    if (resetRecord.expiresAt < new Date()) {
      return { valid: false, message: "This reset link has expired" };
    }

    return { valid: true, message: "Token is valid" };
  }
}
