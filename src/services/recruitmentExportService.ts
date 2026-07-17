import { supabase } from "@/lib/supabase";

export interface RecruitmentExportRow {
  applicationId: string;

  studentId: string;

  enrollmentNumber: string;

  studentName: string;

  instituteEmail: string;

  personalEmail: string;

  contactNumber: string;

  alternateContactNumber: string;

  gender: string;

  dateOfBirth: string;

  placementPreference: string;

  placementStatus: string;

  institute: string;

  degree: string;

  branch: string;

  semester: number | null;

  cgpa: number | null;

  tenthPercentage: number | null;

  twelfthPercentage: number | null;

  diplomaPercentage: number | null;

  activeBacklogs: number | null;

  yearGapCount: number | null;

  graduationYear: number | null;

  technicalSkills: string;

  programmingLanguages: string;

  toolsAndTechnologies: string;

  github: string;

  linkedin: string;

  portfolio: string;

  strengths: string;

  profileScore: number | null;

  applicationStatus: string;

  appliedAt: string;

  remarks: string;

  appliedRoles: string;

  answers: Record<string, any>;
}

export interface RecruitmentExportData {
  companyName: string;

  rows: RecruitmentExportRow[];

  dynamicQuestions: string[];
}

export const recruitmentExportService = {
  async getRecruitmentExportData(opportunityId: string): Promise<RecruitmentExportData> {
    const { data: applications, error } = await (supabase as any)

      .from("student_opportunity_applications")

      .select("*")

      .eq("opportunity_id", opportunityId)

      .order("applied_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    if (!applications?.length) {
      return {
        companyName: "",

        rows: [],

        dynamicQuestions: [],
      };
    }

    const studentIds = applications.map((x: any) => x.student_id);

    const applicationIds = applications.map((x: any) => x.application_id);

    const [profiles, academics, skills, questions, answers, selectedRoles, opportunity] =
      await Promise.all([
        (supabase as any)

          .from("student_master")

          .select("*")

          .in("student_id", studentIds),

        (supabase as any)

          .from("student_academic_details")

          .select("*")

          .in("student_id", studentIds),

        (supabase as any)

          .from("student_skill_profile")

          .select("*")

          .in("student_id", studentIds),

        (supabase as any)

          .from("opportunity_questions")

          .select("*")

          .eq("opportunity_id", opportunityId)

          .order("position"),

        (supabase as any)

          .from("opportunity_question_answers")

          .select("*")

          .in("application_id", applicationIds),

        (supabase as any)

          .from("student_application_selected_roles")

          .select(
            `
          application_id,
          preference_order,

          drive_roles (
            drive_role_name
          )
        `,
          )

          .in("application_id", applicationIds),

        (supabase as any)

          .from("opportunity_master")

          .select(
            `
    opportunity_title,

    drive_master (
      company_id
    )
  `,
          )

          .eq("opportunity_id", opportunityId)

          .single(),
      ]);

    let companyName = "";

    const companyId = opportunity.data?.drive_master?.company_id;

    if (companyId) {
      const { data: company } = await (supabase as any)

        .from("company_master")

        .select("company_name")

        .eq("company_id", companyId)

        .single();

      companyName = company?.company_name ?? "";
    }
    const rows = await Promise.all(
      applications.map(async (application: any) => {
        const profile =
          profiles.data?.find((x: any) => x.student_id === application.student_id) ?? null;

        const academic =
          academics.data?.find((x: any) => x.student_id === application.student_id) ?? null;

        const skill =
          skills.data?.find((x: any) => x.student_id === application.student_id) ?? null;

        const roles = (selectedRoles.data ?? [])

          .filter((role: any) => role.application_id === application.application_id)

          .sort((a: any, b: any) => a.preference_order - b.preference_order)

          .map((role: any) => role.drive_roles?.drive_role_name)

          .filter(Boolean)

          .join(", ");

        const answerMap: Record<string, any> = {};

        for (const question of questions.data ?? []) {
          const answer = answers.data?.find(
            (a: any) =>
              a.application_id === application.application_id &&
              a.question_id === question.question_id,
          );

          const value = answer?.answer?.value;

          if (
            value &&
            typeof value === "object" &&
            value.type === "document" &&
            value.document_metadata_id
          ) {
            const { data: metadata } = await (supabase as any)

              .from("document_metadata")

              .select("storage_url")

              .eq("document_metadata_id", value.document_metadata_id)

              .single();

            if (metadata?.storage_url) {
              const { data: signed } = await supabase.storage

                .from("student-question-files")

                .createSignedUrl(
                  metadata.storage_url,

                  60 * 60 * 24 * 30,
                );

              answerMap[question.question_title] = signed?.signedUrl ?? "";
            } else {
              answerMap[question.question_title] = "";
            }
          } else {
            answerMap[question.question_title] = value ?? "";
          }
        }

        return {
          applicationId: application.application_id,

          studentId: application.student_id,

          enrollmentNumber: profile?.enrollment_no ?? "",

          studentName: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim(),

          instituteEmail: profile?.institute_email ?? "",

          personalEmail: profile?.personal_email ?? "",

          contactNumber: profile?.contact_number ?? "",

          alternateContactNumber: profile?.alternate_contact_number ?? "",

          gender: profile?.gender ?? "",

          dateOfBirth: profile?.date_of_birth ?? "",

          placementPreference: profile?.placement_preference ?? "",

          placementStatus: profile?.placement_status ?? "",

          institute: academic?.current_institute_name ?? "",

          degree: academic?.current_degree_name ?? "",

          branch: academic?.current_branch_name ?? "",

          semester: academic?.current_semester ?? null,

          cgpa: academic?.current_cgpa ?? null,

          tenthPercentage: academic?.tenth_percentage ?? null,

          twelfthPercentage: academic?.twelfth_percentage ?? null,

          diplomaPercentage: academic?.diploma_percentage ?? null,

          activeBacklogs: academic?.active_backlogs ?? null,

          yearGapCount: academic?.year_gap_count ?? null,

          graduationYear: academic?.graduation_year ?? null,

          technicalSkills: skill?.technical_skills ?? "",

          programmingLanguages: skill?.programming_languages ?? "",

          toolsAndTechnologies: skill?.tools_and_technologies ?? "",

          github: skill?.github_url ?? "",

          linkedin: skill?.linkedin_url ?? "",

          portfolio: skill?.portfolio_url ?? "",

          strengths: skill?.strengths ?? "",

          profileScore: profile?.profile_completion_percentage ?? null,

          applicationStatus: application.application_status,

          appliedAt: application.applied_at,

          remarks: application.remarks ?? "",

          appliedRoles: roles,

          answers: answerMap,
        };
      }),
    );

    return {
      companyName,

      rows,

      dynamicQuestions: questions.data?.map((q: any) => q.question_title) ?? [],
    };
  },
};
