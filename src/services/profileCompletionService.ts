import { documentService } from "./documentService";
import { studentService } from "./studentService";
import { academicService } from "./academicService";

import { supabase } from "@/lib/supabase";

export const profileCompletionService = {
  async getCompletion(authUserId: string) {
    try {
      const { data: account } = await (supabase as any)
        .from("user_accounts")
        .select("user_id")
        .eq("auth_provider_id", authUserId)
        .maybeSingle();

        console.log("COMPLETION ACCOUNT", account); 

      if (!account) {
        return {
          profile: false,
          resume: false,
          academics: false,
          skills: false,
          percentage: 0,
        };
      }

      const { data: profile } = await (supabase as any)
        .from("student_master")
        .select("*")
        .eq("user_id", account.user_id)
        .maybeSingle();
console.log("COMPLETION PROFILE", profile);
      const { data: academics } = await (supabase as any)
        .from("student_academic_details")
        .select("*")
        .eq("student_id", profile?.student_id)
        .maybeSingle();
        console.log("COMPLETION ACADEMICS", academics);

      const { data: skills } = await (supabase as any)
        .from("student_skill_profile")
        .select("*")
        .eq("student_id", profile?.student_id)
        .maybeSingle();

      const { data: resumeDocuments } = await (supabase as any)
        .from("student_documents")
        .select(
          `
    *,
    document_metadata (
      storage_url,
      document_type
    )
  `,
        )
        .eq("student_id", profile?.student_id)
        .eq("is_active", true);

      const resume = resumeDocuments?.find(
        (doc: any) => doc.document_metadata?.document_type === "Resume",
      );

      const profileComplete =
        !!profile?.first_name &&
        !!profile?.last_name &&
        !!profile?.enrollment_no &&
        !!profile?.contact_number;

      const academicsComplete = !!academics?.current_cgpa && !!academics?.graduation_year;

      const skillsComplete =
        !!skills?.technical_skills && !!skills?.programming_languages && !!skills?.linkedin_url;

      const resumeComplete = !!resume?.document_metadata?.storage_url;

      const completedModules = [
        profileComplete,
        academicsComplete,
        skillsComplete,
        resumeComplete,
      ].filter(Boolean).length;

      const percentage = Math.round((completedModules / 4) * 100);
console.log("PROFILE COMPLETE", profileComplete);
console.log("ACADEMICS COMPLETE", academicsComplete);
console.log("SKILLS COMPLETE", skillsComplete);
console.log("RESUME COMPLETE", resumeComplete);
console.log("PERCENTAGE", percentage);
      return {
        profile: profileComplete,
        academics: academicsComplete,
        skills: skillsComplete,
        resume: resumeComplete,
        percentage,
      };
    } catch (error) {
      console.error(error);

      return {
        profile: false,
        academics: false,
        skills: false,
        resume: false,
        percentage: 0,
      };
    }
  },
};
