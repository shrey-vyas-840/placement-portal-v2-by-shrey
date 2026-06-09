import { supabase } from "@/lib/supabase";

type AnyRecord = Record<string, any>;

const db = supabase as any;

const SELECTED_STATUSES = new Set([
  "Selected",
  "Placed",
  "Hired",
  "Offer Accepted",
  "Offer Accepted ",
  "Joined",
  "Offer Made",
]);

const SHORTLISTED_STATUSES = new Set([
  "Shortlisted",
  "Shortlist",
  "Shortlist Pending",
]);

const PRESENT_STATUSES = new Set(["PRESENT"]);
const ABSENT_STATUSES = new Set(["ABSENT"]);

export interface DashboardKpis {
  totalStudents: number;
  interestedStudents: number;
  unplacedStudents: number;
  placedStudents: number;
  totalDrives: number;
  totalApplications: number;
  shortlistedApplications: number;
  selectedApplications: number;
  selectedStudents: number;
  openOpportunities: number;
  attendanceRecords: number;
  attendancePresent: number;
  attendanceAbsent: number;
  attendanceRate: number;
  placementRate: number;
  applicationConversionRate: number;
  opportunityUtilizationRate: number;
  averageApplicationsPerDrive: number;
  averageAttendancePerDrive: number;
  averageShortlistingPercentage: number;
  averageSelectionPercentage: number;
}

export interface DriveTrendPoint {
  drive_id: string;
  drive_name: string;
  company_name: string | null;
  drive_date: string | null;
  opportunity_count: number;
  application_count: number;
  registered_students: number;
  shortlisted_students: number;
  present_students: number;
  selected_students: number;
}

export interface DriveBranchDistributionPoint {
  branch_name: string;
  student_count: number;
  percentage: number;
}

export interface OpportunityPipelineItem {
  opportunity_id: string;
  opportunity_title: string;
  total_applications: number;
  eligible_students: number;
  applied_students: number;
  registered_students: number;
  present_students: number;
  round_cleared_students: number;
  shortlisted_students: number;
  selected_students: number;
}

export interface OpportunityPipelineReport {
  drive_id: string;
  drive_name: string;
  company_name: string | null;
  eligible_students: number | null;
  applied_students: number;
  registered_students: number;
  present_students: number;
  round_cleared_students: number;
  shortlisted_students: number;
  selected_students: number;
  registration_rate: number;
  attendance_rate: number;
  shortlisting_rate: number;
  selection_rate: number;
  opportunities: OpportunityPipelineItem[];
}

export interface StudentDriveBreakdownItem {
  drive_id: string;
  drive_name: string;
  company_name: string | null;
  status: "PRESENT" | "ABSENT" | "REGISTERED" | "UNREGISTERED";
  application_count: number;
}

export interface StudentDrilldownReport {
  student_id: string;
  enrollment_no: string;
  student_name: string;
  total_active_drives: number;
  eligible_drives: number | null;
  registered_drives: number;
  present_drives: number;
  absent_drives: number;
  unregistered_drives: number;
  applications_count: number;
  shortlisted_count: number;
  selected_count: number;
  attendance_percentage: number;
  drive_breakdown: StudentDriveBreakdownItem[];
}

export interface StudentSearchResult {
  student_id: string;
  user_id: string | null;
  enrollment_no: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  institute_email: string | null;
  personal_email: string | null;
  placement_preference: string | null;
  placement_status: string | null;
  match_sources: string[];
}

export interface RecentActivityItem {
  id: string;
  type: "APPLICATION" | "ATTENDANCE" | "DRIVE" | "OPPORTUNITY" | "ROUND" | "NOC";
  title: string;
  description: string;
  occurred_at: string | null;
  drive_id?: string | null;
  opportunity_id?: string | null;
  student_id?: string | null;
  meta?: AnyRecord;
}

export interface DashboardSnapshot {
  kpis: DashboardKpis;
  driveTrend: DriveTrendPoint[];
  selectedDriveId: string | null;
  branchDistribution: DriveBranchDistributionPoint[];
  pipeline: OpportunityPipelineReport | null;
  studentDrilldown: StudentDrilldownReport | null;
  studentSearchResults: StudentSearchResult[];
  recentActivity: RecentActivityItem[];
  refreshedAt: string;
}

