import { supabase } from "@/lib/supabase";
import {
  evaluateStudentEligibility,
  type EligibilityFailureReason,
  type RecruitmentEligibilityCriteria,
  type StudentAcademicRecord,
  type StudentMasterRecord,
} from "@/services/recruitmentEligibilityAnalyticsService";

type AnyRecord = Record<string, any>;

const db = supabase as any;
const PROJECTION_TABLE = "student_opportunity_projection";
const PROJECTION_EVALUATION_VERSION = "v1";

export type ProjectionVisibilityStatus = "VISIBLE" | "NOT_VISIBLE";
export type ProjectionEligibilityStatus = "ELIGIBLE" | "INELIGIBLE" | "NOT_EVALUATED";
export type ProjectionRestrictionStatus = "ALLOWED" | "RESTRICTED" | "OVERRIDDEN";
export type ProjectionAttendanceStatus = "PRESENT" | "ABSENT" | null;

export interface ProjectionFailureReason {
  code: string;

  title: string;

  message: string;

  source: "VISIBILITY" | "ELIGIBILITY" | "RESTRICTION" | "PLACEMENT" | "PARTICIPATION";

  expected?: unknown;

  actual?: unknown;
}

export interface StudentOpportunityProjectionRecord {
  student_id: string;

  opportunity_id: string;

  drive_id: string;

  is_visible: boolean;

  visibility_status: ProjectionVisibilityStatus;

  visibility_failures: ProjectionFailureReason[];

  is_eligible: boolean;

  eligibility_status: ProjectionEligibilityStatus;

  eligibility_failures: ProjectionFailureReason[];

  restriction_status: ProjectionRestrictionStatus;

  restriction_active: boolean;

  restriction_type: string | null;

  restriction_reason: string | null;

  participation_allowed: boolean;

  placement_allowed: boolean;

  already_applied: boolean;

  applied: boolean;

  registered: boolean;

  application_status_snapshot: string | null;

  placement_status_snapshot: string | null;

  placement_preference_snapshot: string | null;

  attendance_status_snapshot: ProjectionAttendanceStatus;

  // TODO:
  // Attendance engine will populate these fields when
  // attendance workflow is implemented.
  present: boolean;

  absent: boolean;

  computed_at: string;

  updated_at: string;

  evaluation_version: string;
}

export interface ProjectionRefreshResult {
  rowsWritten: number;
  opportunitiesProcessed: number;
}
interface LoadedOpportunityRecord extends AnyRecord {
  opportunity_id: string;
  drive_id: string;
  opportunity_title?: string | null;
  application_status?: string | null;
  visible_to_students?: boolean | null;
  application_start_date?: string | null;
  application_end_date?: string | null;
  created_at?: string | null;
  drive_master?: AnyRecord | null;
}

interface LoadedEligibilityRecord extends AnyRecord {
  drive_id: string;
  allowed_institutes?: string[] | string | null;
  allowed_degrees?: string[] | string | null;
  allowed_branches?: string[] | string | null;
  passing_out_batches?: Array<string | number> | string | number | null;
  minimum_cgpa?: number | null;
  maximum_active_backlogs?: number | null;
  additional_requirements?: unknown;
  created_at?: string | null;
}

interface LoadedRestrictionRecord extends AnyRecord {
  student_id: string;
  restriction_reason?: string | null;
  restriction_type?: string | null;
}

// Placement history is intentionally NOT loaded into the projection.
//
// Eligibility is evaluated exclusively using
// student_master.placement_status.
//
// Historical placements are analytics data and must never
// influence current eligibility.

interface LoadedOverrideRecord extends AnyRecord {
  student_id: string;
  opportunity_id: string;
  override_type: string;
  is_active?: boolean | null;
}

interface LoadedApplicationRecord extends AnyRecord {
  application_id: string;
  opportunity_id: string;
  student_id: string;
  application_status?: string | null;
  applied_at?: string | null;
  updated_at?: string | null;
}

interface ProjectionLoadOptions {
  studentIds?: string[];
  opportunityIds?: string[];
  driveIds?: string[];
}

