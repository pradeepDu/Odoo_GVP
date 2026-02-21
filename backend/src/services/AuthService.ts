import bcrypt from "bcrypt";
import prisma from "../../config/prisma";
import { signToken } from "../middleware/auth";
import type { RoleName } from "@prisma/client";

const SALT_ROUNDS = 10;

export class AuthService {
  async register(email: string, password: string, name?: string, roleName?: RoleName) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Email already registered");
    }
    let role = await prisma.role.findFirst({ where: { name: roleName ?? "DISPATCHER" } });
    if (!role) {
      role = await prisma.role.findFirst({ where: {} }) ?? undefined;
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
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role?.name }, token };
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
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role?.name }, token };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error("Current password is incorrect");
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { ok: true };
  }
}