export interface DashboardSnapshotOptions {
  selectedDriveId?: string | null;
  enrollmentNo?: string | null;
  studentSearchQuery?: string | null;
  studentSearchLimit?: number;
  driveTrendLimit?: number;
  recentActivityLimit?: number;
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

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function safeDate(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function fullName(parts: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
}) {
  return [parts.first_name, parts.middle_name, parts.last_name]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function parseDelimitedList(value: unknown) {
  if (value === null || value === undefined) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isSelectedStatus(status?: string | null) {
  return !!status && SELECTED_STATUSES.has(status);
}

function isShortlistedStatus(status?: string | null) {
  return !!status && SHORTLISTED_STATUSES.has(status);
}

function countDistinct(values: Array<string | null | undefined>) {
  return uniqueStrings(values).length;
}

function toFixedNumber(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function evaluateEligibility(student: AnyRecord, rule: AnyRecord) {
  const allowedInstitutes = parseDelimitedList(rule.allowed_institutes);
  const allowedDegrees = parseDelimitedList(rule.allowed_degrees);
  const allowedBranches = parseDelimitedList(rule.allowed_branches);
  const allowedBatches = parseDelimitedList(rule.passing_out_batches);

  if (
    allowedInstitutes.length &&
    !allowedInstitutes.some((item) => normalize(item) === normalize(student.current_institute_name))
  ) {
    return false;
  }

  if (
    allowedDegrees.length &&
    !allowedDegrees.some((item) => normalize(item) === normalize(student.current_degree_level))
  ) {
    return false;
  }

  if (
    allowedBranches.length &&
    !allowedBranches.some((item) => normalize(item) === normalize(student.current_branch_name))
  ) {
    return false;
  }

  const minCgpa = Number(rule.minimum_cgpa);
  if (!Number.isNaN(minCgpa) && minCgpa > 0) {
    const currentCgpa = Number(student.current_cgpa);
    if (Number.isNaN(currentCgpa) || currentCgpa < minCgpa) {
      return false;
    }
  }

  const maxBacklogs = Number(rule.maximum_active_backlogs);
  if (!Number.isNaN(maxBacklogs)) {
    const backlogs = Number(student.active_backlogs ?? 0);
    if (!Number.isNaN(backlogs) && backlogs > maxBacklogs) {
      return false;
    }
  }

  if (allowedBatches.length) {
    const gradYear = String(student.graduation_year ?? "").trim();
    if (!allowedBatches.some((item) => normalize(item) === normalize(gradYear))) {
      return false;
    }
  }

  return true;
}

async function fetchKpis(): Promise<DashboardKpis> {
  const [
    studentsResult,
    drivesResult,
    opportunitiesResult,
    applicationsResult,
    attendanceResult,
  ] = await Promise.all([
    db.from("student_master").select("student_id, placement_preference, placement_status"),
    db
      .from("drive_master")
      .select("drive_id")
      .eq("is_active", true)
      .eq("is_deleted", false),
    db.from("opportunity_master").select("opportunity_id, application_status"),
    db.from("student_opportunity_applications").select("application_id, application_status, student_id"),
    db.from("attendance_records").select("attendance_id, attendance_status"),
  ]);

  const students = toArray<any>(studentsResult.data);
  const drives = toArray<any>(drivesResult.data);
  const opportunities = toArray<any>(opportunitiesResult.data);
  const applications = toArray<any>(applicationsResult.data);
  const attendance = toArray<any>(attendanceResult.data);

  const totalStudents = students.length;
  const interestedStudents = students.filter((item) => item.placement_preference === "Interested").length;
  const unplacedStudents = students.filter((item) => item.placement_status === "Unplaced").length;
  const placedStudents = students.filter((item) => item.placement_status === "Placed").length;

  const totalDrives = drives.length;
  const totalApplications = applications.length;
  const shortlistedApplications = applications.filter((item) => isShortlistedStatus(item.application_status)).length;
  const selectedApplications = applications.filter((item) => isSelectedStatus(item.application_status)).length;
  const selectedStudents = countDistinct(
    applications.filter((item) => isSelectedStatus(item.application_status)).map((item) => item.student_id),
  );
  const openOpportunities = opportunities.filter((item) => item.application_status === "Open").length;

  const attendancePresent = attendance.filter((item) => PRESENT_STATUSES.has(String(item.attendance_status))).length;
  const attendanceAbsent = attendance.filter((item) => ABSENT_STATUSES.has(String(item.attendance_status))).length;
  const attendanceRecords = attendance.length;

  const attendanceRate = percent(attendancePresent, Math.max(attendancePresent + attendanceAbsent, 1));
  const placementRate = percent(placedStudents, Math.max(totalStudents, 1));
  const applicationConversionRate = percent(shortlistedApplications, Math.max(totalApplications, 1));
  const opportunityUtilizationRate = percent(openOpportunities, Math.max(totalDrives, 1));
  const averageApplicationsPerDrive = totalDrives ? toFixedNumber(totalApplications / totalDrives) : 0;
  const averageAttendancePerDrive = totalDrives ? toFixedNumber(attendanceRecords / totalDrives) : 0;
  const averageShortlistingPercentage = percent(shortlistedApplications, Math.max(totalApplications, 1));
  const averageSelectionPercentage = percent(selectedApplications, Math.max(totalApplications, 1));

  return {
    totalStudents,
    interestedStudents,
    unplacedStudents,
    placedStudents,
    totalDrives,
    totalApplications,
    shortlistedApplications,
    selectedApplications,
    selectedStudents,
    openOpportunities,
    attendanceRecords,
    attendancePresent,
    attendanceAbsent,
    attendanceRate,
    placementRate,
    applicationConversionRate,
    opportunityUtilizationRate,
    averageApplicationsPerDrive,
    averageAttendancePerDrive,
    averageShortlistingPercentage,
    averageSelectionPercentage,
  };
}

async function loadDriveAnalyticsContext(driveIds: string[]) {
  if (!driveIds.length) {
    return {
      drives: [] as AnyRecord[],
      opportunities: [] as AnyRecord[],
      applications: [] as AnyRecord[],
      rounds: [] as AnyRecord[],
      attendance: [] as AnyRecord[],
      academics: [] as AnyRecord[],
      eligibility: [] as AnyRecord[],
    };
  }

  const [drivesResult, opportunitiesResult, academicsResult] = await Promise.all([
    db
      .from("drive_master")
      .select(
        `
        drive_id,
        drive_name,
        company_id,
        created_at,
        company_master (
          company_name
        )
      `,
      )
      .in("drive_id", driveIds)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    db
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
        created_at
      `,
      )
      .in("drive_id", driveIds)
      .order("created_at", { ascending: false }),
    db
      .from("student_academic_details")
      .select(
        `
        student_id,
        current_institute_name,
        current_degree_level,
        current_branch_name,
        current_cgpa,
        active_backlogs,
        graduation_year
      `,
      ),
  ]);

  const drives = toArray<any>(drivesResult.data);
  const opportunities = toArray<any>(opportunitiesResult.data);
  const academics = toArray<any>(academicsResult.data);
  const opportunityIds = uniqueStrings(opportunities.map((item) => item.opportunity_id));

  const applicationsResult = opportunityIds.length
    ? await db
      .from("student_opportunity_applications")
      .select(
        `
          application_id,
          opportunity_id,
          student_id,
          application_status,
          applied_at,
          updated_at
        `,
      )
      .in("opportunity_id", opportunityIds)
      .order("applied_at", { ascending: false })
    : { data: [], error: null };

  const applications = toArray<any>(applicationsResult.data);
  const studentIds = uniqueStrings(applications.map((item) => item.student_id));

  const roundsResult = opportunityIds.length
    ? await db
      .from("attendance_rounds")
      .select(
        `
          round_id,
          opportunity_id,
          round_number,
          round_name,
          round_type,
          is_active,
          created_at,
          updated_at
        `,
      )
      .in("opportunity_id", opportunityIds)
      .eq("is_active", true)
      .order("round_number", { ascending: true })
    : { data: [], error: null };

  const rounds = toArray<any>(roundsResult.data);
  const roundIds = uniqueStrings(rounds.map((item) => item.round_id));

  const attendanceResult = roundIds.length
    ? await db
      .from("attendance_records")
      .select(
        `
          attendance_id,
          round_id,
          student_id,
          attendance_status,
          remarks,
          marked_by,
          marked_at,
          created_at,
          updated_at
        `,
      )
      .in("round_id", roundIds)
      .order("marked_at", { ascending: false })
    : { data: [], error: null };

  const attendance = toArray<any>(attendanceResult.data);

  let eligibility: AnyRecord[] = [];
  try {
    const eligibilityResult = await db
      .from("drive_eligibility")
      .select(
        `
        drive_id,
        allowed_institutes,
        allowed_branches,
        allowed_degrees,
        minimum_cgpa,
        maximum_active_backlogs,
        willing_to_relocate_required,
        additional_requirements,
        created_at,
        passing_out_batches
      `,
      )
      .in("drive_id", driveIds);
    eligibility = toArray<any>(eligibilityResult.data);
  } catch (err) {
    console.warn("drive_eligibility lookup skipped:", err);
    eligibility = [];
  }

  return {
    drives,
    opportunities,
    applications,
    rounds,
    attendance,
    academics,
    eligibility,
  };
}

function buildDriveTrendPoint(
  drive: AnyRecord,
  ctx: Awaited<ReturnType<typeof loadDriveAnalyticsContext>>,
): DriveTrendPoint {
  const driveOpportunities = ctx.opportunities.filter((item) => item.drive_id === drive.drive_id);
  const opportunityIds = driveOpportunities.map((item) => item.opportunity_id);
  const driveApplications = ctx.applications.filter((item) => opportunityIds.includes(item.opportunity_id));
  const driveRounds = ctx.rounds.filter((item) => opportunityIds.includes(item.opportunity_id));
  const driveAttendance = ctx.attendance.filter((item) => driveRounds.some((round) => round.round_id === item.round_id));

  const registeredStudents = countDistinct(driveApplications.map((item) => item.student_id));
  const shortlistedStudents = countDistinct(
    driveApplications.filter((item) => isShortlistedStatus(item.application_status)).map((item) => item.student_id),
  );
  const selectedStudents = countDistinct(
    driveApplications.filter((item) => isSelectedStatus(item.application_status)).map((item) => item.student_id),
  );
  const presentStudents = countDistinct(
    driveAttendance.filter((item) => item.attendance_status === "PRESENT").map((item) => item.student_id),
  );

  return {
    drive_id: drive.drive_id,
    drive_name: drive.drive_name ?? "Unnamed Drive",
    company_name: drive.company_master?.company_name ?? null,
    drive_date: safeDate(drive.created_at),
    opportunity_count: driveOpportunities.length,
    application_count: driveApplications.length,
    registered_students: registeredStudents,
    shortlisted_students: shortlistedStudents,
    present_students: presentStudents,
    selected_students: selectedStudents,
  };
}

function buildBranchDistributionPoint(
  driveId: string,
  ctx: Awaited<ReturnType<typeof loadDriveAnalyticsContext>>,
): DriveBranchDistributionPoint[] {
  const driveOpportunities = ctx.opportunities.filter((item) => item.drive_id === driveId);
  const opportunityIds = driveOpportunities.map((item) => item.opportunity_id);
  const driveApplications = ctx.applications.filter((item) => opportunityIds.includes(item.opportunity_id));
  const studentIds = uniqueStrings(driveApplications.map((item) => item.student_id));

  const branchCounts = new Map<string, number>();
  studentIds.forEach((studentId) => {
    const academic = ctx.academics.find((item) => item.student_id === studentId);
    const branch = academic?.current_branch_name?.trim() || "Unknown";
    branchCounts.set(branch, (branchCounts.get(branch) ?? 0) + 1);
  });

  const total = Array.from(branchCounts.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(branchCounts.entries())
    .map(([branch_name, student_count]) => ({
      branch_name,
      student_count,
      percentage: total ? Math.round((student_count / total) * 100) : 0,
    }))
    .sort((a, b) => b.student_count - a.student_count || a.branch_name.localeCompare(b.branch_name));
}

function buildOpportunityPipelineReport(
  driveId: string,
  ctx: Awaited<ReturnType<typeof loadDriveAnalyticsContext>>,
): OpportunityPipelineReport | null {
  const drive = ctx.drives.find((item) => item.drive_id === driveId);
  if (!drive) return null;

  const driveOpportunities = ctx.opportunities.filter((item) => item.drive_id === driveId);
  const opportunityIds = driveOpportunities.map((item) => item.opportunity_id);
  const driveApplications = ctx.applications.filter((item) => opportunityIds.includes(item.opportunity_id));
  const driveRounds = ctx.rounds.filter((item) => opportunityIds.includes(item.opportunity_id));
  const driveAttendance = ctx.attendance.filter((item) => driveRounds.some((round) => round.round_id === item.round_id));
  const registeredStudentsSet = new Set(driveApplications.map((item) => item.student_id));
  const shortlistedStudentsSet = new Set(
    driveApplications.filter((item) => isShortlistedStatus(item.application_status)).map((item) => item.student_id),
  );
  const selectedStudentsSet = new Set(
    driveApplications.filter((item) => isSelectedStatus(item.application_status)).map((item) => item.student_id),
  );
  const presentStudentsSet = new Set(
    driveAttendance.filter((item) => item.attendance_status === "PRESENT").map((item) => item.student_id),
  );
  const roundClearedAggregate = new Set<string>();

  const opportunityBreakdown: OpportunityPipelineItem[] = driveOpportunities.map((opportunity) => {
    const applications = driveApplications.filter((item) => item.opportunity_id === opportunity.opportunity_id);
    const oppRounds = driveRounds.filter((item) => item.opportunity_id === opportunity.opportunity_id);
    const oppAttendance = driveAttendance.filter((record) => oppRounds.some((round) => round.round_id === record.round_id));

    const perStudentRecords = new Map<string, AnyRecord[]>();
    oppAttendance.forEach((record) => {
      const list = perStudentRecords.get(record.student_id) ?? [];
      list.push(record);
      list.sort((a, b) => {
        const roundA = oppRounds.find((round) => round.round_id === a.round_id);
        const roundB = oppRounds.find((round) => round.round_id === b.round_id);
        return (
          (roundA?.round_number ?? 0) - (roundB?.round_number ?? 0) ||
          new Date(String(a.marked_at ?? a.created_at ?? 0)).getTime() - new Date(String(b.marked_at ?? b.created_at ?? 0)).getTime()
        );
      });
      perStudentRecords.set(record.student_id, list);
    });

    const roundClearedStudents = new Set<string>();
    perStudentRecords.forEach((records, studentId) => {
      const latest = records[records.length - 1];
      if (latest?.attendance_status === "PRESENT") {
        roundClearedStudents.add(studentId);
        roundClearedAggregate.add(studentId);
      }
    });

    return {
      opportunity_id: opportunity.opportunity_id,
      opportunity_title: opportunity.opportunity_title ?? "Untitled Opportunity",
      total_applications: applications.length,
      eligible_students: countDistinct(applications.map((item) => item.student_id)),
      applied_students: applications.length,
      registered_students: countDistinct(applications.map((item) => item.student_id)),
      present_students: countDistinct(
        oppAttendance.filter((item) => item.attendance_status === "PRESENT").map((item) => item.student_id),
      ),
      round_cleared_students: roundClearedStudents.size,
      shortlisted_students: countDistinct(
        applications.filter((item) => isShortlistedStatus(item.application_status)).map((item) => item.student_id),
      ),
      selected_students: countDistinct(
        applications.filter((item) => isSelectedStatus(item.application_status)).map((item) => item.student_id),
      ),
    };
  });

  const eligibleRows = ctx.eligibility.filter((item) => item.drive_id === driveId);
  const eligibleStudents =
    eligibleRows.length > 0
      ? countDistinct(eligibleRows.map((item) => item.student_id))
      : null;

  const registeredStudents = registeredStudentsSet.size;
  const appliedStudents = registeredStudents;
  const presentStudents = presentStudentsSet.size;
  const shortlistedStudents = shortlistedStudentsSet.size;
  const selectedStudents = selectedStudentsSet.size;
  const roundClearedStudents = roundClearedAggregate.size;

  return {
    drive_id: driveId,
    drive_name: drive.drive_name ?? "Unnamed Drive",
    company_name: drive.company_master?.company_name ?? null,
    eligible_students: eligibleStudents,
    applied_students: appliedStudents,
    registered_students: registeredStudents,
    present_students: presentStudents,
    round_cleared_students: roundClearedStudents,
    shortlisted_students: shortlistedStudents,
    selected_students: selectedStudents,
    registration_rate: eligibleStudents ? percent(appliedStudents, eligibleStudents) : 0,
    attendance_rate: percent(presentStudents, Math.max(appliedStudents, 1)),
    shortlisting_rate: percent(shortlistedStudents, Math.max(appliedStudents, 1)),
    selection_rate: percent(selectedStudents, Math.max(appliedStudents, 1)),
    opportunities: opportunityBreakdown,
  };
}

async function fetchLatestDriveTrend(limit = 10) {
  const drivesResult = await db
    .from("drive_master")
    .select(
      `
      drive_id,
      drive_name,
      company_id,
      created_at,
      company_master (
        company_name
      )
    `,
    )
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  const drives = toArray<any>(drivesResult.data);
  const ctx = await loadDriveAnalyticsContext(drives.map((drive) => drive.drive_id));

  return drives.map((drive) => buildDriveTrendPoint(drive, ctx));
}

async function fetchStudentDrilldown(enrollmentNo: string): Promise<StudentDrilldownReport | null> {
  const enrollment = enrollmentNo.trim();
  if (!enrollment) return null;

  const { data: student, error: studentError } = await db
    .from("student_master")
    .select(
      `
      student_id,
      enrollment_no,
      first_name,
      middle_name,
      last_name
    `,
    )
    .eq("enrollment_no", enrollment)
    .maybeSingle();

  if (studentError) throw studentError;
  if (!student?.student_id) return null;

  const studentId = student.student_id as string;

  const [
    applicationsResult,
    attendanceResult,
    activeDrivesResult,
  ] = await Promise.all([
    db
      .from("student_opportunity_applications")
      .select(
        `
        application_id,
        opportunity_id,
        student_id,
        application_status,
        applied_at
      `,
      )
      .eq("student_id", studentId),
    db
      .from("attendance_records")
      .select(
        `
        attendance_id,
        round_id,
        student_id,
        attendance_status,
        marked_at
      `,
      )
      .eq("student_id", studentId),
    db
      .from("drive_master")
      .select(
        `
        drive_id,
        drive_name,
        company_id,
        created_at,
        company_master (
          company_name
        )
      `,
      )
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
  ]);

  const applications = toArray<any>(applicationsResult.data);
  const attendance = toArray<any>(attendanceResult.data);
  const activeDrives = toArray<any>(activeDrivesResult.data);

  let eligibilityRows: AnyRecord[] = [];
  try {
    const eligibilityResult = await db
      .from("drive_eligibility")
      .select("drive_id, student_id")
      .eq("student_id", studentId);
    eligibilityRows = toArray<any>(eligibilityResult.data);
  } catch (err) {
    console.warn("drive_eligibility lookup skipped:", err);
    eligibilityRows = [];
  }

  const opportunityIds = uniqueStrings(applications.map((item) => item.opportunity_id));
  const opportunitiesResult = opportunityIds.length
    ? await db
      .from("opportunity_master")
      .select(
        `
          opportunity_id,
          drive_id,
          opportunity_title
        `,
      )
      .in("opportunity_id", opportunityIds)
    : { data: [], error: null };

  const opportunities = toArray<any>(opportunitiesResult.data);
  const opportunityMap = new Map(opportunities.map((item) => [item.opportunity_id, item]));
  const driveMap = new Map(activeDrives.map((item) => [item.drive_id, item]));

  const roundIds = uniqueStrings(attendance.map((item) => item.round_id));
  const roundsResult = roundIds.length
    ? await db
      .from("attendance_rounds")
      .select(
        `
          round_id,
          opportunity_id,
          round_number,
          round_name
        `,
      )
      .in("round_id", roundIds)
    : { data: [], error: null };

  const rounds = toArray<any>(roundsResult.data);
  const roundMap = new Map(rounds.map((item) => [item.round_id, item]));

  const registeredDriveIds = new Set<string>();
  const presentDriveIds = new Set<string>();
  const absentDriveIds = new Set<string>();

  applications.forEach((item) => {
    const opportunity = opportunityMap.get(item.opportunity_id);
    if (!opportunity?.drive_id) return;
    registeredDriveIds.add(opportunity.drive_id);
  });

  attendance.forEach((record) => {
    if (record.attendance_status !== "PRESENT" && record.attendance_status !== "ABSENT") {
      return;
    }

    const round = roundMap.get(record.round_id);
    if (!round?.opportunity_id) return;

    const opportunity = opportunityMap.get(round.opportunity_id);
    if (!opportunity?.drive_id) return;

    if (record.attendance_status === "PRESENT") {
      presentDriveIds.add(opportunity.drive_id);
      return;
    }

    if (record.attendance_status === "ABSENT" && !presentDriveIds.has(opportunity.drive_id)) {
      absentDriveIds.add(opportunity.drive_id);
    }
  });

  const totalActiveDrives = activeDrives.length;
  const eligibleDrives = eligibilityRows.length
    ? countDistinct(eligibilityRows.map((item) => item.drive_id))
    : null;
  const unregisteredDrives = (eligibleDrives ?? totalActiveDrives) - registeredDriveIds.size;

  const driveBreakdown: StudentDriveBreakdownItem[] = activeDrives.map((drive) => {
    const driveOpportunityIds = opportunities
      .filter((item) => item.drive_id === drive.drive_id)
      .map((item) => item.opportunity_id);

    const driveApplications = applications.filter((item) =>
      driveOpportunityIds.includes(item.opportunity_id),
    );

    const driveAttendance = attendance.filter((record) => {
      const round = roundMap.get(record.round_id);
      return round ? driveOpportunityIds.includes(round.opportunity_id) : false;
    });

    const hasPresent = driveAttendance.some((record) => record.attendance_status === "PRESENT");
    const hasAbsent = driveAttendance.some((record) => record.attendance_status === "ABSENT");

    let status: StudentDriveBreakdownItem["status"] = "UNREGISTERED";
    if (hasPresent) {
      status = "PRESENT";
    } else if (hasAbsent) {
      status = "ABSENT";
    } else if (driveApplications.length > 0) {
      status = "REGISTERED";
    }

    return {
      drive_id: drive.drive_id,
      drive_name: drive.drive_name ?? "Unnamed Drive",
      company_name: drive.company_master?.company_name ?? null,
      status,
      application_count: driveApplications.length,
    };
  });

  return {
    student_id: studentId,
    enrollment_no: student.enrollment_no,
    student_name: fullName(student),
    total_active_drives: totalActiveDrives,
    eligible_drives: eligibleDrives,
    registered_drives: registeredDriveIds.size,
    present_drives: presentDriveIds.size,
    absent_drives: absentDriveIds.size,
    unregistered_drives: Math.max(unregisteredDrives, 0),
    applications_count: applications.length,
    shortlisted_count: applications.filter((item) => isShortlistedStatus(item.application_status)).length,
    selected_count: applications.filter((item) => isSelectedStatus(item.application_status)).length,
    attendance_percentage: percent(
      presentDriveIds.size,
      Math.max(presentDriveIds.size + absentDriveIds.size, 1),
    ),
    drive_breakdown: driveBreakdown,
  };
}

async function fetchRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
  const [applicationsResult, attendanceResult, drivesResult, opportunitiesResult] = await Promise.all([
    db
      .from("student_opportunity_applications")
      .select(
        `
        application_id,
        opportunity_id,
        student_id,
        application_status,
        applied_at
      `,
      )
      .order("applied_at", { ascending: false })
      .limit(limit),
    db
      .from("attendance_records")
      .select(
        `
        attendance_id,
        round_id,
        student_id,
        attendance_status,
        marked_at
      `,
      )
      .order("marked_at", { ascending: false })
      .limit(limit),
    db
      .from("drive_master")
      .select(
        `
        drive_id,
        drive_name,
        company_id,
        created_at,
        company_master (
          company_name
        )
      `,
      )
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(Math.max(5, Math.ceil(limit / 3))),
    db
      .from("opportunity_master")
      .select(
        `
        opportunity_id,
        drive_id,
        opportunity_title,
        created_at,
        application_status
      `,
      )
      .order("created_at", { ascending: false })
      .limit(Math.max(5, Math.ceil(limit / 3))),
  ]);

  const applications = toArray<any>(applicationsResult.data);
  const attendance = toArray<any>(attendanceResult.data);
  const drives = toArray<any>(drivesResult.data);
  const opportunities = toArray<any>(opportunitiesResult.data);

  const studentIds = uniqueStrings([
    ...applications.map((item) => item.student_id),
    ...attendance.map((item) => item.student_id),
  ]);
  const roundIds = uniqueStrings(attendance.map((item) => item.round_id));

  const [studentsResult, roundRowsResult] = await Promise.all([
    studentIds.length
      ? db
        .from("student_master")
        .select(
          `
            student_id,
            enrollment_no,
            first_name,
            middle_name,
            last_name
          `,
        )
        .in("student_id", studentIds)
      : Promise.resolve({ data: [] as AnyRecord[], error: null }),
    roundIds.length
      ? db
        .from("attendance_rounds")
        .select(
          `
            round_id,
            opportunity_id,
            round_number,
            round_name
          `,
        )
        .in("round_id", roundIds)
      : Promise.resolve({ data: [] as AnyRecord[], error: null }),
  ]);

  const students = toArray<any>(studentsResult.data);
  const roundRows = toArray<any>(roundRowsResult.data);
  const studentMap = new Map(students.map((item) => [item.student_id, item]));
  const opportunityMap = new Map(opportunities.map((item) => [item.opportunity_id, item]));
  const driveMap = new Map(drives.map((item) => [item.drive_id, item]));
  const roundMap = new Map(roundRows.map((item) => [item.round_id, item]));

  const items: RecentActivityItem[] = [];

  applications.forEach((application) => {
    const student = studentMap.get(application.student_id);
    const opportunity = opportunityMap.get(application.opportunity_id);
    const drive = opportunity ? driveMap.get(opportunity.drive_id) : null;

    items.push({
      id: `application:${application.application_id}`,
      type: "APPLICATION",
      title: `${fullName(student ?? {}) || student?.enrollment_no || "Student"} applied`,
      description: [
        opportunity?.opportunity_title ?? "Opportunity",
        drive?.drive_name ? `Drive: ${drive.drive_name}` : null,
        application.application_status ? `Status: ${application.application_status}` : null,
      ].filter(Boolean).join(" • "),
      occurred_at: safeDate(application.applied_at),
      drive_id: opportunity?.drive_id ?? null,
      opportunity_id: application.opportunity_id,
      student_id: application.student_id,
      meta: application,
    });
  });

  attendance.forEach((record) => {
    const student = studentMap.get(record.student_id);
    const round = roundMap.get(record.round_id);
    const opportunity = round ? opportunityMap.get(round.opportunity_id) : null;
    const drive = opportunity ? driveMap.get(opportunity.drive_id) : null;

    items.push({
      id: `attendance:${record.attendance_id}`,
      type: "ATTENDANCE",
      title: `${fullName(student ?? {}) || student?.enrollment_no || "Student"} marked ${record.attendance_status}`,
      description: [
        drive?.drive_name ?? null,
        opportunity?.opportunity_title ?? null,
        round?.round_name ? `Round ${round.round_number}: ${round.round_name}` : null,
      ].filter(Boolean).join(" • "),
      occurred_at: safeDate(record.marked_at ?? record.created_at),
      drive_id: opportunity?.drive_id ?? null,
      opportunity_id: round?.opportunity_id ?? null,
      student_id: record.student_id,
      meta: record,
    });
  });

  drives.forEach((drive) => {
    items.push({
      id: `drive:${drive.drive_id}`,
      type: "DRIVE",
      title: `Drive created: ${drive.drive_name ?? "Unnamed Drive"}`,
      description: drive.company_master?.company_name ?? "No company name",
      occurred_at: safeDate(drive.created_at),
      drive_id: drive.drive_id,
      meta: drive,
    });
  });

  opportunities.forEach((opportunity) => {
    const drive = driveMap.get(opportunity.drive_id);
    items.push({
      id: `opportunity:${opportunity.opportunity_id}`,
      type: "OPPORTUNITY",
      title: `Opportunity published: ${opportunity.opportunity_title ?? "Untitled Opportunity"}`,
      description: drive?.drive_name ? `Drive: ${drive.drive_name}` : "Drive not found",
      occurred_at: safeDate(opportunity.created_at),
      drive_id: opportunity.drive_id,
      opportunity_id: opportunity.opportunity_id,
      meta: opportunity,
    });
  });

  roundRows.forEach((round) => {
    const opportunity = opportunityMap.get(round.opportunity_id);
    const drive = opportunity ? driveMap.get(opportunity.drive_id) : null;

    items.push({
      id: `round:${round.round_id}`,
      type: "ROUND",
      title: `Round created: ${round.round_name ?? `Round ${round.round_number}`}`,
      description: [
        opportunity?.opportunity_title ?? null,
        drive?.drive_name ? `Drive: ${drive.drive_name}` : null,
      ].filter(Boolean).join(" • "),
      occurred_at: safeDate(round.created_at),
      drive_id: opportunity?.drive_id ?? null,
      opportunity_id: round.opportunity_id,
      meta: round,
    });
  });

  try {
    const nocResult = await db
      .from("noc_requests")
      .select(
        `
        noc_request_id,
        status,
        submitted_at,
        approved_at,
        created_at,
        snapshot
      `,
      )
      .order("created_at", { ascending: false })
      .limit(Math.max(5, Math.ceil(limit / 3)));

    toArray<any>(nocResult.data).forEach((request) => {
      items.push({
        id: `noc:${request.noc_request_id}`,
        type: "NOC",
        title: `NOC ${request.status ?? "updated"}`,
        description: request.snapshot?.student_name
          ? `${request.snapshot.student_name} • ${request.snapshot?.company_name ?? "Company"}`
          : "NOC workflow event",
        occurred_at: safeDate(request.approved_at ?? request.submitted_at ?? request.created_at),
        meta: request,
      });
    });
  } catch (err) {
    console.warn("noc_requests lookup skipped:", err);
  }

  return items
    .filter((item) => item.occurred_at)
    .sort((a, b) => {
      const aTime = new Date(String(a.occurred_at)).getTime();
      const bTime = new Date(String(b.occurred_at)).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);
}

export async function getDashboardKpis() {
  return fetchKpis();
}

export async function getDriveTrend(limit = 10) {
  return fetchLatestDriveTrend(limit);
}

export async function getDriveBranchDistribution(driveId: string) {
  const ctx = await loadDriveAnalyticsContext([driveId]);
  return buildBranchDistributionPoint(driveId, ctx);
}

export async function getOpportunityPipeline(driveId: string) {
  const ctx = await loadDriveAnalyticsContext([driveId]);
  return buildOpportunityPipelineReport(driveId, ctx);
}

export async function getStudentDrilldown(enrollmentNo: string) {
  return fetchStudentDrilldown(enrollmentNo);
}

export async function getSuccessMetrics(driveId: string) {
  const pipeline = await getOpportunityPipeline(driveId);
  if (!pipeline) return null;

  return {
    drive_id: pipeline.drive_id,
    drive_name: pipeline.drive_name,
    company_name: pipeline.company_name,
    eligible_students: pipeline.eligible_students,
    applied_students: pipeline.applied_students,
    registered_students: pipeline.registered_students,
    present_students: pipeline.present_students,
    round_cleared_students: pipeline.round_cleared_students,
    shortlisted_students: pipeline.shortlisted_students,
    selected_students: pipeline.selected_students,
    registration_rate: pipeline.registration_rate,
    attendance_rate: pipeline.attendance_rate,
    shortlisting_rate: pipeline.shortlisting_rate,
    selection_rate: pipeline.selection_rate,
  };
}

export async function getRecentActivity(limit = 10) {
  return fetchRecentActivity(limit);
}


export const adminStudentService = {
  async getAllStudents() {
    const { data, error } = await db
      .from("student_master")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const students = data ?? [];

    const enriched = await Promise.all(
      students.map(async (student: any) => {
        const { data: account } = await db
          .from("user_accounts")
          .select("auth_provider_id")
          .eq("user_id", student.user_id)
          .maybeSingle();

        const percentage = account?.auth_provider_id
          ? await this.getStudentCompletion(account.auth_provider_id)
          : 0;

        return {
          ...student,
          completion_percentage: percentage,
        };
      }),
    );

    return enriched;
  },

  async getStudentById(studentId: string) {
    const { data: profile, error: profileError } = await db
      .from("student_master")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: academics } = await db
      .from("student_academic_details")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    const { data: skills } = await db
      .from("student_skill_profile")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    const { data: documents } = await db
      .from("student_documents")
      .select(`
        *,
        document_metadata:document_metadata_id (
          document_metadata_id,
          document_name,
          document_type,
          storage_url,
          version_number,
          created_at,
          is_active
        )
      `)
      .eq("student_id", studentId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return {
      profile,
      academics,
      skills,
      documents,
    };
  },

  async getStudentCompletion(authUserId: string) {
    const { data: account } = await db
      .from("user_accounts")
      .select("user_id")
      .eq("auth_provider_id", authUserId)
      .maybeSingle();

    if (!account) return 0;

    const { data: profile } = await db
      .from("student_master")
      .select("*")
      .eq("user_id", account.user_id)
      .maybeSingle();

    if (!profile) return 0;

    const { data: academics } = await db
      .from("student_academic_details")
      .select("*")
      .eq("student_id", profile.student_id)
      .maybeSingle();

    const { data: skills } = await db
      .from("student_skill_profile")
      .select("*")
      .eq("student_id", profile.student_id)
      .maybeSingle();

    const { data: resumeDocuments } = await db
      .from("student_documents")
      .select(`
        *,
        document_metadata (
          storage_url,
          document_type
        )
      `)
      .eq("student_id", profile.student_id)
      .eq("is_active", true);

    const resume = resumeDocuments?.find(
      (doc: any) => doc.document_metadata?.document_type === "Resume",
    );

    const profileComplete =
      !!profile.first_name &&
      !!profile.last_name &&
      !!profile.enrollment_no &&
      !!profile.contact_number;

    const academicsComplete = !!academics?.current_cgpa && !!academics?.graduation_year;

    const skillsComplete =
      !!skills?.technical_skills &&
      !!skills?.programming_languages &&
      !!skills?.linkedin_url;

    const resumeComplete = !!resume?.document_metadata?.storage_url;

    const completed = [profileComplete, academicsComplete, skillsComplete, resumeComplete].filter(Boolean).length;

    return Math.round((completed / 4) * 100);
  },

  async getDashboardMetrics() {
    return getDashboardKpis();
  },

  async searchStudents(searchTerm: string) {
    const search = searchTerm.trim();

    // Show all students by default
    const students = await this.getAllStudents();

    // No search text = return full list
    if (!search) {
      return students;
    }

    const normalizedSearch = normalize(search);

    return students
      .map((student: any) => {
        const matches: string[] = [];

        if (normalize(student.enrollment_no).includes(normalizedSearch)) {
          matches.push("enrollment");
        }

        const name = fullName(student);
        if (normalize(name).includes(normalizedSearch)) {
          matches.push("name");
        }

        if (normalize(student.institute_email).includes(normalizedSearch)) {
          matches.push("institute_email");
        }

        if (normalize(student.personal_email).includes(normalizedSearch)) {
          matches.push("personal_email");
        }

        return {
          ...student,
          match_sources: matches,
        };
      })
      .filter((student: any) => student.match_sources.length > 0);
  },

  async getFilterOptions() {
    const { data: academics } = await db
      .from("student_academic_details")
      .select(`
        current_institute_name,
        current_branch_name,
        graduation_year
      `);

    const institutes: string[] = [...new Set((academics ?? []).map((a: any) => a.current_institute_name))]
      .filter(Boolean) as string[];

    const branches: string[] = [...new Set((academics ?? []).map((a: any) => a.current_branch_name))]
      .filter(Boolean) as string[];

    const graduationYears: number[] = [...new Set((academics ?? []).map((a: any) => a.graduation_year))]
      .filter(Boolean) as number[];

    return {
      institutes,
      branches,
      graduationYears,
   
    };
    
  },

  async getAcademicMap() {
    const { data, error } = await db
      .from("student_academic_details")
      .select(`
        student_id,
        current_cgpa,
        current_branch_name,
        current_institute_name,
        graduation_year
      `);

      if (error) {
    console.error(
        "Academic Map Error:",
        error,
    );
    throw error;
}
    if (error) throw error;
    return data ?? [];
  },
};


// ===== PART 2 =====
// APPEND DIRECTLY AFTER PART 1
// DO NOT MODIFY PART 1

export async function searchStudents(
  query: string,
  limit = 10,
): Promise<StudentSearchResult[]> {
  const search = query.trim();

  if (!search) {
    return [];
  }

  const { data, error } = await db
    .from("student_master")
    .select(`
      student_id,
      user_id,
      enrollment_no,
      first_name,
      middle_name,
      last_name,
      institute_email,
      personal_email,
      placement_preference,
      placement_status
    `)
    .limit(200);

  if (error) {
    throw error;
  }

  const normalizedSearch = normalize(search);

  return toArray<any>(data)
    .map((student) => {
      const matches: string[] = [];

      if (
        normalize(student.enrollment_no).includes(normalizedSearch)
      ) {
        matches.push("enrollment");
      }

      const name = fullName(student);

      if (normalize(name).includes(normalizedSearch)) {
        matches.push("name");
      }

      if (
        normalize(student.institute_email).includes(
          normalizedSearch,
        )
      ) {
        matches.push("institute_email");
      }

      if (
        normalize(student.personal_email).includes(
          normalizedSearch,
        )
      ) {
        matches.push("personal_email");
      }

      return {
        student_id: student.student_id,
        user_id: student.user_id ?? null,
        enrollment_no: student.enrollment_no,
        first_name: student.first_name,
        middle_name: student.middle_name ?? null,
        last_name: student.last_name ?? null,
        institute_email:
          student.institute_email ?? null,
        personal_email:
          student.personal_email ?? null,
        placement_preference:
          student.placement_preference ?? null,
        placement_status:
          student.placement_status ?? null,
        match_sources: matches,
      } satisfies StudentSearchResult;
    })
    .filter(
      (student) => student.match_sources.length > 0,
    )
    .sort((a, b) => {
      return (
        b.match_sources.length -
        a.match_sources.length ||
        a.enrollment_no.localeCompare(
          b.enrollment_no,
        )
      );
    })
    .slice(0, limit);
}

export async function getDashboardSnapshot(
  options: DashboardSnapshotOptions = {},
): Promise<DashboardSnapshot> {
  const driveTrendLimit =
    options.driveTrendLimit ?? 10;

  const recentActivityLimit =
    options.recentActivityLimit ?? 10;

  const [
    kpis,
    driveTrend,
    recentActivity,
  ] = await Promise.all([
    fetchKpis(),
    fetchLatestDriveTrend(driveTrendLimit),
    fetchRecentActivity(recentActivityLimit),
  ]);

  const selectedDriveId =
    options.selectedDriveId ??
    driveTrend[0]?.drive_id ??
    null;

  let branchDistribution:
    | DriveBranchDistributionPoint[]
    = [];

  let pipeline:
    | OpportunityPipelineReport
    | null = null;

  if (selectedDriveId) {
    const ctx =
      await loadDriveAnalyticsContext([
        selectedDriveId,
      ]);

    branchDistribution =
      buildBranchDistributionPoint(
        selectedDriveId,
        ctx,
      );

    pipeline =
      buildOpportunityPipelineReport(
        selectedDriveId,
        ctx,
      );
  }

  const studentDrilldown =
    options.enrollmentNo?.trim()
      ? await fetchStudentDrilldown(
        options.enrollmentNo,
      )
      : null;

  const studentSearchResults =
    options.studentSearchQuery?.trim()
      ? await searchStudents(
        options.studentSearchQuery,
        options.studentSearchLimit ??
        10,
      )
      : [];

  return {
    kpis,
    driveTrend,
    selectedDriveId,
    branchDistribution,
    pipeline,
    studentDrilldown,
    studentSearchResults,
    recentActivity,
    refreshedAt:
      new Date().toISOString(),
  };
}

export const adminDashboardAnalyticsService =
{
  getDashboardKpis,
  getDriveTrend,
  getDriveBranchDistribution,
  getOpportunityPipeline,
  getStudentDrilldown,
  getSuccessMetrics,
  getRecentActivity,
  searchStudents,
  getDashboardSnapshot,
};

export default adminStudentService;

// ===== END PART 2 =====