interface ProjectionUniverse {
  students: StudentMasterRecord[];
  academicMap: Map<string, StudentAcademicRecord>;
  opportunities: LoadedOpportunityRecord[];
  eligibilityMap: Map<string, LoadedEligibilityRecord>;
  restrictionMap: Map<string, LoadedRestrictionRecord>;
  overrideMap: Map<string, { restricted: boolean; placed: boolean }>;
  applicationMap: Map<string, LoadedApplicationRecord>;
}

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  if (size <= 0) return [items];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function makeProjectionKey(studentId: string, opportunityId: string) {
  return `${studentId}::${opportunityId}`;
}

function splitCsvList(
  value?: string | string[] | number | Array<string | number> | null,
): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .replace(/[{}"]/g, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitNumberList(
  value?: string | string[] | number | Array<string | number> | null,
): number[] {
  return splitCsvList(value)
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
}

function toProjectionFailures(
  failureReasons: Array<EligibilityFailureReason | ProjectionFailureReason>,
): ProjectionFailureReason[] {
  return failureReasons.map((reason) => {
    const projectionReason = reason as ProjectionFailureReason;

    return {
      code: String(reason.code),

      title:
        projectionReason.title ??
        String(reason.code)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),

      message: String(reason.message),

      source: projectionReason.source ?? "ELIGIBILITY",

      expected: projectionReason.expected,

      actual: projectionReason.actual,
    };
  });
}

function buildCriteriaFromEligibilityRow(
  eligibilityRow: LoadedEligibilityRecord | null | undefined,
): RecruitmentEligibilityCriteria {
  return {
    institutes: splitCsvList(eligibilityRow?.allowed_institutes ?? null),
    degrees: splitCsvList(eligibilityRow?.allowed_degrees ?? null),
    branches: splitCsvList(eligibilityRow?.allowed_branches ?? null),
    graduationYears: splitNumberList(eligibilityRow?.passing_out_batches ?? null),
    minimumCgpa:
      eligibilityRow?.minimum_cgpa === null || eligibilityRow?.minimum_cgpa === undefined
        ? null
        : Number(eligibilityRow.minimum_cgpa),
    maximumActiveBacklogs:
      eligibilityRow?.maximum_active_backlogs === null ||
      eligibilityRow?.maximum_active_backlogs === undefined
        ? null
        : Number(eligibilityRow.maximum_active_backlogs),
    maximumYearGap: null,
  };
}

function buildVisibilityResult(
  academic: StudentAcademicRecord | undefined,
  eligibilityRow: LoadedEligibilityRecord | null | undefined,
) {
  const failures: ProjectionFailureReason[] = [];

  const allowedBranches = splitCsvList(eligibilityRow?.allowed_branches ?? null);

  const allowedYears = splitNumberList(eligibilityRow?.passing_out_batches ?? null);

  if (!academic) {
    return {
      isVisible: false,
      visibilityStatus: "NOT_VISIBLE" as ProjectionVisibilityStatus,
      visibilityFailures: [
        {
          code: "BRANCH",
          title: "Branch Not Eligible",
          message: "Branch is not eligible.",
          source: "VISIBILITY",
        },
        {
          code: "GRADUATION_YEAR",
          title: "Graduation Year Not Eligible",
          message: "Graduation year is not eligible.",
          source: "VISIBILITY",
        },
      ] satisfies ProjectionFailureReason[],
    };
  }

  if (
    allowedBranches.length > 0 &&
    (!academic.current_branch_name || !allowedBranches.includes(academic.current_branch_name))
  ) {
    failures.push({
      code: "BRANCH",
      title: "Branch Not Eligible",
      message: "Branch is not eligible.",
      source: "VISIBILITY",
      expected: allowedBranches,
      actual: academic.current_branch_name ?? null,
    });
  }

  if (allowedYears.length > 0) {
    const graduationYear = academic.graduation_year;

    if (graduationYear == null || !allowedYears.includes(Number(graduationYear))) {
      failures.push({
        code: "GRADUATION_YEAR",
        title: "Graduation Year Not Eligible",
        message: "Graduation year is not eligible.",
        source: "VISIBILITY",
        expected: allowedYears,
        actual: graduationYear ?? null,
      });
    }
  }

  const visibilityStatus: ProjectionVisibilityStatus =
    failures.length === 0 ? "VISIBLE" : "NOT_VISIBLE";

  return {
    isVisible: failures.length === 0,
    visibilityStatus,
    visibilityFailures: failures,
  };
}

