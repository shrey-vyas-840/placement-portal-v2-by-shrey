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

  severity: "high" | "medium" | "low";

  title: string;

  description: string;

  actionLabel: string;

  actionType: "students" | "role" | "applications";

  metadata?: Record<string, unknown>;
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

  restrictedEligibleStudents: {
    studentId: string;
    fullName: string;
    enrollmentNumber: string;
    institute: string | null;
    branch: string | null;
    restrictionReason: string;
  }[];

  placedEligibleStudents: {
    studentId: string;
    fullName: string;
    enrollmentNumber: string;
    institute: string | null;
    branch: string | null;
    companyName: string | null;
    packageLpa: number | null;
  }[];
}

export interface StudentMasterRecord {
  student_id: string;
  enrollment_no: string | null;

  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;

  is_active: boolean;
  placement_preference: string | null;
  placement_status: string | null;
}

export interface StudentAcademicRecord {
  student_id: string;

  current_institute_name: string | null;

  current_degree_name: string | null;

  current_branch_name: string | null;

  graduation_year: number | null;

  current_cgpa: number | null;

  active_backlogs: number | null;

  year_gap_count: number | null;
}

export interface RecruitmentEligibilityCriteria {
  institutes: string[];

  degrees: string[];

  branches: string[];

graduationYears: (number | string)[];

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

function buildStudentFullName(student: StudentMasterRecord): string {
  return [student.first_name, student.middle_name, student.last_name]
    .filter((value) => value && value.trim().length > 0)
    .join(" ");
}

interface RecruitmentContext {
  draftId: string;

  driveId: string | null;

