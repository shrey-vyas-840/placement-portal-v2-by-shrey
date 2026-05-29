import { supabase } from "@/lib/supabase";

export interface UserRole {
  user_role_id: string;
  user_id: string;
  role_id: string;
}

export const rbacService = {
  async getCurrentUserRole(
    authUserId: string,
  ) {
    const {
      data: account,
      error: accountError,
    } = await (supabase as any)
      .from("user_accounts")
      .select("user_id")
      .eq(
        "auth_provider_id",
        authUserId,
      )
      .maybeSingle();

    if (accountError)
      throw accountError;

    if (!account)
      return null;

    const {
      data: userRole,
      error: userRoleError,
    } = await (supabase as any)
      .from("user_roles")
      .select("*")
      .eq(
        "user_id",
        account.user_id,
      )
      .eq("is_active", true)
      .maybeSingle();

    if (userRoleError)
      throw userRoleError;

    if (!userRole)
      return null;

    const {
      data: role,
      error: roleError,
    } = await (supabase as any)
      .from("roles")
      .select(
        "role_id, role_name",
      )
      .eq(
        "role_id",
        userRole.role_id,
      )
      .maybeSingle();

    if (roleError)
      throw roleError;

    return role;
  },
};