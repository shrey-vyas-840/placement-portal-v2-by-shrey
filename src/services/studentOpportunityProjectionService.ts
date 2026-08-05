import { supabase } from "@/lib/supabase";
import {
  type RecruitmentEligibilityCriteria,
  type StudentAcademicRecord,
  type StudentMasterRecord,
} from "@/services/recruitmentEligibilityAnalyticsService";

type AnyRecord = Record<string, any>;

const db = supabase as any;
const PROJECTION_TABLE = "student_opportunity_projection";
const PROJECTION_EVALUATION_VERSION = 1;

type ProjectionLifecycleStatus = "EMPTY" | "BUILDING" | "READY" | "STALE";

let projectionLifecycleStatus: ProjectionLifecycleStatus = "EMPTY";
let projectionInitializationPromise: Promise<void> | null = null;
let projectionRebuildPromise: Promise<ProjectionRefreshResult> | null = null;

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
  projection_id: string;

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

  evaluation_version: number;
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

function cyrb128(value: string) {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let i = 0; i < value.length; i += 1) {
    const k = value.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h2) >>> 0];
}

function makeProjectionRecordId(studentId: string, opportunityId: string) {
  const hex = cyrb128(makeProjectionKey(studentId, opportunityId))
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("");

  const timeLow = hex.slice(0, 8);
  const timeMid = hex.slice(8, 12);
  const timeHiAndVersion = `5${hex.slice(13, 16)}`;
  const clockSeqHiAndReserved = `${((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)}${hex.slice(
    17,
    20,
  )}`;
  const node = hex.slice(20, 32);

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeqHiAndReserved}-${node}`;
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
  if (!academic) {
    return {
      isVisible: false,
      visibilityStatus: "NOT_VISIBLE" as ProjectionVisibilityStatus,
      visibilityFailures: [],
    };
  }

  const allowedBranches = splitCsvList(eligibilityRow?.allowed_branches ?? null);

  const allowedYears = splitNumberList(eligibilityRow?.passing_out_batches ?? null);

  const branchMatch =
    allowedBranches.length === 0 ||
    allowedBranches.includes(String(academic.current_branch_name ?? ""));

  const yearMatch =
    allowedYears.length === 0 || allowedYears.includes(Number(academic.graduation_year));

  if (branchMatch && yearMatch) {
    return {
      isVisible: true,
      visibilityStatus: "VISIBLE" as ProjectionVisibilityStatus,
      visibilityFailures: [],
    };
  }

  return {
    isVisible: false,
    visibilityStatus: "NOT_VISIBLE" as ProjectionVisibilityStatus,
    visibilityFailures: [],
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
  const academic = input.academic;

  const failures: ProjectionFailureReason[] = [];

  if (!academic) {
    return {
      isEligible: false,
      eligibilityStatus: "NOT_EVALUATED" as ProjectionEligibilityStatus,
      eligibilityFailures: [] as ProjectionFailureReason[],
      resolvedPlacementStatus: input.student.placement_status ?? null,
    };
  }

  if (
    criteria.institutes.length > 0 &&
    !criteria.institutes.includes(academic.current_institute_name ?? "")
  ) {
    failures.push({
      code: "INSTITUTE",
      title: "Institute Not Eligible",
      message: "Institute is not eligible.",
      source: "ELIGIBILITY",
      expected: criteria.institutes,
      actual: academic.current_institute_name ?? null,
    });
  }

  if (
    criteria.degrees.length > 0 &&
    !criteria.degrees.includes(academic.current_degree_name ?? "")
  ) {
    failures.push({
      code: "DEGREE",
      title: "Degree Not Eligible",
      message: "Degree is not eligible.",
      source: "ELIGIBILITY",
      expected: criteria.degrees,
      actual: academic.current_degree_name ?? null,
    });
  }

  if (criteria.minimumCgpa !== null && Number(academic.current_cgpa ?? 0) < criteria.minimumCgpa) {
    failures.push({
      code: "CGPA",
      title: "CGPA Below Requirement",
      message: "CGPA is below the minimum requirement.",
      source: "ELIGIBILITY",
      expected: criteria.minimumCgpa,
      actual: academic.current_cgpa ?? null,
    });
  }

  if (
    criteria.maximumActiveBacklogs !== null &&
    Number(academic.active_backlogs ?? 0) > criteria.maximumActiveBacklogs
  ) {
    failures.push({
      code: "BACKLOG",
      title: "Backlog Limit Exceeded",
      message: "Backlog limit exceeded.",
      source: "ELIGIBILITY",
      expected: criteria.maximumActiveBacklogs,
      actual: academic.active_backlogs ?? null,
    });
  }

  const eligibilityStatus: ProjectionEligibilityStatus =
    failures.length === 0 ? "ELIGIBLE" : "INELIGIBLE";

  return {
    isEligible: failures.length === 0,
    eligibilityStatus,
    eligibilityFailures: failures,
    resolvedPlacementStatus: input.student.placement_status ?? null,
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

const restrictionOverridden =
  restrictionActive && input.overrideState.restricted;

const restrictionStatus: ProjectionRestrictionStatus = restrictionActive
  ? restrictionOverridden
    ? "OVERRIDDEN"
    : "RESTRICTED"
  : "ALLOWED";

const driveSettings = input.opportunity.drive_master ?? {};

const placementAllowed =
  !input.student.placement_status ||
  input.student.placement_status === "Unplaced" ||
  driveSettings.allow_placed_students === true ||
  input.overrideState.placed;

const participationAllowed =
  input.student.placement_preference === "Interested";

const restrictionAllowed =
  !restrictionActive ||
  driveSettings.allow_restricted_students === true ||
  restrictionOverridden;

/*
 * Final business eligibility
 *
 * Total Opportunities:
 *   Branch + Passing Year
 *
 * Eligible:
 *   Stage-2 eligibility
 *   AND participation
 *   AND restriction
 *   AND placement
 */
const finalEligible =
  eligibility.isEligible &&
  participationAllowed &&
  placementAllowed &&
  restrictionAllowed;

const finalEligibilityStatus: ProjectionEligibilityStatus =
  finalEligible ? "ELIGIBLE" : "INELIGIBLE";

const alreadyApplied = !!input.applicationRecord;

  return {
    projection_id: makeProjectionRecordId(
      input.student.student_id,
      input.opportunity.opportunity_id,
    ),

    student_id: input.student.student_id,

    opportunity_id: input.opportunity.opportunity_id,

    drive_id: input.opportunity.drive_id,

    is_visible: visibility.isVisible,

    visibility_status: visibility.visibilityStatus,

    visibility_failures: visibility.visibilityFailures,

    is_eligible: finalEligible,

    eligibility_status: finalEligibilityStatus,

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

  /*
   * Dashboard universe
   *
   * Student dashboard must contain every published recruitment
   * that is NOT archived.
   *
   * It must NOT depend on visible_to_students because visibility
   * is only for the Student Opportunities page.
   */

  let publishedDriveIds: string[] = [];

  const publishedRecruitmentsQuery = db
    .from("recruitment_drafts")
    .select("created_drive_id")
    .eq("status", "PUBLISHED")
    .eq("is_archived", false);

  if (driveIdsFilter.length > 0) {
    publishedRecruitmentsQuery.in("created_drive_id", driveIdsFilter);
  }

  const { data: publishedRecruitments, error: publishedRecruitmentsError } =
    await publishedRecruitmentsQuery;

  if (publishedRecruitmentsError) {
    throw publishedRecruitmentsError;
  }

  publishedDriveIds = uniqueStrings(
    (publishedRecruitments ?? []).map((row: any) => row.created_drive_id),
  );

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
    .order("created_at", { ascending: false });

  if (opportunityIdsFilter.length > 0) {
    opportunitiesQuery = opportunitiesQuery.in("opportunity_id", opportunityIdsFilter);
  } else {
    opportunitiesQuery = opportunitiesQuery.in(
      "drive_id",
      publishedDriveIds.length > 0 ? publishedDriveIds : ["__NO_MATCH__"],
    );
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
    if (!academic) {
      continue;
    }

    /*
     * Stage-1 business rule
     *
     * Only students whose Branch + Passing Year belong to this
     * recruitment should receive a projection row.
     *
     * The visibility engine is the single source of truth.
     */
    const visibility = buildVisibilityResult(academic, eligibilityRow);

    if (!visibility.isVisible) {
      continue;
    }

    const activeRestriction = universe.restrictionMap.get(String(student.student_id)) ?? null;

    const overrideState = universe.overrideMap.get(
      makeProjectionKey(String(student.student_id), String(opportunity.opportunity_id)),
    ) ?? { restricted: false, placed: false };
    const applicationRecord =
      universe.applicationMap.get(
        makeProjectionKey(String(student.student_id), String(opportunity.opportunity_id)),
      ) ?? null;

    const row = buildProjectionRow({
      student,
      academic,
      opportunity,
      eligibilityRow,
      activeRestriction,
      overrideState,
      applicationRecord,
      nowIso,
    });

    // Stage-1 visibility must match Student Opportunities page.
    // Hidden opportunities are NOT part of the student's dashboard universe.

    rows.push(row);
  }

  return rows;
}

async function clearProjectionTable() {
  const { error } = await db.from(PROJECTION_TABLE).delete().gte("evaluation_version", 0);

  if (error) {
    throw error;
  }
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

async function getProjectionRowCount(): Promise<number> {
  const { count, error } = await db
    .from(PROJECTION_TABLE)
    .select("projection_id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

async function upsertProjectionRows(rows: StudentOpportunityProjectionRecord[]) {
  for (const batch of chunkArray(rows, 250)) {
    if (batch.length === 0) continue;

    const { error } = await db.from(PROJECTION_TABLE).upsert(batch, {
      onConflict: "projection_id",
    });

    if (error) throw error;
  }
}

async function rebuildProjectionInternal(): Promise<ProjectionRefreshResult> {
  if (projectionRebuildPromise) {
    return projectionRebuildPromise;
  }

  projectionLifecycleStatus = "BUILDING";

  projectionRebuildPromise = (async () => {
    try {
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
          await upsertProjectionRows(rows);
        }
      }

      projectionLifecycleStatus = "READY";

      return {
        rowsWritten,
        opportunitiesProcessed,
      };
    } catch (error) {
      projectionLifecycleStatus = "STALE";
      throw error;
    } finally {
      projectionRebuildPromise = null;
    }
  })();

  return projectionRebuildPromise;
}

async function ensureProjectionInitializedInternal(): Promise<void> {
  if (projectionLifecycleStatus === "READY") {
    return;
  }

  if (projectionRebuildPromise) {
    await projectionRebuildPromise;
    return;
  }

  if (projectionInitializationPromise) {
    await projectionInitializationPromise;
    return;
  }

  projectionInitializationPromise = (async () => {
    const rowCount = await getProjectionRowCount();

    if (rowCount > 0) {
      projectionLifecycleStatus = "READY";
      return;
    }

    await rebuildProjectionInternal();
  })()
    .catch((error) => {
      projectionLifecycleStatus = "STALE";
      throw error;
    })
    .finally(() => {
      projectionInitializationPromise = null;
    });

  await projectionInitializationPromise;
}

async function refreshStudentInternal(studentId: string): Promise<ProjectionRefreshResult> {
  await ensureProjectionInitializedInternal();

  const { data: studentRow, error } = await db
    .from("student_master")
    .select("student_id")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw error;

  if (!studentRow) {
    await clearProjectionRowsForStudent(studentId);
    projectionLifecycleStatus = "READY";
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

  await clearProjectionRowsForStudent(studentId);
  await upsertProjectionRows(allRows);

  projectionLifecycleStatus = "READY";

  return {
    rowsWritten: allRows.length,
    opportunitiesProcessed: universe.opportunities.length,
  };
}

async function refreshOpportunityInternal(opportunityId: string): Promise<ProjectionRefreshResult> {
  await ensureProjectionInitializedInternal();

  const { data: opportunityRow, error } = await db
    .from("opportunity_master")
    .select(
      `
    opportunity_id,
    drive_id,
    visible_to_students
