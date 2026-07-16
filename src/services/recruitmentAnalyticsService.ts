import { supabase } from "@/lib/supabase";

export interface RecruitmentWorkspaceSummary {
  draftId: string;

  driveId: string | null;

  opportunityId: string | null;

  companyId: string | null;

  companyName: string;

  recruitmentName: string;

  applicationStatus: string;

  applicationStartDate: string | null;

  applicationEndDate: string | null;

  totalApplications: number;

  totalRoles: number;

  averageApplicationsPerRole: number;

  roleDistribution: {
    roleId: string;
    roleName: string;
    applicationCount: number;
  }[];

  recentApplications: {
    applicationId: string;
    studentId: string;
    appliedAt: string;
  }[];
}
export interface RecruitmentApplicant {
  applicationId: string;

  studentId: string;

  fullName: string;

  institute: string;

  branch: string;

  currentCgpa: number | null;

  currentSemester: number | null;

  graduationYear: number | null;

  activeBacklogs: number | null;

  yearGapCount: number | null;

  applicationStatus: string;

  appliedAt: string;

  roles: string[];
}

export interface RecruitmentQuestionAnswer {
  questionId: string;

  questionTitle: string;

  questionType: string;

  answer: any;
}

export interface RecruitmentDocument {
  documentMetadataId: string;

  documentName: string;

  documentType: string;

  storagePath: string;

  uploadedAt: string | null;

  viewUrl: string;

  downloadUrl: string;
}