  opportunityId: string | null;
}

async function loadRecruitmentContext(draftId: string): Promise<RecruitmentContext> {
  const { data: draft, error: draftError } = await (supabase as any)
    .from("recruitment_drafts")
    .select(
      `
      published_drive_id,
      created_drive_id
    `,
    )
    .eq("draft_id", draftId)
    .single();

  if (draftError) {
    throw draftError;
  }

  const driveId = draft?.published_drive_id ?? draft?.created_drive_id ?? null;

  if (!driveId) {
    return {
      draftId,
      driveId: null,
      opportunityId: null,
    };
  }

  const { data: opportunity } = await (supabase as any)
    .from("opportunity_master")
    .select("opportunity_id")
    .eq("drive_id", driveId)
    .maybeSingle();

  return {
    draftId,
    driveId,
    opportunityId: opportunity?.opportunity_id ?? null,
  };
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

graduationYears: (() => {
  const years =
    eligibility.selectedGraduationYears ??
    eligibility.graduationYears ??
    [];

  if (Array.isArray(years)) {
    return years
      .map((year: unknown) => Number(year))
      .filter((year: number) => !Number.isNaN(year));
  }

  return String(years)
    .replace(/[{}]/g, "")
    .split(",")
    .map((year) => Number(year.trim()))
    .filter((year) => !Number.isNaN(year));
})(),

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
    enrollment_no,
    first_name,
    middle_name,
    last_name,
    is_active,
    placement_preference,
    placement_status
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

interface EligibilitySupportData {
  restrictionMap: Map<string, any>;

  placementMap: Map<string, any>;

  overrideMap: Map<
    string,
    {
      restricted: boolean;

      placed: boolean;
    }
  >;
}

async function loadEligibilitySupportData(
  context: RecruitmentContext,
): Promise<EligibilitySupportData> {
  const [restrictionsResult, placementsResult, overridesResult] = await Promise.all([
    (supabase as any)
      .from("student_restrictions")
      .select(
        `
        student_id,
        restriction_reason
      `,
      )
      .eq("is_active", true),

    (supabase as any)
      .from("student_placement_history")
      .select(
        `
        student_id,
        company_name,
        package_lpa,
        is_current
      `,
      )
      .eq("is_current", true),

    context.opportunityId
      ? (supabase as any)
          .from("student_placement_overrides")
          .select(
            `
            student_id,
            override_type
          `,
          )
          .eq("opportunity_id", context.opportunityId)
          .eq("is_active", true)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  if (restrictionsResult.error) throw restrictionsResult.error;

  if (placementsResult.error) throw placementsResult.error;

  if (overridesResult.error) throw overridesResult.error;

  const restrictionMap = new Map<string, any>();

  (restrictionsResult.data ?? []).forEach((row: any) => {
    restrictionMap.set(String(row.student_id), row);
  });

  const placementMap = new Map<string, any>();

  (placementsResult.data ?? []).forEach((row: any) => {
    placementMap.set(String(row.student_id), row);
  });

  const overrideMap = new Map<
    string,
    {
      restricted: boolean;

      placed: boolean;
    }
  >();

  (overridesResult.data ?? []).forEach((row: any) => {
    const studentId = String(row.student_id);

    const current = overrideMap.get(studentId) ?? {
      restricted: false,
      placed: false,
    };

    if (row.override_type === "RESTRICTED") {
      current.restricted = true;
    }

    if (row.override_type === "PLACED") {
      current.placed = true;
    }

    overrideMap.set(studentId, current);
  });

  return {
    restrictionMap,

    placementMap,

    overrideMap,
  };
}

async function loadApplicantIds(context: RecruitmentContext): Promise<Set<string>> {
  if (!context.opportunityId) {
    return new Set<string>();
  }

  const { data: applications } = await (supabase as any)

    .from("student_opportunity_applications")

    .select("student_id")

    .eq("opportunity_id", context.opportunityId);

  return new Set<string>((applications ?? []).map((row: any) => String(row.student_id)));
}

interface RecruitmentRoleRecord {
  roleId: string;

  roleName: string;

  openings: number;
}

async function loadRecruitmentRoles(context: RecruitmentContext): Promise<RecruitmentRoleRecord[]> {
  if (!context.driveId) {
    return [];
  }

  const driveId = context.driveId;

  const { data } = await (supabase as any)
    .from("drive_roles")
    .select(
      `
      drive_role_id,
      drive_role_name,
      drive_role_details (
        openings
      )
    `,
    )
    .eq("drive_id", driveId);

  return (data ?? []).map((role: any) => ({
    roleId: role.drive_role_id,

    roleName: role.drive_role_name,

    openings: role.drive_role_details?.openings ?? 0,
  }));
}
async function loadSelectedRoles(context: RecruitmentContext): Promise<Map<string, number>> {
  if (!context.opportunityId) {
    return new Map<string, number>();
  }

  const { data: applications } = await (supabase as any)
    .from("student_opportunity_applications")
    .select("application_id")
    .eq("opportunity_id", context.opportunityId);

  const applicationIds = (applications ?? []).map((application: any) => application.application_id);

  if (applicationIds.length === 0) {
    return new Map<string, number>();
  }

  const { data } = await (supabase as any)
    .from("student_application_selected_roles")
    .select("drive_role_id")
    .in("application_id", applicationIds);

  const counts = new Map<string, number>();

  (data ?? []).forEach((row: any) => {
    incrementCounter(counts, row.drive_role_id);
  });

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

  const pendingStudents = Math.max(eligibleStudents - applicantIds.size, 0);

  if (pendingStudents > 0) {
    actions.push({
      id: "pending-applications",

      severity: pendingStudents >= 50 ? "high" : "medium",

      title: "Eligible students have not applied",

      description: `${pendingStudents} eligible students have not submitted an application.`,

      actionLabel: "View Students",

      actionType: "students",

      metadata: {
        pendingStudents,
      },
    });
  }

  if (failureBreakdown.optOut > 0) {
    actions.push({
      id: "opted-out",

      severity: "medium",

      title: "Students opted out",

      description: `${failureBreakdown.optOut} students have opted out of placements.`,

      actionLabel: "View Students",

      actionType: "students",
    });
  }

  roleAnalytics.forEach((role) => {
    if (role.applicationRate < 20) {
      actions.push({
        id: `role-${role.roleId}`,

        severity: "medium",

        title: `${role.roleName} has low interest`,

        description: `${role.applied} applications received for ${role.openings} openings.`,

        actionLabel: "View Role",

        actionType: "role",

        metadata: {
          roleId: role.roleId,
        },
      });
    }
  });

  return actions;
}

export function evaluateStudentEligibility(
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

 const studentGraduationYear = Number(academic?.graduation_year);

const allowedGraduationYears = (criteria.graduationYears ?? [])
  .map((year) => Number(year))
  .filter((year) => !Number.isNaN(year));

if (
  allowedGraduationYears.length > 0 &&
  academic &&
  !allowedGraduationYears.includes(studentGraduationYear)
) {
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

  console.log("========== Eligibility Debug ==========");
  console.log("Student:", student);
  console.log("is_active =", student.is_active);
  console.log("placement_preference =", student.placement_preference);
  console.log("Academic:", academic);
  console.dir(criteria, { depth: null });
  console.dir(failureReasons, { depth: null });

  for (const reason of failureReasons) {
    console.log("FAILED:", reason.code, "-", reason.message);
  }
  console.log("Eligible:", failureReasons.length === 0);
  console.log("======================================");

  return {
    studentId: student.student_id,

    eligible: failureReasons.length === 0,

    failureReasons,
  };
}

export async function getRecruitmentEligibilityAnalytics(
  draftId: string,
): Promise<EligibilityAnalyticsResult> {
  const context = await loadRecruitmentContext(draftId);

  const criteria = await loadRecruitmentEligibilityCriteria(draftId);

  const { students, academicMap } = await loadStudents();

  const { restrictionMap, placementMap, overrideMap } = await loadEligibilitySupportData(context);

  const studentResults: StudentEligibilityResult[] = [];

  const restrictedEligibleStudents: EligibilityAnalyticsResult["restrictedEligibleStudents"] = [];

  const placedEligibleStudents: EligibilityAnalyticsResult["placedEligibleStudents"] = [];

  const applicantIds = await loadApplicantIds(context);

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
    console.log("========= BEFORE ENGINE =========");
    console.log(student);
    console.log({
      student_id: student.student_id,
      is_active: student.is_active,
      placement_preference: student.placement_preference,
      placement_status: student.placement_status,
    });
    console.log("===============================");
    const result = evaluateStudentEligibility(
      student,
      academicMap.get(student.student_id),
      criteria,
    );

    studentResults.push(result);

    if (result.eligible) {
      eligibleStudents++;

      eligibleStudentIds.add(student.student_id);

      const academic = academicMap.get(student.student_id);

      const restriction = restrictionMap.get(student.student_id);

      const override = overrideMap.get(student.student_id);

      const hasRestrictedOverride = override?.restricted === true;

      const hasPlacedOverride = override?.placed === true;

      if (restriction && !hasRestrictedOverride && !applicantIds.has(student.student_id)) {
        restrictedEligibleStudents.push({
          studentId: student.student_id,
          fullName: buildStudentFullName(student),

          enrollmentNumber: student.enrollment_no ?? "",
          institute: academic?.current_institute_name ?? null,
          branch: academic?.current_branch_name ?? null,
          restrictionReason: restriction.restriction_reason ?? "Restricted",
        });
      }

      const placement = placementMap.get(student.student_id);

      if (placement && !hasPlacedOverride && !applicantIds.has(student.student_id)) {
        placedEligibleStudents.push({
          studentId: student.student_id,
          fullName: buildStudentFullName(student),

          enrollmentNumber: student.enrollment_no ?? "",
          institute: academic?.current_institute_name ?? null,
          branch: academic?.current_branch_name ?? null,
          companyName: placement.company_name ?? null,
          packageLpa: placement.package_lpa ?? null,
        });
      }

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

  const roles = await loadRecruitmentRoles(context);

  const selectedRoleCounts = await loadSelectedRoles(context);

  const roleAnalytics = roles.map((role) => {
    const applied = selectedRoleCounts.get(role.roleId) ?? 0;

    const applicationRate =
      eligibleStudents === 0 ? 0 : Number(((applied / eligibleStudents) * 100).toFixed(1));

    return {
      roleId: role.roleId,

      roleName: role.roleName,

      eligible: eligibleStudents,

      applied,

      openings: role.openings,

      applicationRate,

      applicationsPerOpening:
        role.openings === 0 ? 0 : Number((applied / role.openings).toFixed(1)),
    };
  });

  const actionCenter = buildActionCenter(
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

    pendingEligibleStudents: Math.max(eligibleStudents - applicantIds.size, 0),

    applicationRate: 0,

    coverageByInstitute,

    coverageByDegree,

    coverageByBranch,

    coverageByGraduationYear,

    roleAnalytics,

    actionCenter,

    failureBreakdown,

    studentResults,

    restrictedEligibleStudents,

    placedEligibleStudents,
  };
}
