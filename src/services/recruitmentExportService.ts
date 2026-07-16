import { supabase } from "@/lib/supabase";

export interface RecruitmentExportRow {
  application: any;
  profile: any;
  academic: any;
  skill: any;

  appliedRoles: string;

  answers: Record<string, any>;
}

export interface RecruitmentExportData {
  companyName: string;

  rows: RecruitmentExportRow[];

  dynamicQuestions: string[];
}

export const recruitmentExportService = {

  async getRecruitmentExportData(
    opportunityId: string,
  ): Promise<RecruitmentExportData> {

    const { data: applications, error } =
      await (supabase as any)

        .from("student_opportunity_applications")

        .select("*")

        .eq(
          "opportunity_id",
          opportunityId,
        )

        .order(
          "applied_at",
          {
            ascending: false,
          },
        );

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

    const studentIds =
      applications.map(
        (x: any) =>
          x.student_id,
      );

    const applicationIds =
      applications.map(
        (x: any) =>
          x.application_id,
      );

   const [

  profiles,

  academics,

  skills,

  questions,

  answers,

  selectedRoles,

  opportunity,

] = await Promise.all([

      (supabase as any)

        .from("student_master")

        .select("*")

        .in(
          "student_id",
          studentIds,
        ),

      (supabase as any)

        .from("student_academic_details")

        .select("*")

        .in(
          "student_id",
          studentIds,
        ),

      (supabase as any)

        .from("student_skill_profile")

        .select("*")

        .in(
          "student_id",
          studentIds,
        ),

      (supabase as any)

        .from("opportunity_questions")

        .select("*")

        .eq(
          "opportunity_id",
          opportunityId,
        )

        .order(
          "position",
        ),

      (supabase as any)

        .from("opportunity_question_answers")

        .select("*")

        .in(
          "application_id",
          applicationIds,
        ),

      (supabase as any)

        .from(
          "student_application_selected_roles",
        )

        .select(`
          application_id,
          preference_order,

          drive_roles (
            drive_role_name
          )
        `)

     .in(
  "application_id",
  applicationIds,
),

(supabase as any)

  .from("opportunity_master")

  .select(`
    opportunity_title,

    drive_master (
      company_id
    )
  `)

  .eq(
    "opportunity_id",
    opportunityId,
  )

  .single(),

]);

  let companyName = "";

const companyId =
  opportunity.data?.drive_master?.company_id;

if (companyId) {

  const { data: company } =
    await (supabase as any)

      .from("company_master")

      .select("company_name")

      .eq(
        "company_id",
        companyId,
      )

      .single();

  companyName =
    company?.company_name ?? "";

}
const rows = applications.map((application: any) => {

  const profile =
    profiles.data?.find(
      (x: any) =>
        x.student_id ===
        application.student_id,
    ) ?? null;

  const academic =
    academics.data?.find(
      (x: any) =>
        x.student_id ===
        application.student_id,
    ) ?? null;

  const skill =
    skills.data?.find(
      (x: any) =>
        x.student_id ===
        application.student_id,
    ) ?? null;

  const roles =

    (selectedRoles.data ?? [])

      .filter(
        (role: any) =>
          role.application_id ===
          application.application_id,
      )

      .sort(
        (
          a: any,
          b: any,
        ) =>
          a.preference_order -
          b.preference_order,
      )

      .map(
        (role: any) =>
          role.drive_roles
            ?.drive_role_name,
      )

      .filter(Boolean)

      .join(", ");

  const answerMap:
    Record<
      string,
      any
    > = {};

  (
    questions.data ??
    []
  ).forEach(
    (question: any) => {

      const answer =
        answers.data?.find(
          (a: any) =>
            a.application_id ===
              application.application_id &&
            a.question_id ===
              question.question_id,
        );

      answerMap[
        question.question_title
      ] =
        answer?.answer?.value ??
        "";

    },
  );

  return {

    application,

    profile,

    academic,

    skill,

    appliedRoles:
      roles,

    answers:
      answerMap,

  };

});

return {

  companyName,

  rows,

  dynamicQuestions:
    questions.data?.map(
      (q: any) =>
        q.question_title,
    ) ?? [],

};

  },

};