function buildEligibilityResult(input: {
  student: StudentMasterRecord;
  academic: StudentAcademicRecord | undefined;
  eligibilityRow: LoadedEligibilityRecord | null | undefined;
  activeRestriction: LoadedRestrictionRecord | null;
  overrideState: {
    restricted: boolean;
    placed: boolean;
  };
}) {
  const criteria = buildCriteriaFromEligibilityRow(input.eligibilityRow);

  const engineResult = evaluateStudentEligibility(input.student, input.academic, criteria);

  const failures: ProjectionFailureReason[] = toProjectionFailures(engineResult.failureReasons);

  if (input.activeRestriction && !input.overrideState.restricted) {
    failures.push({
      code: "RESTRICTION",
      title: "Student Restricted",
      message:
        input.activeRestriction.restriction_reason ??
        "Placement activities are currently restricted.",
      source: "RESTRICTION",
      actual: input.activeRestriction.restriction_type ?? null,
    });
  }

  const placementStatus = input.student.placement_status;

  if (placementStatus && placementStatus !== "Unplaced" && !input.overrideState.placed) {
    failures.push({
      code: "PLACEMENT_STATUS",
      title: "Student Already Placed",
      message: "Student has already been placed.",
      source: "PLACEMENT",
      actual: placementStatus,
    });
  }

  const eligibilityStatus: ProjectionEligibilityStatus =
    failures.length === 0 ? "ELIGIBLE" : "INELIGIBLE";

  return {
    isEligible: failures.length === 0,
    eligibilityStatus,
    eligibilityFailures: failures,
    resolvedPlacementStatus: placementStatus ?? null,
  };
}

function buildProjectionRow(input: {
  student: StudentMasterRecord;
  academic: StudentAcademicRecord | undefined;
  opportunity: LoadedOpportunityRecord;
  eligibilityRow: LoadedEligibilityRecord | null | undefined;
  activeRestriction: LoadedRestrictionRecord | null;
  overrideState: {
    restricted: boolean;
    placed: boolean;
  };
  applicationRecord: LoadedApplicationRecord | null;
  nowIso: string;
}): StudentOpportunityProjectionRecord {
  const visibility = buildVisibilityResult(input.academic, input.eligibilityRow);

  const eligibility = visibility.isVisible
    ? buildEligibilityResult({
        student: input.student,
        academic: input.academic,
        eligibilityRow: input.eligibilityRow,
        activeRestriction: input.activeRestriction,
        overrideState: input.overrideState,
      })
    : {
        isEligible: false,
        eligibilityStatus: "NOT_EVALUATED" as ProjectionEligibilityStatus,
        eligibilityFailures: [] as ProjectionFailureReason[],
        resolvedPlacementStatus: input.student.placement_status ?? null,
      };

  const restrictionActive = !!input.activeRestriction;

  const restrictionStatus: ProjectionRestrictionStatus = restrictionActive
    ? input.overrideState.restricted
      ? "OVERRIDDEN"
      : "RESTRICTED"
    : "ALLOWED";

  const placementAllowed =
    !input.student.placement_status ||
    input.student.placement_status === "Unplaced" ||
    input.overrideState.placed;

  const participationAllowed = !restrictionActive || input.overrideState.restricted;

  const alreadyApplied = !!input.applicationRecord;

  return {
    student_id: input.student.student_id,

    opportunity_id: input.opportunity.opportunity_id,

    drive_id: input.opportunity.drive_id,

    is_visible: visibility.isVisible,

    visibility_status: visibility.visibilityStatus,

    visibility_failures: visibility.visibilityFailures,

    is_eligible: eligibility.isEligible,

    eligibility_status: eligibility.eligibilityStatus,

    eligibility_failures: eligibility.eligibilityFailures,

    restriction_status: restrictionStatus,

    restriction_active: restrictionActive,

    restriction_type: input.activeRestriction?.restriction_type ?? null,

    restriction_reason: input.activeRestriction?.restriction_reason ?? null,

    participation_allowed: participationAllowed,

    placement_allowed: placementAllowed,

    already_applied: alreadyApplied,

    applied: alreadyApplied,

    registered: alreadyApplied,

    application_status_snapshot: input.applicationRecord?.application_status ?? null,

    placement_status_snapshot: eligibility.resolvedPlacementStatus,

    placement_preference_snapshot: input.student.placement_preference ?? null,

    attendance_status_snapshot: null,

    // TODO:
    // Populate when attendance module is implemented.
    present: false,

    // TODO:
    // Populate when attendance module is implemented.
    absent: false,

    computed_at: input.nowIso,

    updated_at: input.nowIso,

    evaluation_version: PROJECTION_EVALUATION_VERSION,
  };
}

