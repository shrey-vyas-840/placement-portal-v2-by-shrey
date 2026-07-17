import { supabase } from "@/lib/supabase";

export interface EligibilityFailureReason {
  code:
    | "OPT_OUT"
    | "INACTIVE"
    | "INSTITUTE"
    | "DEGREE"
    | "BRANCH"
    | "GRADUATION_YEAR"
    | "CGPA"
    | "BACKLOG"
    | "YEAR_GAP"
    | "CUSTOM";

  message: string;
}

export interface StudentEligibilityResult {
  studentId: string;

  eligible: boolean;

  failureReasons: EligibilityFailureReason[];
}

export interface CoverageAnalyticsRow {
  label: string;

  eligible: number;

  applied: number;
}

export interface RoleEligibilityAnalytics {
  roleId: string;

  roleName: string;

  eligible: number;

  applied: number;

  openings: number;

  applicationRate: number;

  applicationsPerOpening: number;
}

export interface ActionCenterItem {

  id: string;

  severity:
    | "high"
    | "medium"
    | "low";

  title: string;

  description: string;

  actionLabel: string;

  actionType:
    | "students"
    | "role"
    | "applications";

  metadata?: Record<
    string,
    unknown
  >;

}

export interface EligibilityAnalyticsResult {
  totalStudents: number;

  activeStudents: number;

  optedInStudents: number;

  optedOutStudents: number;

  eligibleStudents: number;

  pendingEligibleStudents: number;

  applicationRate: number;

  coverageByInstitute: CoverageAnalyticsRow[];

  coverageByDegree: CoverageAnalyticsRow[];

  coverageByBranch: CoverageAnalyticsRow[];

  coverageByGraduationYear: CoverageAnalyticsRow[];

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

  studentResults: StudentEligibilityResult[];
}

interface StudentMasterRecord {
  student_id: string;

  placement_preference: string | null;

  is_active: boolean;
}

interface StudentAcademicRecord {
  student_id: string;

  current_institute_name: string | null;

  current_degree_name: string | null;

  current_branch_name: string | null;

  graduation_year: number | null;

  current_cgpa: number | null;

  active_backlogs: number | null;

  year_gap_count: number | null;
}

interface RecruitmentEligibilityCriteria {
  institutes: string[];

  degrees: string[];

  branches: string[];

  graduationYears: number[];

  minimumCgpa: number | null;

  maximumActiveBacklogs: number | null;

  maximumYearGap: number | null;
}

function matchesStringRule(
  allowedValues: string[],
  actualValue: string | null | undefined,
): boolean {
  if (allowedValues.length === 0) {
    return true;
  }

  if (!actualValue) {
    return false;
  }

  return allowedValues.includes(actualValue);
}

function matchesNumberRule(
  allowedValues: number[],
  actualValue: number | null | undefined,
): boolean {
  if (allowedValues.length === 0) {
    return true;
  }

  if (actualValue === null || actualValue === undefined) {
    return false;
  }

  return allowedValues.includes(actualValue);
}