export async function getRecruitmentWorkspaceSummary(
  draftId: string,
): Promise<RecruitmentWorkspaceSummary> {
  const { data: draft, error: draftError } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .eq("draft_id", draftId)
    .single();

  if (draftError) {
    throw draftError;
  }

  if (!draft) {
    throw new Error("Recruitment not found.");
  }

  const driveId = draft.published_drive_id ?? draft.created_drive_id ?? null;

  let opportunity: any = null;

  if (driveId) {
    const { data } = await (supabase as any)
      .from("opportunity_master")
      .select("*")
      .eq("drive_id", driveId)
      .maybeSingle();

    opportunity = data;
  }

  let applicationCount = 0;

  let recentApplications: {
    applicationId: string;
    studentId: string;
    appliedAt: string;
  }[] = [];

  if (opportunity?.opportunity_id) {
    const { data: latestApplications } = await (supabase as any)
      .from("student_opportunity_applications")
      .select(
        `
    application_id,
    student_id,
    applied_at
  `,
      )
      .eq("opportunity_id", opportunity.opportunity_id)
      .order("applied_at", {
        ascending: false,
      })
      .limit(5);

    recentApplications =
      latestApplications?.map((application: any) => ({
        applicationId: application.application_id,
        studentId: application.student_id,
        appliedAt: application.applied_at,
      })) ?? [];
    const { count } = await (supabase as any)
      .from("student_opportunity_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("opportunity_id", opportunity.opportunity_id);

    applicationCount = count ?? 0;
  }

  let roleCount = 0;

  let roleDistribution: {
    roleId: string;
    roleName: string;
    applicationCount: number;
  }[] = [];

  if (driveId) {
    const { data: roles } = await (supabase as any)

      .from("drive_roles")

      .select(
        `
        drive_role_id,
        drive_role_name
      `,
      )

      .eq("drive_id", driveId);

    roleCount = roles?.length ?? 0;

    if (opportunity?.opportunity_id && roles?.length) {
      const { data: selectedRoles } = await (supabase as any)

        .from("student_application_selected_roles")

        .select(
          `
          drive_role_id
        `,
        )

        .eq("opportunity_id", opportunity.opportunity_id);

      roleDistribution = roles.map((role: any) => ({
        roleId: role.drive_role_id,

        roleName: role.drive_role_name,

        applicationCount: (selectedRoles ?? []).filter(
          (selected: any) => selected.drive_role_id === role.drive_role_id,
        ).length,
      }));
    }
  }

  return {
    draftId,

    driveId,

    opportunityId: opportunity?.opportunity_id ?? null,

    companyId: draft.created_company_id ?? null,

    companyName: draft.company_data?.company_name ?? draft.company_data?.companyName ?? "",

    recruitmentName: draft.draft_name,

    applicationStatus: opportunity?.application_status ?? "Draft",

    applicationStartDate: opportunity?.application_start_date ?? null,

    applicationEndDate: opportunity?.application_end_date ?? null,

    totalApplications: applicationCount,

    totalRoles: roleCount,

    averageApplicationsPerRole:
      roleCount === 0 ? 0 : Number((applicationCount / roleCount).toFixed(1)),

    roleDistribution,

    recentApplications,
  };
}

export async function getRecruitmentApplicants(
  opportunityId: string,
): Promise<RecruitmentApplicant[]> {
  const { data, error } = await (supabase as any)
    .from("student_opportunity_applications")
    .select(
      `
  application_id,
  student_id,
  application_status,
  applied_at,

  student_master!inner (
    first_name,
    last_name
  ),

  student_application_selected_roles (
    preference_order,

    drive_roles (
      drive_role_name
    )
  )
`,
    )
    .eq("opportunity_id", opportunityId)
    .order("applied_at", {
      ascending: false,
    });

  if (error) throw error;

  const studentIds = (data ?? []).map((application: any) => application.student_id);

  const { data: academics } = await (supabase as any)
    .from("student_academic_details")
    .select(
      `
    student_id,
    current_institute_name,
    current_branch_name,
    current_cgpa,
    current_semester,
    graduation_year,
    active_backlogs,
    year_gap_count
`,
    )
    .in("student_id", studentIds);

  const academicMap = new Map(
    (academics ?? []).map((academic: any) => [academic.student_id, academic]),
  );

  return (
    data?.map((application: any) => ({
      applicationId: application.application_id,

      studentId: application.student_id,

      fullName:
        `${application.student_master?.first_name ?? ""} ${application.student_master?.last_name ?? ""}`.trim(),

      institute: (academicMap.get(application.student_id) as any)?.current_institute_name ?? "-",

      branch: (academicMap.get(application.student_id) as any)?.current_branch_name ?? "-",

      currentCgpa: (academicMap.get(application.student_id) as any)?.current_cgpa ?? null,

      currentSemester: (academicMap.get(application.student_id) as any)?.current_semester ?? null,

      graduationYear: (academicMap.get(application.student_id) as any)?.graduation_year ?? null,

      activeBacklogs: (academicMap.get(application.student_id) as any)?.active_backlogs ?? null,

      yearGapCount: (academicMap.get(application.student_id) as any)?.year_gap_count ?? null,

      applicationStatus: application.application_status,

      appliedAt: application.applied_at,

      roles: (application.student_application_selected_roles ?? [])
        .sort((a: any, b: any) => a.preference_order - b.preference_order)
        .map((role: any) => role.drive_roles?.drive_role_name)
        .filter(Boolean),
    })) ?? []
  );
}

export async function getApplicantQuestionAnswers(
  applicationId: string,
): Promise<RecruitmentQuestionAnswer[]> {
  const { data, error } = await (supabase as any)
    .from("opportunity_question_answers")
    .select(
      `
      answer,
      opportunity_questions (
        question_id,
        question_title,
        question_type
      )
    `,
    )
    .eq("application_id", applicationId);

  if (error) {
    throw error;
  }

  return (
    data?.map((row: any) => ({
      questionId: row.opportunity_questions?.question_id,

      questionTitle: row.opportunity_questions?.question_title,

      questionType: row.opportunity_questions?.question_type,

      answer: row.answer,
    })) ?? []
  );
}

export async function getApplicantDocuments(applicationId: string): Promise<RecruitmentDocument[]> {
  const { data: answers, error } = await (supabase as any)
    .from("opportunity_question_answers")
    .select("answer")
    .eq("application_id", applicationId);

  if (error) {
    throw error;
  }

  const ids = (answers ?? [])
    .map((row: any) => row.answer?.value)
    .filter((value: any) => value?.type === "document" && value.document_metadata_id)
    .map((value: any) => value.document_metadata_id);

  if (ids.length === 0) {
    return [];
  }

  const { data: metadata, error: metadataError } = await (supabase as any)
    .from("document_metadata")
    .select(
      `
        document_metadata_id,
        document_name,
        document_type,
        storage_url,
        upload_timestamp
      `,
    )
    .in("document_metadata_id", ids);

  if (metadataError) {
    throw metadataError;
  }

  const documents = await Promise.all(
    (metadata ?? []).map(async (document: any) => {
      const { data } = await supabase.storage
        .from("student-question-files")
        .createSignedUrl(document.storage_url, 60 * 60);

      return {
        documentMetadataId: document.document_metadata_id,

        documentName: document.document_name,

        documentType: document.document_type,

        storagePath: document.storage_url,

        uploadedAt: document.upload_timestamp,

        viewUrl: data?.signedUrl ?? "",

        downloadUrl: data?.signedUrl ?? "",
      };
    }),
  );

  return documents;
}
