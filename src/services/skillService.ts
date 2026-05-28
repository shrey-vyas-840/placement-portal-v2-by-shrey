import { supabase } from "@/lib/supabase";

export const skillService = {
  async getSkillProfile(
    studentId: string,
  ) {
    const { data, error } =
      await (supabase as any)
        .from(
          "student_skill_profile",
        )
        .select("*")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },

  async saveSkillProfile(
    payload: any,
  ) {
    const { data: existing } =
      await (supabase as any)
        .from(
          "student_skill_profile",
        )
        .select("skill_profile_id")
        .eq(
          "student_id",
          payload.student_id,
        )
        .maybeSingle();

    if (existing) {
      const { error } =
        await (supabase as any)
          .from(
            "student_skill_profile",
          )
          .update({
            ...payload,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "skill_profile_id",
            existing.skill_profile_id,
          );

      if (error) {
        throw error;
      }

      return;
    }

    const { error } =
      await (supabase as any)
        .from(
          "student_skill_profile",
        )
        .insert(payload);

    if (error) {
      throw error;
    }
  },
};