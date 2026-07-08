import type { Session, User } from "@supabase/supabase-js";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
}
