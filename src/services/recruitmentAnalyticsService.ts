import { supabase } from "@/lib/supabase";
import {
  getRecruitmentEligibilityAnalytics,
  type RoleEligibilityAnalytics,
  type ActionCenterItem,
} from "@/services/recruitmentEligibilityAnalyticsService";
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

  eligibleStudents: number;

  pendingEligibleStudents: number;

  applicationRate: number;

  shortlistedCount: number;

  selectedCount: number;

  applicationsToday: number;

  applicationsLast24Hours: number;

  applicationsLast7Days: number;

  coverageByBranch: {
    branchName: string;
    eligible: number;
    applied: number;
  }[];

  coverageByInstitute: {
    instituteName: string;
    eligible: number;
    applied: number;
  }[];

  coverageByDegree: {
    degreeName: string;
    eligible: number;
    applied: number;
  }[];

  coverageByGraduationYear: {
    graduationYear: string;
    eligible: number;
    applied: number;
  }[];

  roleDistribution: {
    roleId: string;
    roleName: string;
    applicationCount: number;
  }[];

  roleAnalytics: RoleEligibilityAnalytics[];

  actionCenter: ActionCenterItem[];

  failureBreakdown: {
    optOut: number;
    inactive: number;
    institute: number;
    degree: number;
    branch: number;
    graduationYear: number;
    cgpa: number;
    backlog: number;
    yearGap: number;
    custom: number;
  };

  recentApplications: {
    applicationId: string;
    studentId: string;
    studentName: string;
    enrollmentNo: string;
    appliedAt: string;
  }[];

  applicationTrend: {
    date: string;
    applications: number;
  }[];

  execution: {
    exists: boolean;

    latestExecutionId: string | null;

    latestRevision: number | null;

    status: "NOT_STARTED" | "ACTIVE" | "FINALIZED";

    canStartExecution: boolean;

    canResumeExecution: boolean;

    canViewExecution: boolean;

    canReopenExecution: boolean;
  };
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

  let eligibleStudents = 0;

  let pendingEligibleStudents = 0;

  let applicationRate = 0;

  let eligibilityAnalytics: Awaited<ReturnType<typeof getRecruitmentEligibilityAnalytics>> | null =
    null;

  let applicationsToday = 0;

  let applicationsLast24Hours = 0;

  let applicationsLast7Days = 0;

  let recentApplications: {
    applicationId: string;
    studentId: string;
    studentName: string;
    enrollmentNo: string;
    appliedAt: string;
  }[] = [];

  let applicationTrend: {
    date: string;
    applications: number;
  }[] = [];

  if (opportunity?.opportunity_id) {
    const { data: latestApplications } = await (supabase as any)
      .from("student_opportunity_applications")
      .select(
        `
application_id,
student_id,
applied_at,

student_master!inner(
  enrollment_no,
  first_name,
  middle_name,
  last_name
)
`,
      )
      .eq("opportunity_id", opportunity.opportunity_id)
      .order("applied_at", {
        ascending: false,
      })
      .limit(5);

    recentApplications =
      latestApplications?.map((application: any) => {
        const student = application.student_master;

        const fullName = [student?.first_name, student?.middle_name, student?.last_name]
          .filter(Boolean)
          .join(" ");

        return {
          applicationId: application.application_id,

          studentId: application.student_id,

          studentName: fullName || "Unknown Student",

          enrollmentNo: student?.enrollment_no ?? "-",

          appliedAt: application.applied_at,
        };
      }) ?? [];
    const { count } = await (supabase as any)
      .from("student_opportunity_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("opportunity_id", opportunity.opportunity_id);

    applicationCount = count ?? 0;

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    applicationsToday = recentApplications.filter(
      (application) => new Date(application.appliedAt) >= today,
    ).length;

    applicationsLast24Hours = recentApplications.filter(
      (application) => new Date(application.appliedAt) >= last24,
    ).length;

    applicationsLast7Days = recentApplications.filter(
      (application) => new Date(application.appliedAt) >= last7,
    ).length;

    const trendMap = new Map<string, number>();

    (latestApplications ?? []).forEach((application: any) => {
      const day = new Date(application.applied_at).toISOString().slice(0, 10);

      trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
    });

    applicationTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, applications]) => ({
        date,
        applications,
      }));
  }

  if (driveId) {
    eligibilityAnalytics = await getRecruitmentEligibilityAnalytics(draftId);

    eligibleStudents = eligibilityAnalytics.eligibleStudents;

    pendingEligibleStudents = Math.max(eligibilityAnalytics.eligibleStudents - applicationCount, 0);

    applicationRate =
      eligibleStudents === 0 ? 0 : Number(((applicationCount / eligibleStudents) * 100).toFixed(1));
  }

  let coverageByBranch: {
    branchName: string;
    eligible: number;
    applied: number;
  }[] = [];

  let coverageByInstitute: {
    instituteName: string;
    eligible: number;
    applied: number;
  }[] = [];

  let coverageByDegree: {
    degreeName: string;
    eligible: number;
    applied: number;
  }[] = [];

  let coverageByGraduationYear: {
    graduationYear: string;
    eligible: number;
    applied: number;
  }[] = [];

  let roleCount = 0;

  let executionSummary = {
    exists: false,

    latestExecutionId: null as string | null,

    latestRevision: null as number | null,

    status: "NOT_STARTED" as "NOT_STARTED" | "ACTIVE" | "FINALIZED",

    canStartExecution: false,

    canResumeExecution: false,

    canViewExecution: false,

    canReopenExecution: false,
  };

  let roleDistribution: {
    roleId: string;
    roleName: string;
    applicationCount: number;
  }[] = [];

  if (driveId) {
    const { data: branchStudents } = await (supabase as any).from("student_academic_details")
      .select(`
        student_id,
        current_institute_name,
        current_degree_name,
        current_branch_name,
        graduation_year
      `);

    const { data: interestedStudents } = await (supabase as any)

      .from("student_master")

      .select(
        `
        student_id
      `,
      )

      .eq("placement_preference", "Interested")

      .eq("is_active", true);

    const interestedIds = new Set<string>(
      (interestedStudents ?? []).map((student: any) => String(student.student_id)),
    );
    const eligibleByBranch = new Map<string, number>();

    (branchStudents ?? []).forEach((student: any) => {
      if (!interestedIds.has(student.student_id)) {
        return;
      }

      const key = student.current_branch_name ?? "Unknown";

      eligibleByBranch.set(key, (eligibleByBranch.get(key) ?? 0) + 1);
    });

    const { data: applicants } = await (supabase as any)

      .from("student_opportunity_applications")

      .select(
        `
        student_id
      `,
      )

      .eq("opportunity_id", opportunity?.opportunity_id);

    const applicantIds = new Set<string>(
      (applicants ?? []).map((application: any) => String(application.student_id)),
    );

    function buildCoverage(
      students: any[],
      interested: Set<string>,
      applicants: Set<string>,
      field: string,
      fallback: string,
    ) {
      const eligibleMap = new Map<string, number>();

      const appliedMap = new Map<string, number>();

      students.forEach((student: any) => {
        if (!interested.has(student.student_id)) return;

        const key = String(student[field] ?? fallback);

        eligibleMap.set(key, (eligibleMap.get(key) ?? 0) + 1);

        if (applicants.has(student.student_id)) {
          appliedMap.set(key, (appliedMap.get(key) ?? 0) + 1);
        }
      });

      return Array.from(eligibleMap.keys())
        .sort()
        .map((key) => ({
          instituteName: key,
          degreeName: key,
          graduationYear: key,
          branchName: key,
          eligible: eligibleMap.get(key) ?? 0,
          applied: appliedMap.get(key) ?? 0,
        }));
    }

    const appliedByBranch = new Map<string, number>();

    (branchStudents ?? []).forEach((student: any) => {
      if (!applicantIds.has(student.student_id)) {
        return;
      }

      const key = student.current_branch_name ?? "Unknown";

      appliedByBranch.set(key, (appliedByBranch.get(key) ?? 0) + 1);
    });

    coverageByBranch = Array.from(eligibleByBranch.keys())
      .sort()
      .map((branchName) => ({
        branchName,

        eligible: eligibleByBranch.get(branchName) ?? 0,

        applied: appliedByBranch.get(branchName) ?? 0,
      }));

    coverageByInstitute = buildCoverage(
      branchStudents ?? [],
      interestedIds,
      applicantIds,
      "current_institute_name",
      "Unknown Institute",
    );

    coverageByDegree = buildCoverage(
      branchStudents ?? [],
      interestedIds,
      applicantIds,
      "current_degree_name",
      "Unknown Degree",
    );

    coverageByGraduationYear = buildCoverage(
      branchStudents ?? [],
      interestedIds,
      applicantIds,
      "graduation_year",
      "Unknown Year",
    );
  }

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
      const { data: applications } = await (supabase as any)
        .from("student_opportunity_applications")
        .select("application_id")
        .eq("opportunity_id", opportunity.opportunity_id);

      const applicationIds = (applications ?? []).map(
        (application: any) => application.application_id,
      );

      let selectedRoles: any[] = [];

      if (applicationIds.length > 0) {
        const { data } = await (supabase as any)
          .from("student_application_selected_roles")
          .select("drive_role_id")
          .in("application_id", applicationIds);

        selectedRoles = data ?? [];
      }

      roleDistribution = roles.map((role: any) => ({
        roleId: role.drive_role_id,

        roleName: role.drive_role_name,

        applicationCount: selectedRoles.filter(
          (selected: any) => selected.drive_role_id === role.drive_role_id,
        ).length,
      }));
    }
  }

  if (opportunity?.opportunity_id) {
const { data: executionSeries } = await (supabase as any)
  .from("recruitment_execution_series")
  .select(`
    series_id,
    current_revision_number,
    series_status
  `)
  .eq("opportunity_id", opportunity.opportunity_id)
  .maybeSingle();

if (executionSeries) {
  const { data: latestExecution } = await (supabase as any)
    .from("recruitment_executions")
    .select(`
      execution_id,
      revision_number,
      execution_status
    `)
    .eq("series_id", executionSeries.series_id)
    .order("revision_number", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (latestExecution) {
    executionSummary = {
      exists: true,

      latestExecutionId: latestExecution.execution_id,

      latestRevision:
        latestExecution.revision_number ?? 1,

      status:
        latestExecution.execution_status === "FINALIZED"
          ? "FINALIZED"
          : "ACTIVE",

      canStartExecution: false,

      canResumeExecution:
        latestExecution.execution_status !== "FINALIZED",

      canViewExecution: true,

      canReopenExecution:
        latestExecution.execution_status === "FINALIZED",
    };
  }
} else {
  executionSummary = {
    exists: false,

    latestExecutionId: null,

    latestRevision: null,

    status: "NOT_STARTED",

    canStartExecution: true,

    canResumeExecution: false,

    canViewExecution: false,

    canReopenExecution: false,
  };
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

    eligibleStudents,

    pendingEligibleStudents,

    applicationRate,

    shortlistedCount: 0,

    selectedCount: 0,

    applicationsToday,

    applicationsLast24Hours,

    applicationsLast7Days,

    totalRoles: roleCount,

    averageApplicationsPerRole:
      roleCount === 0 ? 0 : Number((applicationCount / roleCount).toFixed(1)),

    coverageByBranch:
      eligibilityAnalytics?.coverageByBranch.map((row) => ({
        branchName: row.label,
        eligible: row.eligible,
        applied: row.applied,
      })) ?? coverageByBranch,

    coverageByInstitute:
      eligibilityAnalytics?.coverageByInstitute.map((row) => ({
        instituteName: row.label,
        eligible: row.eligible,
        applied: row.applied,
      })) ?? coverageByInstitute,

    coverageByDegree:
      eligibilityAnalytics?.coverageByDegree.map((row) => ({
        degreeName: row.label,
        eligible: row.eligible,
        applied: row.applied,
      })) ?? coverageByDegree,

    coverageByGraduationYear:
      eligibilityAnalytics?.coverageByGraduationYear.map((row) => ({
        graduationYear: row.label,
        eligible: row.eligible,
        applied: row.applied,
      })) ?? coverageByGraduationYear,

    roleDistribution,

    roleAnalytics: eligibilityAnalytics?.roleAnalytics ?? [],

    actionCenter: eligibilityAnalytics?.actionCenter ?? [],

    failureBreakdown: eligibilityAnalytics?.failureBreakdown ?? {
      optOut: 0,
      inactive: 0,
      institute: 0,
      degree: 0,
      branch: 0,
      graduationYear: 0,
      cgpa: 0,
      backlog: 0,
      yearGap: 0,
      custom: 0,
    },

    recentApplications,

    applicationTrend,

    execution: executionSummary,
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
