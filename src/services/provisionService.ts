import { supabase } from "@/lib/supabase";

export async function ensureUserProvisioned() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  console.log("Provisioning started");

  const { data: existingUser } = await (supabase as any)
    .from("user_accounts")
    .select("user_id")
    .eq("auth_provider_id", user.id)
    .maybeSingle();

  if (existingUser) {
    console.log("user_account already exists");
    return;
  }

  console.log("Creating user_account");

  const { error } = await (supabase as any)
    .from("user_accounts")
    .insert({
      auth_provider_id: user.id,
      email_address: user.email,
      account_status: "Active",
      email_verified: true,
      created_by_type: "Auto Generated",
      is_active: true,
    });

  if (error) {
    console.error("USER ACCOUNT ERROR", error);
    throw error;
  }

  console.log("user_account created successfully");
}