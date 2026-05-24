import { supabase } from "@/lib/supabase";
import type { StudentMaster, StudentMasterUpdate } from "@/types/student";

/**
 * Student profile service. Reads/writes go through `student_master`
 * scoped to the signed-in user. RLS is the source of truth — these
 * helpers do NOT bypass policies.
 */
export const studentService = {
    async getProfileByUserId(
    authUserId: string,
  ): Promise<StudentMaster | null> {

    const { data: account, error: accountError } =
      await (supabase as any)
        .from("user_accounts")
        .select("user_id")
        .eq("auth_provider_id", authUserId)
        .maybeSingle();

    if (accountError) {
      throw accountError;
    }

    if (!account) {
      return null;
    }

    const { data, error } =
      await (supabase as any)
        .from("student_master")
        .select("*")
        .eq("user_id", account.user_id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as StudentMaster | null) ?? null;
  },
  async updateProfile(
    id: string,
    patch: StudentMasterUpdate,
  ): Promise<StudentMaster> {
    const { data, error } = await (supabase as any)
      .from("student_master")
      .update(patch)
      .eq("student_id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data as StudentMaster;
  },
};
