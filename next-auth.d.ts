import type { DefaultSession } from "next-auth";

type Role = "super_admin" | "host";

declare module "next-auth" {
  interface User {
    role?: Role;
  }
  // role is optional here so legacy sessions (pre-Phase-2) don't break.
  // After all old JWTs expire (maxAge=30d), this can be tightened to required.
  interface Session {
    user: { id: string; email: string; name: string; role?: Role } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
