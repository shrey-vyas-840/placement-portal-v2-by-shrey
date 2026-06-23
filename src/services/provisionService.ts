import { supabase } from "@/lib/supabase";
import { canAccessPortal, normalizeEmail } from "@/services/identityPolicyService";

export async function ensureUserProvisioned() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  if (!canAccessPortal(user.email)) {
    throw new Error("Portal access required");
  }

  const normalizedEmail = normalizeEmail(user.email);

  const { data: existingUser } = await (supabase as any)
    .from("user_accounts")
    .select("user_id")
    .eq("auth_provider_id", user.id)
    .maybeSingle();

  if (existingUser) {
    return;
  }

  const { error } = await (supabase as any).from("user_accounts").insert({
    auth_provider_id: user.id,
    email_address: normalizedEmail,
    account_status: "Active",
    email_verified: true,
    created_by_type: "Auto Generated",
    is_active: true,
  });

  if (error) {
    console.error("USER ACCOUNT ERROR", error);
    throw error;
  }
}