async function loadProjectionUniverse(
  options: ProjectionLoadOptions = {},
): Promise<ProjectionUniverse> {
  const studentIdsFilter = uniqueStrings(options.studentIds ?? []);
  const opportunityIdsFilter = uniqueStrings(options.opportunityIds ?? []);
  const driveIdsFilter = uniqueStrings(options.driveIds ?? []);

  let studentsQuery = db
    .from("student_master")
    .select(
      `
      student_id,
      enrollment_no,
      first_name,
      middle_name,
      last_name,
      placement_preference,
      placement_status
    `,
    )
    .order("enrollment_no", { ascending: true });

  if (studentIdsFilter.length > 0) {
    studentsQuery = studentsQuery.in("student_id", studentIdsFilter);
  }

  let academicsQuery = db.from("student_academic_details").select(
    `
        student_id,
        current_institute_name,
        current_degree_name,
        current_branch_name,
        graduation_year,
        current_cgpa,
        active_backlogs,
        year_gap_count
      `,
  );

  if (studentIdsFilter.length > 0) {
    academicsQuery = academicsQuery.in("student_id", studentIdsFilter);
  }

  let opportunitiesQuery = db
    .from("opportunity_master")
    .select(
      `
        opportunity_id,
        drive_id,
        opportunity_title,
        application_status,
        visible_to_students,
        application_start_date,
        application_end_date,
        created_at,
        drive_master (
          drive_id,
          drive_name,
          drive_type,
          drive_mode,
          role_selection_enabled,
          minimum_role_selection,
          maximum_role_selection,
          allow_restricted_students,
          allow_placed_students,
          company_master (
            company_name
          )
        )
      `,
    )
    .eq("visible_to_students", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (opportunityIdsFilter.length > 0) {
    opportunitiesQuery = opportunitiesQuery.in("opportunity_id", opportunityIdsFilter);
  } else if (driveIdsFilter.length > 0) {
    opportunitiesQuery = opportunitiesQuery.in("drive_id", driveIdsFilter);
  }

  const [studentsResult, academicsResult, opportunitiesResult] = await Promise.all([
    studentsQuery,
    academicsQuery,
    opportunitiesQuery,
  ]);

  if (studentsResult.error) throw studentsResult.error;
  if (academicsResult.error) throw academicsResult.error;
  if (opportunitiesResult.error) throw opportunitiesResult.error;

  const students = (studentsResult.data ?? []) as StudentMasterRecord[];
  const academics = (academicsResult.data ?? []) as StudentAcademicRecord[];
  const opportunities = (opportunitiesResult.data ?? []) as LoadedOpportunityRecord[];

  const studentIds = uniqueStrings(students.map((row) => row.student_id));
  const opportunityIds = uniqueStrings(opportunities.map((row) => row.opportunity_id));
  const driveIds = uniqueStrings(opportunities.map((row) => row.drive_id));

  const eligibilityQuery = opportunityIds.length
    ? db
        .from("drive_eligibility")
        .select("*")
        .in("drive_id", driveIds)
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const restrictionQuery = studentIds.length
    ? db.from("student_restrictions").select("*").eq("is_active", true).in("student_id", studentIds)
    : Promise.resolve({ data: [], error: null });

  let applicationQuery: Promise<{ data: any[]; error: any }>;

  if (opportunityIds.length > 0 && studentIdsFilter.length > 0) {
    applicationQuery = db
      .from("student_opportunity_applications")
      .select("*")
      .in("opportunity_id", opportunityIds)
      .in("student_id", studentIdsFilter);
  } else if (opportunityIds.length > 0) {
    applicationQuery = db
      .from("student_opportunity_applications")
      .select("*")
      .in("opportunity_id", opportunityIds);
  } else if (studentIdsFilter.length > 0) {
    applicationQuery = db
      .from("student_opportunity_applications")
      .select("*")
      .in("student_id", studentIdsFilter);
  } else {
    applicationQuery = db.from("student_opportunity_applications").select("*");
  }

  let overrideQuery: Promise<{ data: any[]; error: any }>;

  if (opportunityIds.length > 0 && studentIdsFilter.length > 0) {
    overrideQuery = db
      .from("student_placement_overrides")
      .select("*")
      .eq("is_active", true)
      .in("opportunity_id", opportunityIds)
      .in("student_id", studentIdsFilter);
  } else if (opportunityIds.length > 0) {
    overrideQuery = db
      .from("student_placement_overrides")
      .select("*")
      .eq("is_active", true)
      .in("opportunity_id", opportunityIds);
  } else if (studentIdsFilter.length > 0) {
    overrideQuery = db
      .from("student_placement_overrides")
      .select("*")
      .eq("is_active", true)
      .in("student_id", studentIdsFilter);
  } else {
    overrideQuery = db.from("student_placement_overrides").select("*").eq("is_active", true);
  }

  const [eligibilityResult, restrictionResult, applicationResult, overrideResult] =
    await Promise.all([eligibilityQuery, restrictionQuery, applicationQuery, overrideQuery]);

  if (eligibilityResult.error) throw eligibilityResult.error;
  if (restrictionResult.error) throw restrictionResult.error;

  if (applicationResult.error) throw applicationResult.error;
  if (overrideResult.error) throw overrideResult.error;

  const eligibilityMap = new Map<string, LoadedEligibilityRecord>();
  for (const row of (eligibilityResult.data ?? []) as LoadedEligibilityRecord[]) {
    const driveId = String(row.drive_id);
    if (!eligibilityMap.has(driveId)) {
      eligibilityMap.set(driveId, row);
    }
  }

  const restrictionMap = new Map<string, LoadedRestrictionRecord>();
  for (const row of (restrictionResult.data ?? []) as LoadedRestrictionRecord[]) {
    restrictionMap.set(String(row.student_id), row);
  }

  const applicationMap = new Map<string, LoadedApplicationRecord>();
  for (const row of (applicationResult.data ?? []) as LoadedApplicationRecord[]) {
    applicationMap.set(makeProjectionKey(String(row.student_id), String(row.opportunity_id)), row);
  }

  const overrideMap = new Map<string, { restricted: boolean; placed: boolean }>();
  for (const row of (overrideResult.data ?? []) as LoadedOverrideRecord[]) {
    const key = makeProjectionKey(String(row.student_id), String(row.opportunity_id));
    const current = overrideMap.get(key) ?? { restricted: false, placed: false };

    if (row.override_type === "RESTRICTED") {
      current.restricted = true;
    }

    if (row.override_type === "PLACED") {
      current.placed = true;
    }

    overrideMap.set(key, current);
  }

  const academicMap = new Map<string, StudentAcademicRecord>();
  for (const row of academics) {
    academicMap.set(String(row.student_id), row);
  }

  return {
    students,
    academicMap,
    opportunities,
    eligibilityMap,
    restrictionMap,
    overrideMap,
    applicationMap,
  };
}

function buildProjectionRowsForOpportunity(
  opportunity: LoadedOpportunityRecord,
  universe: ProjectionUniverse,
  nowIso: string,
): StudentOpportunityProjectionRecord[] {
  const rows: StudentOpportunityProjectionRecord[] = [];
  const eligibilityRow = universe.eligibilityMap.get(String(opportunity.drive_id)) ?? null;

  for (const student of universe.students) {
    const academic = universe.academicMap.get(String(student.student_id));
    const activeRestriction = universe.restrictionMap.get(String(student.student_id)) ?? null;

    const overrideState = universe.overrideMap.get(
      makeProjectionKey(String(student.student_id), String(opportunity.opportunity_id)),
    ) ?? { restricted: false, placed: false };
    const applicationRecord =
      universe.applicationMap.get(
        makeProjectionKey(String(student.student_id), String(opportunity.opportunity_id)),
      ) ?? null;

    rows.push(
      buildProjectionRow({
        student,
        academic,
        opportunity,
        eligibilityRow,
        activeRestriction,

        overrideState,
        applicationRecord,
        nowIso,
      }),
    );
  }

  return rows;
}

async function clearProjectionTable() {
  const { error } = await db
    .from(PROJECTION_TABLE)
    .delete()
    .neq("evaluation_version", "__delete_all__");
  if (error) throw error;
}

async function clearProjectionRowsForOpportunity(opportunityId: string) {
  const { error } = await db.from(PROJECTION_TABLE).delete().eq("opportunity_id", opportunityId);
  if (error) throw error;
}

async function clearProjectionRowsForDrive(driveId: string) {
  const { error } = await db.from(PROJECTION_TABLE).delete().eq("drive_id", driveId);
  if (error) throw error;
}

async function clearProjectionRowsForStudent(studentId: string) {
  const { error } = await db.from(PROJECTION_TABLE).delete().eq("student_id", studentId);
  if (error) throw error;
}

async function insertProjectionRows(rows: StudentOpportunityProjectionRecord[]) {
  for (const batch of chunkArray(rows, 250)) {
    if (batch.length === 0) continue;

    const { error } = await db.from(PROJECTION_TABLE).insert(batch);
    if (error) throw error;
  }
}

async function replaceProjectionRowsForOpportunity(
  opportunityId: string,
  rows: StudentOpportunityProjectionRecord[],
) {
  await clearProjectionRowsForOpportunity(opportunityId);
  await insertProjectionRows(rows);
}

async function replaceProjectionRowsForDrive(
  driveId: string,
  rows: StudentOpportunityProjectionRecord[],
) {
  await clearProjectionRowsForDrive(driveId);
  await insertProjectionRows(rows);
}

async function replaceProjectionRowsForStudent(
  studentId: string,
  rows: StudentOpportunityProjectionRecord[],
) {
  await clearProjectionRowsForStudent(studentId);
  await insertProjectionRows(rows);
}

export const studentOpportunityProjectionService = {
  async refreshAll(): Promise<ProjectionRefreshResult> {
    const universe = await loadProjectionUniverse();
    const nowIso = new Date().toISOString();

    await clearProjectionTable();

    let rowsWritten = 0;
    let opportunitiesProcessed = 0;

    for (const opportunity of universe.opportunities) {
      const rows = buildProjectionRowsForOpportunity(opportunity, universe, nowIso);
      opportunitiesProcessed += 1;
      rowsWritten += rows.length;

      if (rows.length > 0) {
        await insertProjectionRows(rows);
      }
    }

    return {
      rowsWritten,
      opportunitiesProcessed,
    };
  },

  async refreshOpportunity(opportunityId: string): Promise<ProjectionRefreshResult> {
    const { data: opportunityRow, error } = await db
      .from("opportunity_master")
      .select(
        `
          opportunity_id,
          drive_id,
          visible_to_students,
          is_deleted
        `,
      )
      .eq("opportunity_id", opportunityId)
      .maybeSingle();

    if (error) throw error;

    if (
      !opportunityRow ||
      opportunityRow.visible_to_students !== true ||
      opportunityRow.is_deleted === true
    ) {
      await clearProjectionRowsForOpportunity(opportunityId);
      return {
        rowsWritten: 0,
        opportunitiesProcessed: 0,
      };
    }

    const universe = await loadProjectionUniverse({ opportunityIds: [opportunityId] });
    const opportunity = universe.opportunities[0];

    if (!opportunity) {
      await clearProjectionRowsForOpportunity(opportunityId);
      return {
        rowsWritten: 0,
        opportunitiesProcessed: 0,
      };
    }

    const nowIso = new Date().toISOString();
    const rows = buildProjectionRowsForOpportunity(opportunity, universe, nowIso);

    await replaceProjectionRowsForOpportunity(opportunityId, rows);

    return {
      rowsWritten: rows.length,
      opportunitiesProcessed: 1,
    };
  },

  async refreshDrive(driveId: string): Promise<ProjectionRefreshResult> {
    const { data: opportunityRows, error } = await db
      .from("opportunity_master")
      .select(
        `
          opportunity_id,
          drive_id,
          visible_to_students,
          is_deleted
        `,
      )
      .eq("drive_id", driveId)
      .eq("visible_to_students", true)
      .eq("is_deleted", false);

    if (error) throw error;

    const opportunityIds = uniqueStrings(
      (opportunityRows ?? []).map((row: any) => String(row.opportunity_id)),
    );

    if (opportunityIds.length === 0) {
      await clearProjectionRowsForDrive(driveId);
      return {
        rowsWritten: 0,
        opportunitiesProcessed: 0,
      };
    }

    const universe = await loadProjectionUniverse({ driveIds: [driveId] });
    const nowIso = new Date().toISOString();

    const allRows: StudentOpportunityProjectionRecord[] = [];
    for (const opportunity of universe.opportunities) {
      allRows.push(...buildProjectionRowsForOpportunity(opportunity, universe, nowIso));
    }

    await replaceProjectionRowsForDrive(driveId, allRows);

    return {
      rowsWritten: allRows.length,
      opportunitiesProcessed: universe.opportunities.length,
    };
  },

  async refreshStudent(studentId: string): Promise<ProjectionRefreshResult> {
    const { data: studentRow, error } = await db
      .from("student_master")
      .select("student_id")
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) throw error;

    if (!studentRow) {
      await clearProjectionRowsForStudent(studentId);
      return {
        rowsWritten: 0,
        opportunitiesProcessed: 0,
      };
    }

    const universe = await loadProjectionUniverse({ studentIds: [studentId] });
    const nowIso = new Date().toISOString();

    const allRows: StudentOpportunityProjectionRecord[] = [];
    for (const opportunity of universe.opportunities) {
      allRows.push(...buildProjectionRowsForOpportunity(opportunity, universe, nowIso));
    }

    await replaceProjectionRowsForStudent(studentId, allRows);

    return {
      rowsWritten: allRows.length,
      opportunitiesProcessed: universe.opportunities.length,
    };
  },

  async getByStudentId(studentId: string): Promise<StudentOpportunityProjectionRecord[]> {
    const { data, error } = await db
      .from(PROJECTION_TABLE)
      .select("*")
      .eq("student_id", studentId)
      .order("opportunity_id", { ascending: true });

    if (error) throw error;
    return toArray<StudentOpportunityProjectionRecord>(data);
  },

  async getByOpportunityId(opportunityId: string): Promise<StudentOpportunityProjectionRecord[]> {
    const { data, error } = await db
      .from(PROJECTION_TABLE)
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("student_id", { ascending: true });

    if (error) throw error;
    return toArray<StudentOpportunityProjectionRecord>(data);
  },

  async getByDriveId(driveId: string): Promise<StudentOpportunityProjectionRecord[]> {
    const { data, error } = await db
      .from(PROJECTION_TABLE)
      .select("*")
      .eq("drive_id", driveId)
      .order("student_id", { ascending: true })
      .order("opportunity_id", { ascending: true });

    if (error) throw error;
    return toArray<StudentOpportunityProjectionRecord>(data);
  },

  async getOne(
    studentId: string,
    opportunityId: string,
  ): Promise<StudentOpportunityProjectionRecord | null> {
    const { data, error } = await db
      .from(PROJECTION_TABLE)
      .select("*")
      .eq("student_id", studentId)
      .eq("opportunity_id", opportunityId)
      .maybeSingle();

    if (error) throw error;
    return (data as StudentOpportunityProjectionRecord | null) ?? null;
  },
};