function incrementCounter(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

async function loadRecruitmentEligibilityCriteria(
  draftId: string,
): Promise<RecruitmentEligibilityCriteria> {
  const { data: draft, error } = await (supabase as any)

    .from("recruitment_drafts")

    .select("eligibility_data")

    .eq("draft_id", draftId)

    .single();

  if (error) {
    throw error;
  }

  const eligibility = draft?.eligibility_data ?? {};

  return {
    institutes: eligibility.selectedInstitutes ?? eligibility.institutes ?? [],

    degrees: eligibility.selectedDegrees ?? eligibility.degrees ?? [],

    branches: eligibility.selectedBranches ?? eligibility.branches ?? [],

    graduationYears: eligibility.selectedGraduationYears ?? eligibility.graduationYears ?? [],

    minimumCgpa: eligibility.minimumCgpa ?? eligibility.minimum_cgpa ?? null,

    maximumActiveBacklogs:
      eligibility.maximumActiveBacklogs ?? eligibility.maximum_backlogs ?? null,

    maximumYearGap: eligibility.maximumYearGap ?? eligibility.maximum_year_gap ?? null,
  };
}

async function loadStudents() {
  const [{ data: students }, { data: academics }] = await Promise.all([
    (supabase as any).from("student_master").select(`
          student_id,
          placement_preference,
          is_active
        `),

    (supabase as any).from("student_academic_details").select(`
          student_id,
          current_institute_name,
          current_degree_name,
          current_branch_name,
          graduation_year,
          current_cgpa,
          active_backlogs,
          year_gap_count
        `),
  ]);

  const academicMap = new Map<string, StudentAcademicRecord>();

  (academics ?? []).forEach((academic: StudentAcademicRecord) => {
    academicMap.set(academic.student_id, academic);
  });

  return {
    students: (students ?? []) as StudentMasterRecord[],

    academicMap,
  };
}

async function loadApplicantIds(draftId: string): Promise<Set<string>> {
  const { data: draft } = await (supabase as any)

    .from("recruitment_drafts")

    .select("published_drive_id, created_drive_id")

    .eq("draft_id", draftId)

    .single();

  const driveId = draft?.published_drive_id ?? draft?.created_drive_id;

  if (!driveId) {
    return new Set<string>();
  }

  const { data: opportunity } = await (supabase as any)

    .from("opportunity_master")

    .select("opportunity_id")

    .eq("drive_id", driveId)

    .maybeSingle();

  if (!opportunity?.opportunity_id) {
    return new Set<string>();
  }

  const { data: applications } = await (supabase as any)

    .from("student_opportunity_applications")

    .select("student_id")

    .eq("opportunity_id", opportunity.opportunity_id);

  return new Set<string>((applications ?? []).map((row: any) => String(row.student_id)));
}


interface RecruitmentRoleRecord {

  roleId: string;

  roleName: string;

  openings: number;

}

async function loadRecruitmentRoles(
  draftId: string,
): Promise<RecruitmentRoleRecord[]> {

  const { data: draft } =
    await (supabase as any)

      .from("recruitment_drafts")

      .select(
        "published_drive_id, created_drive_id",
      )

      .eq("draft_id", draftId)

      .single();

  const driveId =
    draft?.published_drive_id ??
    draft?.created_drive_id;

  if (!driveId) {

    return [];

  }

  const { data } =
    await (supabase as any)

      .from("drive_roles")

      .select(`
        drive_role_id,
        drive_role_name,
        vacancies
      `)

      .eq(
        "drive_id",
        driveId,
      );

  return (
    data ?? []
  ).map((role: any) => ({

    roleId:
      role.drive_role_id,

    roleName:
      role.drive_role_name,

    openings:
      role.vacancies ?? 0,

  }));

}

async function loadSelectedRoles(
  draftId: string,
): Promise<Map<string, number>> {

  const { data: draft } =
    await (supabase as any)

      .from("recruitment_drafts")

      .select(
        "published_drive_id, created_drive_id",
      )

      .eq("draft_id", draftId)

      .single();

  const driveId =
    draft?.published_drive_id ??
    draft?.created_drive_id;

  if (!driveId) {

    return new Map();

  }

  const { data: opportunity } =
    await (supabase as any)

      .from("opportunity_master")

      .select(
        "opportunity_id",
      )

      .eq(
        "drive_id",
        driveId,
      )

      .maybeSingle();

  if (
    !opportunity?.opportunity_id
  ) {

    return new Map();

  }

  const { data } =
    await (supabase as any)

      .from(
        "student_application_selected_roles",
      )

      .select(
        "drive_role_id",
      )

      .eq(
        "opportunity_id",
        opportunity.opportunity_id,
      );

  const counts =
    new Map<string, number>();

  (data ?? []).forEach(
    (row: any) => {

      incrementCounter(
        counts,
        row.drive_role_id,
      );

    },
  );

  return counts;

}


function buildCoverageRows(
  students: StudentMasterRecord[],
  academicMap: Map<string, StudentAcademicRecord>,
  eligibleIds: Set<string>,
  applicantIds: Set<string>,
  field:
    "current_institute_name" | "current_degree_name" | "current_branch_name" | "graduation_year",
  fallback: string,
): CoverageAnalyticsRow[] {
  const eligibleMap = new Map<string, number>();

  const appliedMap = new Map<string, number>();

  for (const student of students) {
    if (!eligibleIds.has(student.student_id)) {
      continue;
    }

    const academic = academicMap.get(student.student_id);

    const key = String(academic?.[field] ?? fallback);

    incrementCounter(eligibleMap, key);

    if (applicantIds.has(student.student_id)) {
      incrementCounter(appliedMap, key);
    }
  }

  return Array.from(eligibleMap.keys())
    .sort()
    .map((key) => ({
      label: key,

      eligible: eligibleMap.get(key) ?? 0,

      applied: appliedMap.get(key) ?? 0,
    }));
}

function buildActionCenter(

  eligibleStudents: number,

  applicantIds: Set<string>,

  failureBreakdown: EligibilityAnalyticsResult["failureBreakdown"],

  roleAnalytics: RoleEligibilityAnalytics[],

): ActionCenterItem[] {

  const actions: ActionCenterItem[] = [];

  const pendingStudents =
    Math.max(
      eligibleStudents -
        applicantIds.size,
      0,
    );

  if (pendingStudents > 0) {

    actions.push({

      id: "pending-applications",

      severity:
        pendingStudents >= 50
          ? "high"
          : "medium",

      title:
        "Eligible students have not applied",

      description:
        `${pendingStudents} eligible students have not submitted an application.`,

      actionLabel:
        "View Students",

      actionType:
        "students",

      metadata: {

        pendingStudents,

      },

    });

  }

  if (
    failureBreakdown.optOut >
    0
  ) {

    actions.push({

      id: "opted-out",

      severity: "medium",

      title:
        "Students opted out",

      description:
        `${failureBreakdown.optOut} students have opted out of placements.`,

      actionLabel:
        "View Students",

      actionType:
        "students",

    });

  }

  roleAnalytics.forEach(
    (role) => {

      if (
        role.applicationRate <
        20
      ) {

        actions.push({

          id:
            `role-${role.roleId}`,

          severity:
            "medium",

          title:
            `${role.roleName} has low interest`,

          description:
            `${role.applied} applications received for ${role.openings} openings.`,

          actionLabel:
            "View Role",

          actionType:
            "role",

          metadata: {

            roleId:
              role.roleId,

          },

        });

      }

    },
  );

  return actions;

}

function evaluateStudentEligibility(
  student: StudentMasterRecord,
  academic: StudentAcademicRecord | undefined,
  criteria: RecruitmentEligibilityCriteria,
): StudentEligibilityResult {
  const failureReasons: EligibilityFailureReason[] = [];

  if (!student.is_active) {
    failureReasons.push({
      code: "INACTIVE",
      message: "Student account is inactive.",
    });
  }

  if (student.placement_preference !== "Interested") {
    failureReasons.push({
      code: "OPT_OUT",
      message: "Student has opted out of placements.",
    });
  }

  if (academic && !matchesStringRule(criteria.institutes, academic.current_institute_name)) {
    failureReasons.push({
      code: "INSTITUTE",
      message: "Institute is not eligible.",
    });
  }

  if (academic && !matchesStringRule(criteria.degrees, academic.current_degree_name)) {
    failureReasons.push({
      code: "DEGREE",
      message: "Degree is not eligible.",
    });
  }

  if (academic && !matchesStringRule(criteria.branches, academic.current_branch_name)) {
    failureReasons.push({
      code: "BRANCH",
      message: "Branch is not eligible.",
    });
  }

  if (academic && !matchesNumberRule(criteria.graduationYears, academic.graduation_year)) {
    failureReasons.push({
      code: "GRADUATION_YEAR",
      message: "Graduation year is not eligible.",
    });
  }

  if (
    academic &&
    criteria.minimumCgpa !== null &&
    (academic.current_cgpa ?? 0) < criteria.minimumCgpa
  ) {
    failureReasons.push({
      code: "CGPA",
      message: "CGPA is below the minimum requirement.",
    });
  }

  if (
    academic &&
    criteria.maximumActiveBacklogs !== null &&
    (academic.active_backlogs ?? 0) > criteria.maximumActiveBacklogs
  ) {
    failureReasons.push({
      code: "BACKLOG",
      message: "Backlog limit exceeded.",
    });
  }

  if (
    academic &&
    criteria.maximumYearGap !== null &&
    (academic.year_gap_count ?? 0) > criteria.maximumYearGap
  ) {
    failureReasons.push({
      code: "YEAR_GAP",
      message: "Year gap exceeds the allowed limit.",
    });
  }

  return {
    studentId: student.student_id,

    eligible: failureReasons.length === 0,

    failureReasons,
  };
}

export async function getRecruitmentEligibilityAnalytics(
  draftId: string,
): Promise<EligibilityAnalyticsResult> {
  const criteria = await loadRecruitmentEligibilityCriteria(draftId);

  const { students, academicMap } = await loadStudents();

  const studentResults: StudentEligibilityResult[] = [];

  const applicantIds = await loadApplicantIds(draftId);

  const eligibleStudentIds = new Set<string>();

  let activeStudents = 0;

  let optedInStudents = 0;

  let optedOutStudents = 0;

  let eligibleStudents = 0;

  const failureBreakdown = {
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
  };

  for (const student of students) {
    if (student.is_active) {
      activeStudents++;
    }

    if (student.placement_preference === "Interested") {
      optedInStudents++;
    } else {
      optedOutStudents++;
    }

    const result = evaluateStudentEligibility(
      student,
      academicMap.get(student.student_id),
      criteria,
    );

    studentResults.push(result);

    if (result.eligible) {
      eligibleStudents++;

      eligibleStudentIds.add(student.student_id);

      continue;
    }

    result.failureReasons.forEach((reason) => {
      switch (reason.code) {
        case "OPT_OUT":
          failureBreakdown.optOut++;
          break;

        case "INACTIVE":
          failureBreakdown.inactive++;
          break;

        case "INSTITUTE":
          failureBreakdown.institute++;
          break;

        case "DEGREE":
          failureBreakdown.degree++;
          break;

        case "BRANCH":
          failureBreakdown.branch++;
          break;

        case "GRADUATION_YEAR":
          failureBreakdown.graduationYear++;
          break;

        case "CGPA":
          failureBreakdown.cgpa++;
          break;

        case "BACKLOG":
          failureBreakdown.backlog++;
          break;

        case "YEAR_GAP":
          failureBreakdown.yearGap++;
          break;

        case "CUSTOM":
          failureBreakdown.custom++;
          break;
      }
    });
  }

  const coverageByInstitute = buildCoverageRows(
    students,
    academicMap,
    eligibleStudentIds,
    applicantIds,
    "current_institute_name",
    "Unknown Institute",
  );

  const coverageByDegree = buildCoverageRows(
    students,
    academicMap,
    eligibleStudentIds,
    applicantIds,
    "current_degree_name",
    "Unknown Degree",
  );

  const coverageByBranch = buildCoverageRows(
    students,
    academicMap,
    eligibleStudentIds,
    applicantIds,
    "current_branch_name",
    "Unknown Branch",
  );

  const coverageByGraduationYear = buildCoverageRows(
    students,
    academicMap,
    eligibleStudentIds,
    applicantIds,
    "graduation_year",
    "Unknown Year",
  );

  const roles =
  await loadRecruitmentRoles(
    draftId,
  );

const selectedRoleCounts =
  await loadSelectedRoles(
    draftId,
  );

const roleAnalytics =
  roles.map((role) => {

    const applied =
      selectedRoleCounts.get(
        role.roleId,
      ) ?? 0;

    const applicationRate =
      eligibleStudents === 0
        ? 0
        : Number(
            (
              (applied /
                eligibleStudents) *
              100
            ).toFixed(1),
          );

    return {

      roleId:
        role.roleId,

      roleName:
        role.roleName,

      eligible:
        eligibleStudents,

      applied,

      openings:
        role.openings,

      applicationRate,

      applicationsPerOpening:
        role.openings === 0
          ? 0
          : Number(
              (
                applied /
                role.openings
              ).toFixed(1),
            ),

    };

  });

  const actionCenter =
  buildActionCenter(

    eligibleStudents,

    applicantIds,

    failureBreakdown,

    roleAnalytics,

  );
  
  return {
    totalStudents: students.length,

    activeStudents,

    optedInStudents,

    optedOutStudents,

    eligibleStudents,

    pendingEligibleStudents: eligibleStudents,

    applicationRate: 0,

    coverageByInstitute,

    coverageByDegree,

    coverageByBranch,

    coverageByGraduationYear,

    roleAnalytics,

    actionCenter,

    failureBreakdown,

    studentResults,
  };
}
