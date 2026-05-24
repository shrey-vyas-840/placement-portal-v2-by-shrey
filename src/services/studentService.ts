import { supabase } from "@/lib/supabase";
import type { StudentMaster, StudentMasterUpdate } from "@/types/student";

/**
 * Student profile service. Reads/writes go through `student_master`
 * scoped to the signed-in user. RLS is the source of truth — these
 * helpers do NOT bypass policies.
 */
export const studentService = {
  async getProfileByUserId(userId: string): Promise<StudentMaster | null> {
    // Using `from<any>` until the generated Database type includes
    // the institutional tables. Replace once types are regenerated.
    const { data, error } = await (supabase as any)
      .from("student_master")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
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