`,
    )
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (error) throw error;

  /*
   * Historical dashboard rule
   *
   * An opportunity becoming invisible to students after its
   * application window closes must NOT remove historical
   * analytics.
   *
   * Only remove projection rows when the production
   * opportunity itself no longer exists.
   */
  if (!opportunityRow) {
    await clearProjectionRowsForOpportunity(opportunityId);

    projectionLifecycleStatus = "READY";

    return {
      rowsWritten: 0,
      opportunitiesProcessed: 0,
    };
  }

  const universe = await loadProjectionUniverse({ opportunityIds: [opportunityId] });
  const opportunity = universe.opportunities[0];

  /*
   * Opportunity not found in the analytics universe.
   *
   * This means either:
   * - the production opportunity no longer exists, or
   * - its recruitment has been archived.
   *
   * In either case, remove its projection rows.
   */
  if (!opportunity) {
    await clearProjectionRowsForOpportunity(opportunityId);

    projectionLifecycleStatus = "READY";

    return {
      rowsWritten: 0,
      opportunitiesProcessed: 0,
    };
  }

  const nowIso = new Date().toISOString();
  const rows = buildProjectionRowsForOpportunity(opportunity, universe, nowIso);

  await clearProjectionRowsForOpportunity(opportunityId);
  await upsertProjectionRows(rows);

  projectionLifecycleStatus = "READY";

  return {
    rowsWritten: rows.length,
    opportunitiesProcessed: 1,
  };
}

async function refreshRecruitmentInternal(driveId: string): Promise<ProjectionRefreshResult> {
  await ensureProjectionInitializedInternal();

  const { data: driveRow, error } = await db
    .from("drive_master")
    .select(
      `
        drive_id,
        is_active,
        is_deleted
      `,
    )
    .eq("drive_id", driveId)
    .maybeSingle();

  if (error) throw error;

  if (!driveRow || driveRow.is_active !== true || driveRow.is_deleted === true) {
    await clearProjectionRowsForDrive(driveId);
    projectionLifecycleStatus = "READY";
    return {
      rowsWritten: 0,
      opportunitiesProcessed: 0,
    };
  }

  const universe = await loadProjectionUniverse({ driveIds: [driveId] });

  if (universe.opportunities.length === 0) {
    await clearProjectionRowsForDrive(driveId);
    projectionLifecycleStatus = "READY";
    return {
      rowsWritten: 0,
      opportunitiesProcessed: 0,
    };
  }

  const nowIso = new Date().toISOString();

  const allRows: StudentOpportunityProjectionRecord[] = [];
  for (const opportunity of universe.opportunities) {
    allRows.push(...buildProjectionRowsForOpportunity(opportunity, universe, nowIso));
  }

  await clearProjectionRowsForDrive(driveId);
  await upsertProjectionRows(allRows);

  projectionLifecycleStatus = "READY";

  return {
    rowsWritten: allRows.length,
    opportunitiesProcessed: universe.opportunities.length,
  };
}

export const studentOpportunityProjectionService = {
  ensureProjectionInitialized: ensureProjectionInitializedInternal,
  rebuildProjection: rebuildProjectionInternal,
  refreshStudent: refreshStudentInternal,
  refreshOpportunity: refreshOpportunityInternal,
  refreshRecruitment: refreshRecruitmentInternal,
};

if (typeof window !== "undefined") {
  queueMicrotask(() => {
    void ensureProjectionInitializedInternal().catch((error) => {
      console.warn("studentOpportunityProjectionService bootstrap failed", error);
    });
  });
}

export default studentOpportunityProjectionService;
