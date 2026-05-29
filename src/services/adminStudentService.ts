import { supabase } from "@/lib/supabase";

export const adminStudentService = {
    async getAllStudents() {
        const { data, error } = await (supabase as any)
            .from("student_master")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        if (error) throw error;

        return data ?? [];
    },

    async getStudentById(
        studentId: string,
    ) {
        const { data: profile, error: profileError } =
            await (supabase as any)
                .from("student_master")
                .select("*")
                .eq("student_id", studentId)
                .maybeSingle();

        if (profileError) throw profileError;

        const { data: academics } =
            await (supabase as any)
                .from("student_academic_details")
                .select("*")
                .eq("student_id", studentId)
                .maybeSingle();

        const { data: skills } =
            await (supabase as any)
                .from("student_skill_profile")
                .select("*")
                .eq("student_id", studentId)
                .maybeSingle();

        const { data: documents } =
            await (supabase as any)
                .from("student_documents")
                .select(`
      *,
      document_metadata:document_metadata_id (
        document_metadata_id,
        document_name,
        document_type,
        storage_url,
        version_number,
        created_at,
        is_active
      )
    `)
                .eq("student_id", studentId)
                .eq("is_active", true)
                .order("created_at", {
                    ascending: false,
                });

        return {
            profile,
            academics,
            skills,
            documents,
        };
    },
};