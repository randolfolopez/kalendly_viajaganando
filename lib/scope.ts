import { ObjectId } from "mongodb";
import type { Session } from "next-auth";
import type { Filter } from "mongodb";

type ScopedDoc = { userId?: ObjectId };

/**
 * Returns a MongoDB filter that scopes queries to the authenticated user's
 * own data — except for super_admin sessions, which see everything.
 *
 * Usage:
 *   const filter = userScopeFilter<EventTypeDoc>(session);
 *   const items = await collection.find(filter).toArray();
 *
 * - super_admin → {} (no scope, sees all rows)
 * - host        → { userId: ObjectId(session.user.id) }
 *
 * Generic over T so the returned Filter is assignable to the collection's
 * Filter<TDoc> shape without casts at the call site.
 */
export function userScopeFilter<T extends ScopedDoc>(session: Session): Filter<T> {
  if (session.user.role === "super_admin") return {} as Filter<T>;
  if (!session.user.id) return { userId: new ObjectId() } as Filter<T>; // defensive
  return { userId: new ObjectId(session.user.id) } as Filter<T>;
}

/**
 * Resolves the userId that NEW records (created by the current session) should
 * be associated with.
 *
 * - If `targetUserId` is provided, that wins (used by super_admin acting on
 *   behalf of a host from the global panel).
 * - Otherwise, defaults to the session's own user id.
 *
 * Note: super_admin creating records without targetUserId will associate them
 * with their own _id. That's acceptable for the migration period — once Bloque
 * 4 ships, the global panel will always pass a targetUserId.
 */
export function resolveOwnerId(session: Session, targetUserId?: string): ObjectId {
  if (targetUserId) return new ObjectId(targetUserId);
  if (!session.user.id) {
    throw new Error("Cannot resolve ownerId — session has no user.id");
  }
  return new ObjectId(session.user.id);
}
