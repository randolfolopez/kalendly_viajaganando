import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { users, availability, ensureIndexes } from "./collections";
import { env } from "./env";
import type { UserDoc } from "./types";

let bootstrapped = false;
const BCRYPT_ROUNDS = 10;

export async function bootstrap() {
  if (bootstrapped) return;
  await ensureIndexes();

  const userCol = await users();
  const existing = await userCol.findOne({ email: env().ADMIN_EMAIL });

  if (!existing) {
    // Fresh install — create the super_admin from env vars
    const userId = new ObjectId();
    const passwordHash = await bcrypt.hash(env().ADMIN_PASSWORD, BCRYPT_ROUNDS);

    await userCol.insertOne({
      _id: userId,
      email: env().ADMIN_EMAIL,
      name: "Admin",
      bio: null,
      defaultTimezone: "UTC",
      passwordHash,
      role: "super_admin",
      slug: null,
      active: true,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const availCol = await availability();
    await availCol.insertOne({
      _id: new ObjectId(),
      userId,
      timezone: "UTC",
      weeklyHours: [
        { dayOfWeek: 0, intervals: [] },
        { dayOfWeek: 1, intervals: [{ start: "09:00", end: "17:00" }] },
        { dayOfWeek: 2, intervals: [{ start: "09:00", end: "17:00" }] },
        { dayOfWeek: 3, intervals: [{ start: "09:00", end: "17:00" }] },
        { dayOfWeek: 4, intervals: [{ start: "09:00", end: "17:00" }] },
        { dayOfWeek: 5, intervals: [{ start: "09:00", end: "17:00" }] },
        { dayOfWeek: 6, intervals: [] },
      ],
      dateOverrides: [],
      updatedAt: new Date(),
    });
  } else {
    // Migration path — backfill new fields on existing user (idempotent)
    const updates: Partial<UserDoc> = {};
    const e = existing as Partial<UserDoc>;

    if (!e.passwordHash) {
      updates.passwordHash = await bcrypt.hash(env().ADMIN_PASSWORD, BCRYPT_ROUNDS);
    }
    if (!e.role) updates.role = "super_admin";
    if (e.slug === undefined) updates.slug = null;
    if (typeof e.active !== "boolean") updates.active = true;
    if (e.createdBy === undefined) updates.createdBy = null;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await userCol.updateOne({ _id: existing._id }, { $set: updates });
    }
  }

  bootstrapped = true;
}
