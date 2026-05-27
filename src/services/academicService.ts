import { supabase } from "@/lib/supabase";

export const academicService = {
  async getAcademicDetails(
    studentId: string,
  ) {
    const { data, error } =
      await (supabase as any)
        .from(
          "student_academic_details",
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

  async saveAcademicDetails(
    payload: any,
  ) {
    const { data: existing } =
      await (supabase as any)
        .from(
          "student_academic_details",
        )
        .select("academic_id")
        .eq(
          "student_id",
          payload.student_id,
        )
        .maybeSingle();

    if (existing) {
      const { error } =
        await (supabase as any)
          .from(
            "student_academic_details",
          )
          .update({
            ...payload,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "academic_id",
            existing.academic_id,
          );

      if (error) {
        throw error;
      }

      return;
    }

    const { error } =
      await (supabase as any)
        .from(
          "student_academic_details",
        )
        .insert(payload);

    if (error) {
      throw error;
    }
  },
};