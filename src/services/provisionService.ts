import { supabase } from "@/lib/supabase";
import { canAccessPortal } from "@/services/identityPolicyService";

export async function ensureUserProvisioned() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  if (!canAccessPortal(user.email)) {
    throw new Error("Portal access required");
  }

  // Authentication verification only.
  // Student provisioning is performed exclusively after
  // admin approval by studentProvisioningService.ts.

  return;
}