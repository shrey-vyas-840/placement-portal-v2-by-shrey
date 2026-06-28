import { supabase } from "@/lib/supabase";
import { canAccessPortal } from "@/services/identityPolicyService";

export async function ensureUserProvisioned() {
  console.log(">>>>>>>> ENTERED ensureUserProvisioned <<<<<<<<");
  const {
    data: { user },
  } = await supabase.auth.getUser();
console.log("========== ENSURE USER PROVISIONED ==========");
console.log("AUTH USER", user);
  if (!user) {
    return;
  }

  if (!canAccessPortal(user.email)) {
  throw new Error("Portal access required");
}

const { data: existingAccount, error: lookupError } = await (supabase as any)
.from("user_accounts")
.select("user_id, auth_provider_id")
.eq("email_address", user.email)
.maybeSingle();

console.log("USER ACCOUNT LOOKUP", existingAccount);
console.log("LOOKUP ERROR", lookupError);

if (lookupError) {
  throw lookupError;
}
console.log("SHOULD LINK?", {
  exists: !!existingAccount,
  authProviderId: existingAccount?.auth_provider_id,
});
if (
  existingAccount &&
  !existingAccount.auth_provider_id
) {
  console.log("LINKING AUTH PROVIDER", {
    email: user.email,
    authProviderId: user.id,
  });
  const { data: updatedAccount, error: updateError } = await (supabase as any)
  .from("user_accounts")
  .update({
    auth_provider_id: user.id,
  })
  .eq("user_id", existingAccount.user_id)
  .select("user_id, auth_provider_id")
  .single();
  
  console.log("UPDATED ACCOUNT", updatedAccount);
  console.log("UPDATE ERROR", updateError);
  if (updateError) {
    throw updateError;
  }

  if (updatedAccount.auth_provider_id !== user.id) {
    throw new Error("Failed to verify auth_provider_id linkage.");
  }

  console.log("AUTH PROVIDER LINKED", updatedAccount);
}

return;
}
