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

function incrementCounter(
  map: Map<string, number>,
  key: string,
) {

  map.set(
    key,
    (map.get(key) ?? 0) + 1,
  );

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

  const eligibility =
    draft?.eligibility_data ?? {};

  return {

    institutes:
      eligibility.selectedInstitutes ??
      eligibility.institutes ??
      [],

    degrees:
      eligibility.selectedDegrees ??
      eligibility.degrees ??
      [],

    branches:
      eligibility.selectedBranches ??
      eligibility.branches ??
      [],

    graduationYears:
      eligibility.selectedGraduationYears ??
      eligibility.graduationYears ??
      [],

    minimumCgpa:
      eligibility.minimumCgpa ??
      eligibility.minimum_cgpa ??
      null,

    maximumActiveBacklogs:
      eligibility.maximumActiveBacklogs ??
      eligibility.maximum_backlogs ??
      null,

    maximumYearGap:
      eligibility.maximumYearGap ??
      eligibility.maximum_year_gap ??
      null,

  };

}

async function loadStudents() {

  const [{ data: students }, { data: academics }] =
    await Promise.all([

      (supabase as any)

        .from("student_master")

        .select(`
          student_id,
          placement_preference,
          is_active
        `),

      (supabase as any)

        .from("student_academic_details")

        .select(`
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

  const academicMap =
    new Map<string, StudentAcademicRecord>();

  (academics ?? []).forEach(
    (academic: StudentAcademicRecord) => {

      academicMap.set(
        academic.student_id,
        academic,
      );

    },
  );

  return {

    students:
      (students ??
        []) as StudentMasterRecord[],

    academicMap,

  };

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

  if (
    student.placement_preference !==
    "Interested"
  ) {

    failureReasons.push({
      code: "OPT_OUT",
      message: "Student has opted out of placements.",
    });

  }

  if (
    academic &&
    !matchesStringRule(
      criteria.institutes,
      academic.current_institute_name,
    )
  ) {

    failureReasons.push({
      code: "INSTITUTE",
      message: "Institute is not eligible.",
    });

  }

  if (
    academic &&
    !matchesStringRule(
      criteria.degrees,
      academic.current_degree_name,
    )
  ) {

    failureReasons.push({
      code: "DEGREE",
      message: "Degree is not eligible.",
    });

  }

  if (
    academic &&
    !matchesStringRule(
      criteria.branches,
      academic.current_branch_name,
    )
  ) {

    failureReasons.push({
      code: "BRANCH",
      message: "Branch is not eligible.",
    });

  }

  if (
    academic &&
    !matchesNumberRule(
      criteria.graduationYears,
      academic.graduation_year,
    )
  ) {

    failureReasons.push({
      code: "GRADUATION_YEAR",
      message: "Graduation year is not eligible.",
    });

  }

  if (
    academic &&
    criteria.minimumCgpa !== null &&
    (academic.current_cgpa ?? 0) <
      criteria.minimumCgpa
  ) {

    failureReasons.push({
      code: "CGPA",
      message: "CGPA is below the minimum requirement.",
    });

  }

  if (
    academic &&
    criteria.maximumActiveBacklogs !== null &&
    (academic.active_backlogs ?? 0) >
      criteria.maximumActiveBacklogs
  ) {

    failureReasons.push({
      code: "BACKLOG",
      message: "Backlog limit exceeded.",
    });

  }

  if (
    academic &&
    criteria.maximumYearGap !== null &&
    (academic.year_gap_count ?? 0) >
      criteria.maximumYearGap
  ) {

    failureReasons.push({
      code: "YEAR_GAP",
      message: "Year gap exceeds the allowed limit.",
    });

  }

  return {

    studentId: student.student_id,

    eligible:
      failureReasons.length === 0,

    failureReasons,

  };

}

export async function getRecruitmentEligibilityAnalytics(
  draftId: string,
): Promise<EligibilityAnalyticsResult> {

  const criteria =
    await loadRecruitmentEligibilityCriteria(
      draftId,
    );

  const {
    students,
    academicMap,
  } = await loadStudents();

  const studentResults: StudentEligibilityResult[] = [];

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

    if (
      student.placement_preference ===
      "Interested"
    ) {

      optedInStudents++;

    } else {

      optedOutStudents++;

    }

    const result =
      evaluateStudentEligibility(
        student,
        academicMap.get(
          student.student_id,
        ),
        criteria,
      );

    studentResults.push(result);

    if (result.eligible) {

      eligibleStudents++;

      continue;

    }

    result.failureReasons.forEach(
      (reason) => {

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

      },
    );

  }

  return {

    totalStudents:
      students.length,

    activeStudents,

    optedInStudents,

    optedOutStudents,

    eligibleStudents,

    pendingEligibleStudents:
      eligibleStudents,

    applicationRate: 0,

    coverageByInstitute: [],

    coverageByDegree: [],

    coverageByBranch: [],

    coverageByGraduationYear: [],

    roleAnalytics: [],

    failureBreakdown,

    studentResults,

  };

}

