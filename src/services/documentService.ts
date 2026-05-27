import { supabase } from "@/lib/supabase";

export const documentService = {
    async getResume(studentId: string) {
        const { data, error } =
            await (supabase as any)
                .from("student_documents")
                .select(`
        student_document_id,
        document_metadata_id,
        document_metadata (
          document_metadata_id,
          storage_url,
          document_name,
          created_at
        )
      `)
                .eq("student_id", studentId)
                .eq("is_active", true)
                .order("created_at", {
                    ascending: false,
                })
                .limit(1)
                .maybeSingle();

        if (error) {
            throw error;
        }

        return data;
    },

    async saveResumeUrl(
        studentId: string,
        uploadedBy: string,
        resumeUrl: string,
    ) {
        const { data: existing } = await (supabase as any)
            .from("student_documents")
            .select(`
        student_document_id,
        document_metadata_id
      `)
            .eq("student_id", studentId)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();

        if (existing) {
            await (supabase as any)
                .from("student_documents")
                .update({
                    is_active: false,
                })
                .eq(
                    "student_document_id",
                    existing.student_document_id,
                );

            await (supabase as any)
                .from("document_metadata")
                .update({
                    is_active: false,
                })
                .eq(
                    "document_metadata_id",
                    existing.document_metadata_id,
                );
        }

        const { data: metadata, error: metadataError } =
            await (supabase as any)
                .from("document_metadata")
                .insert({
                    document_name: "Resume",
                    document_type: "Resume",
                    entity_name: "student_master",
                    entity_id: studentId,
                    storage_url: resumeUrl,
                    version_number: 1,
                    upload_timestamp: new Date().toISOString(),
                    uploaded_by: null,
                    created_by_type: "User",
                    is_active: true,
                })
                .select()
                .single();

        if (metadataError) {
            throw metadataError;
        }

        const { error: documentError } =
            await (supabase as any)
                .from("student_documents")
                .insert({
                    student_id: studentId,
                    document_metadata_id:
                        metadata.document_metadata_id,
                    verification_status: "Pending",
                    created_by_type: "User",
                    is_active: true,
                });

        if (documentError) {
            throw documentError;
        }
    },
};