import { supabase } from "@/lib/supabase";
import {
  evaluateStudentEligibility,
  type RecruitmentEligibilityCriteria,
  type StudentAcademicRecord,
  type StudentMasterRecord,
} from "@/services/recruitmentEligibilityAnalyticsService";
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

const SHORTLISTED_STATUSES = new Set(["Shortlisted", "Shortlist", "Shortlist Pending"]);

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
  openOpportunities: number;
  attendanceRecords: number;
  attendancePresent: number;
  attendanceAbsent: number;
  attendanceRate: number;
  placementRate: number;
  applicationConversionRate: number;
  opportunityUtilizationRate: number;
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

export interface BranchAnalyticsItem {
  branch_name: string;
  eligible_students: number;
  registered_students: number;
  present_students: number;
  shortlisted_students: number;
  selected_students: number;
}

export interface OpportunityPipelineItem {
  opportunity_id: string;
  opportunity_title: string;
  total_applications: number;
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
  eligible: boolean;
  registered: boolean;
  present: boolean;
  absent: boolean;
  shortlisted: boolean;
  selected: boolean;
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
  branchAnalytics: BranchAnalyticsItem[];
  pipeline: OpportunityPipelineReport | null;
  studentDrilldown: StudentDrilldownReport | null;
  recentActivity: RecentActivityItem[];
  refreshedAt: string;
  eligibility?: {
    allowed_branches: string[];
    allowed_degrees: string[];
    allowed_institutes: string[];
  } | null;
}

export interface DashboardSnapshotOptions {
  selectedDriveId?: string | null;
  enrollmentNo?: string | null;
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

function normalizeBranchName(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
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

function isSelectedStatus(status?: string | null) {
  if (!status) return false;
  return SELECTED_STATUSES.has(status);
}

function isShortlistedStatus(status?: string | null) {
  if (!status) return false;
  return SHORTLISTED_STATUSES.has(status);
}

function countDistinct(values: Array<string | null | undefined>) {
  return uniqueStrings(values).length;
}

async function fetchKpis(): Promise<DashboardKpis> {
  const [studentsResult, drivesResult, opportunitiesResult, applicationsResult, attendanceResult] =
    await Promise.all([
      db.from("student_master").select("student_id, placement_preference, placement_status"),

      db.from("drive_master").select("drive_id").eq("is_active", true).eq("is_deleted", false),

      db.from("opportunity_master").select("opportunity_id, application_status"),

      db.from("student_opportunity_applications").select("application_id, application_status"),

      db.from("attendance_records").select("attendance_id, attendance_status"),
    ]);

  const students = toArray<any>(studentsResult.data);
  const drives = toArray<any>(drivesResult.data);
  const opportunities = toArray<any>(opportunitiesResult.data);
  const applications = toArray<any>(applicationsResult.data);
  const attendance = toArray<any>(attendanceResult.data);

  const totalStudents = students.length;
  const interestedStudents = students.filter(
    (item) => item.placement_preference === "Interested",
  ).length;
  const unplacedStudents = students.filter((item) => item.placement_status === "Unplaced").length;
  const placedStudents = students.filter((item) => item.placement_status === "Placed").length;

  const totalDrives = drives.length;
  const totalApplications = applications.length;
  const shortlistedApplications = applications.filter((item) =>
    isShortlistedStatus(item.application_status),
  ).length;
  const openOpportunities = opportunities.filter(
    (item) => item.application_status === "Open",
  ).length;

  const attendancePresent = attendance.filter((item) =>
    PRESENT_STATUSES.has(String(item.attendance_status)),
  ).length;
  const attendanceAbsent = attendance.filter((item) =>
    ABSENT_STATUSES.has(String(item.attendance_status)),
  ).length;
  const attendanceRecords = attendance.length;
  const attendanceRate = percent(
    attendancePresent,
    Math.max(attendancePresent + attendanceAbsent, 1),
  );
  const placementRate = percent(placedStudents, Math.max(totalStudents, 1));
  const applicationConversionRate = percent(
    shortlistedApplications,
    Math.max(totalApplications, 1),
  );
  const opportunityUtilizationRate = percent(openOpportunities, Math.max(totalDrives, 1));

  return {
    totalStudents,
    interestedStudents,
    unplacedStudents,
    placedStudents,
    totalDrives,
    totalApplications,
    shortlistedApplications,
    openOpportunities,
    attendanceRecords,
    attendancePresent,
    attendanceAbsent,
    attendanceRate,
    placementRate,
    applicationConversionRate,
    opportunityUtilizationRate,
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

  const [drivesResult, opportunitiesResult] = await Promise.all([
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
  ]);

  const drives = toArray<any>(drivesResult.data);
  const opportunities = toArray<any>(opportunitiesResult.data);
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

  const academicsResult = studentIds.length
    ? await db
        .from("student_academic_details")
        .select(
          `
    student_id,
    current_institute_name,
    current_degree_name,
    current_branch_name,
    graduation_year,
    current_cgpa,
    active_backlogs
`,
        )
        .in("student_id", studentIds)
    : { data: [], error: null };

  const academics = toArray<any>(academicsResult.data);

  let eligibility: AnyRecord[] = [];
  try {
    const eligibilityResult = await db
      .from("drive_eligibility")
      .select(
        `
        eligibility_id,
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
  const driveApplications = ctx.applications.filter((item) =>
    opportunityIds.includes(item.opportunity_id),
  );
  const driveRounds = ctx.rounds.filter((item) => opportunityIds.includes(item.opportunity_id));
  const driveAttendance = ctx.attendance.filter((item) =>
    driveRounds.some((round) => round.round_id === item.round_id),
  );

  const registeredStudents = countDistinct(driveApplications.map((item) => item.student_id));
  const shortlistedStudents = countDistinct(
    driveApplications
      .filter((item) => isShortlistedStatus(item.application_status))
      .map((item) => item.student_id),
  );
  const selectedStudents = countDistinct(
    driveApplications
      .filter((item) => isSelectedStatus(item.application_status))
      .map((item) => item.student_id),
  );
  const presentStudents = countDistinct(
    driveAttendance
      .filter((item) => item.attendance_status === "PRESENT")
      .map((item) => item.student_id),
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

async function buildBranchAnalytics(
  driveId: string,
  ctx: Awaited<ReturnType<typeof loadDriveAnalyticsContext>>,
): Promise<BranchAnalyticsItem[]> {
  const eligibilityRow = ctx.eligibility?.find((e: AnyRecord) => e.drive_id === driveId);

  if (!eligibilityRow?.allowed_branches) {
    return [];
  }

  const branches = Array.from(
    new Set(
      String(eligibilityRow.allowed_branches)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  if (!branches.length) {
    return [];
  }

  const branchLookup = new Map(
    branches.map((branch_name) => [normalizeBranchName(branch_name), branch_name]),
  );

  const branchAnalytics = branches.map((branch_name) => ({
    branch_name,
    eligible_students: 0,
    registered_students: 0,
    present_students: 0,
    shortlisted_students: 0,
    selected_students: 0,
  }));

  const branchAnalyticsMap = new Map(
    branchAnalytics.map((item) => [normalizeBranchName(item.branch_name), item]),
  );

  // Determine eligible counts from student academic details and student master records.
  const branchStudentRows = branches.length
    ? toArray<any>(
        (
          await db
            .from("student_academic_details")
            .select("student_id, current_branch_name")
            .in("current_branch_name", branches)
        ).data,
      )
    : [];

  const branchStudentIds = uniqueStrings(
    branchStudentRows
      .map((item) => ({
        student_id: item.student_id,
        branch_name: normalizeBranchName(item.current_branch_name),
      }))
      .filter((item) => item.student_id && branchAnalyticsMap.has(item.branch_name))
      .map((item) => item.student_id),
  );

  const validStudentIds = branchStudentIds.length
    ? new Set(
        toArray<any>(
          (await db.from("student_master").select("student_id").in("student_id", branchStudentIds))
            .data,
        ).map((item) => item.student_id),
      )
    : new Set<string>();

  branchStudentRows.forEach((item) => {
    const branchName = normalizeBranchName(item.current_branch_name);
    const branch = branchAnalyticsMap.get(branchName);
    if (!branch || !item.student_id || !validStudentIds.has(item.student_id)) return;
    branch.eligible_students += 1;
  });

  const driveOpportunities = ctx.opportunities.filter((item) => item.drive_id === driveId);
  const opportunityIds = driveOpportunities.map((item) => item.opportunity_id);
  const driveApplications = ctx.applications.filter((item) =>
    opportunityIds.includes(item.opportunity_id),
  );
  const driveRounds = ctx.rounds.filter((item) => opportunityIds.includes(item.opportunity_id));
  const driveAttendance = ctx.attendance.filter((item) =>
    driveRounds.some((round) => round.round_id === item.round_id),
  );

  const driveAttendanceByStudent = new Map<string, { present: boolean; absent: boolean }>();
  driveAttendance.forEach((record) => {
    const branchName = normalizeBranchName(
      ctx.academics.find((item) => item.student_id === record.student_id)?.current_branch_name,
    );
    const branch = branchAnalyticsMap.get(branchName);
    if (!branch || !record.student_id) return;

    const stats = driveAttendanceByStudent.get(record.student_id) ?? {
      present: false,
      absent: false,
    };
    if (record.attendance_status === "PRESENT") {
      stats.present = true;
    } else if (record.attendance_status === "ABSENT") {
      stats.absent = true;
    }
    driveAttendanceByStudent.set(record.student_id, stats);
  });

  driveAttendanceByStudent.forEach((stats, studentId) => {
    const branchName = normalizeBranchName(
      ctx.academics.find((item) => item.student_id === studentId)?.current_branch_name,
    );
    const branch = branchAnalyticsMap.get(branchName);
    if (!branch) return;
    if (stats.present) {
      branch.present_students += 1;
    }
  });

  const branchApplicationStats = new Map<string, Set<string>>();
  const branchShortlistedSet = new Map<string, Set<string>>();
  const branchSelectedSet = new Map<string, Set<string>>();

  driveApplications.forEach((application) => {
    const branchName = normalizeBranchName(
      ctx.academics.find((item) => item.student_id === application.student_id)?.current_branch_name,
    );
    const branch = branchAnalyticsMap.get(branchName);
    if (!branch || !application.student_id) return;

    if (!branchApplicationStats.has(branchName)) {
      branchApplicationStats.set(branchName, new Set());
    }
    branchApplicationStats.get(branchName)?.add(application.student_id);

    if (isShortlistedStatus(application.application_status)) {
      const set = branchShortlistedSet.get(branchName) ?? new Set<string>();
      set.add(application.student_id);
      branchShortlistedSet.set(branchName, set);
    }

    if (isSelectedStatus(application.application_status)) {
      const set = branchSelectedSet.get(branchName) ?? new Set<string>();
      set.add(application.student_id);
      branchSelectedSet.set(branchName, set);
    }
  });

  branchAnalyticsMap.forEach((branch, branchName) => {
    const registeredIds = branchApplicationStats.get(branchName);
    branch.registered_students = registeredIds?.size ?? 0;
    branch.shortlisted_students = branchShortlistedSet.get(branchName)?.size ?? 0;
    branch.selected_students = branchSelectedSet.get(branchName)?.size ?? 0;

    const presentCount = Array.from(driveAttendanceByStudent.entries()).filter(
      ([studentId, stats]) => {
        const studentBranch = normalizeBranchName(
          ctx.academics.find((item) => item.student_id === studentId)?.current_branch_name,
        );
        return studentBranch === branchName && stats.present;
      },
    ).length;

    branch.present_students = presentCount;
  });

  return branchAnalytics;
}

async function buildBranchDistributionPoint(
  driveId: string,
  ctx: Awaited<ReturnType<typeof loadDriveAnalyticsContext>>,
): Promise<DriveBranchDistributionPoint[]> {
  const analytics = await buildBranchAnalytics(driveId, ctx);
  const totalEligible = analytics.reduce((sum, item) => sum + item.eligible_students, 0);

  if (!analytics.length) return [];

  return analytics.map((item) => ({
    branch_name: item.branch_name,
    student_count: item.eligible_students,
    percentage: totalEligible ? Math.round((item.eligible_students / totalEligible) * 100) : 0,
  }));
}

function buildOpportunityPipelineReport(
  driveId: string,
  ctx: Awaited<ReturnType<typeof loadDriveAnalyticsContext>>,
): OpportunityPipelineReport | null {
  const drive = ctx.drives.find((item) => item.drive_id === driveId);
  if (!drive) return null;

  const driveOpportunities = ctx.opportunities.filter((item) => item.drive_id === driveId);
  const opportunityIds = driveOpportunities.map((item) => item.opportunity_id);
  const driveApplications = ctx.applications.filter((item) =>
    opportunityIds.includes(item.opportunity_id),
  );
  const driveRounds = ctx.rounds.filter((item) => opportunityIds.includes(item.opportunity_id));
  const driveAttendance = ctx.attendance.filter((item) =>
    driveRounds.some((round) => round.round_id === item.round_id),
  );
  const registeredStudentsSet = new Set(driveApplications.map((item) => item.student_id));
  const shortlistedStudentsSet = new Set(
    driveApplications
      .filter((item) => isShortlistedStatus(item.application_status))
      .map((item) => item.student_id),
  );
  const selectedStudentsSet = new Set(
    driveApplications
      .filter((item) => isSelectedStatus(item.application_status))
      .map((item) => item.student_id),
  );
  const presentStudentsSet = new Set(
    driveAttendance
      .filter((item) => item.attendance_status === "PRESENT")
      .map((item) => item.student_id),
  );
  const roundClearedAggregate = new Set<string>();

  const opportunityBreakdown: OpportunityPipelineItem[] = driveOpportunities.map((opportunity) => {
    const applications = driveApplications.filter(
      (item) => item.opportunity_id === opportunity.opportunity_id,
    );
    const oppRounds = driveRounds.filter(
      (item) => item.opportunity_id === opportunity.opportunity_id,
    );
    const oppAttendance = driveAttendance.filter((record) =>
      oppRounds.some((round) => round.round_id === record.round_id),
    );

    const perStudentRecords = new Map<string, AnyRecord[]>();
    oppAttendance.forEach((record) => {
      const list = perStudentRecords.get(record.student_id) ?? [];
      list.push(record);
      list.sort((a, b) => {
        const roundA = oppRounds.find((round) => round.round_id === a.round_id);
        const roundB = oppRounds.find((round) => round.round_id === b.round_id);
        return (
          (roundA?.round_number ?? 0) - (roundB?.round_number ?? 0) ||
          new Date(String(a.marked_at ?? a.created_at ?? 0)).getTime() -
            new Date(String(b.marked_at ?? b.created_at ?? 0)).getTime()
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
      registered_students: countDistinct(applications.map((item) => item.student_id)),
      present_students: countDistinct(
        oppAttendance
          .filter((item) => item.attendance_status === "PRESENT")
          .map((item) => item.student_id),
      ),
      round_cleared_students: roundClearedStudents.size,
      shortlisted_students: countDistinct(
        applications
          .filter((item) => isShortlistedStatus(item.application_status))
          .map((item) => item.student_id),
      ),
      selected_students: countDistinct(
        applications
          .filter((item) => isSelectedStatus(item.application_status))
          .map((item) => item.student_id),
      ),
    };
  });

  const eligibleRows = ctx.eligibility.filter((item) => item.drive_id === driveId);
  const eligibleStudents =
    eligibleRows.length > 0 ? countDistinct(eligibleRows.map((item) => item.student_id)) : null;

  const registeredStudents = registeredStudentsSet.size;
  const presentStudents = presentStudentsSet.size;
  const shortlistedStudents = shortlistedStudentsSet.size;
  const selectedStudents = selectedStudentsSet.size;
  const roundClearedStudents = roundClearedAggregate.size;

  return {
    drive_id: driveId,
    drive_name: drive.drive_name ?? "Unnamed Drive",
    company_name: drive.company_master?.company_name ?? null,
    eligible_students: eligibleStudents,
    registered_students: registeredStudents,
    present_students: presentStudents,
    round_cleared_students: roundClearedStudents,
    shortlisted_students: shortlistedStudents,
    selected_students: selectedStudents,
    registration_rate: eligibleStudents ? percent(registeredStudents, eligibleStudents) : 0,
    attendance_rate: percent(presentStudents, Math.max(registeredStudents, 1)),
    shortlisting_rate: percent(shortlistedStudents, Math.max(registeredStudents, 1)),
    selection_rate: percent(selectedStudents, Math.max(registeredStudents, 1)),
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
  const driveIds = drives.map((drive) => drive.drive_id);
  const ctx = await loadDriveAnalyticsContext(driveIds);

  return drives.map((drive) => buildDriveTrendPoint(drive, ctx));
}

async function fetchStudentDrilldown(enrollmentNo: string): Promise<StudentDrilldownReport | null> {
  const enrollment = enrollmentNo.trim();
  if (!enrollment) return null;

  const { data: student, error: studentError } = await db
    .from("student_master")
    .select(`
  student_id,
  enrollment_no,
  first_name,
  middle_name,
  last_name,
  is_active,
  placement_preference,
  placement_status
`)
    .eq("enrollment_no", enrollment)
    .maybeSingle();

  if (studentError) throw studentError;
  if (!student?.student_id) return null;

  const studentId = student.student_id as string;

  const [applicationsResult, attendanceResult, activeDrivesResult, academicResult] =
    await Promise.all([
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

      db
        .from("student_academic_details")
        .select(
          `
      student_id,
      current_institute_name,
      current_degree_name,
      current_branch_name,
      graduation_year,
      current_cgpa,
      active_backlogs
    `,
        )
        .eq("student_id", studentId)
        .maybeSingle(),
    ]);

  const applications = toArray<any>(applicationsResult.data);
  const attendance = toArray<any>(attendanceResult.data);
  const activeDrives = toArray<any>(activeDrivesResult.data);
  const academic = academicResult.data as StudentAcademicRecord | null;
  const studentRecord = student as StudentMasterRecord;

  let eligibilityRows: AnyRecord[] = [];

  const eligibilityResult = await db.from("drive_eligibility").select(`
    eligibility_id,
    drive_id,
    allowed_institutes,
    allowed_branches,
    allowed_degrees,
    minimum_cgpa,
    maximum_active_backlogs,
    willing_to_relocate_required,
    additional_requirements,
    passing_out_batches
  `);

  if (eligibilityResult.error) {
    throw eligibilityResult.error;
  }

  eligibilityRows = toArray<any>(eligibilityResult.data);

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

  const eligibilityCriteriaByDrive = new Map<string, RecruitmentEligibilityCriteria>();

  for (const row of eligibilityRows) {
    eligibilityCriteriaByDrive.set(row.drive_id, {
      institutes: String(row.allowed_institutes ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),

      degrees: String(row.allowed_degrees ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),

      branches: String(row.allowed_branches ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),

      graduationYears: String(row.passing_out_batches ?? "")
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => !Number.isNaN(v)),

      minimumCgpa: row.minimum_cgpa ?? null,
      maximumActiveBacklogs: row.maximum_active_backlogs ?? null,
      maximumYearGap: null,
    });
  }

  let eligibleDrives = 0;

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
    const shortlisted = driveApplications.some((item) =>
      isShortlistedStatus(item.application_status),
    );
    const selected = driveApplications.some((item) => isSelectedStatus(item.application_status));
    const registered = driveApplications.length > 0;
    const criteria = eligibilityCriteriaByDrive.get(drive.drive_id);

    const evaluation =
      criteria && academic ? evaluateStudentEligibility(studentRecord, academic, criteria) : null;

    const eligible = evaluation?.eligible ?? false;

    if (eligible) {
      eligibleDrives++;
    }

    let status: StudentDriveBreakdownItem["status"] = "UNREGISTERED";
    if (hasPresent) {
      status = "PRESENT";
    } else if (hasAbsent) {
      status = "ABSENT";
    } else if (registered) {
      status = "REGISTERED";
    }

    return {
      drive_id: drive.drive_id,
      drive_name: drive.drive_name ?? "Unnamed Drive",
      company_name: drive.company_master?.company_name ?? null,
      status,
      application_count: driveApplications.length,
      eligible,
      registered,
      present: hasPresent,
      absent: !hasPresent && hasAbsent,
      shortlisted,
      selected,
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
    unregistered_drives: Math.max(eligibleDrives - registeredDriveIds.size, 0),
    applications_count: applications.length,
    shortlisted_count: applications.filter((item) => isShortlistedStatus(item.application_status))
      .length,
    selected_count: applications.filter((item) => isSelectedStatus(item.application_status)).length,
    attendance_percentage: percent(
      presentDriveIds.size,
      Math.max(presentDriveIds.size + absentDriveIds.size, 1),
    ),
    drive_breakdown: driveBreakdown,
  };
}

async function fetchRecentActivity(limit = 15): Promise<RecentActivityItem[]> {
  const [applicationsResult, attendanceResult, drivesResult, opportunitiesResult] =
    await Promise.all([
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
      ]
        .filter(Boolean)
        .join(" • "),
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
      ]
        .filter(Boolean)
        .join(" • "),
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
      ]
        .filter(Boolean)
        .join(" • "),
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

export async function getDriveBranchAnalytics(driveId: string) {
  const ctx = await loadDriveAnalyticsContext([driveId]);
  return buildBranchAnalytics(driveId, ctx);
}

export async function getDriveEligibility(driveId: string) {
  const ctx = await loadDriveAnalyticsContext([driveId]);
  const eligibilityRow = ctx.eligibility?.find((e: AnyRecord) => e.drive_id === driveId);
  if (!eligibilityRow) return null;

  const allowed_branches = String(eligibilityRow.allowed_branches ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed_degrees = String(eligibilityRow.allowed_degrees ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed_institutes = String(eligibilityRow.allowed_institutes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { allowed_branches, allowed_degrees, allowed_institutes };
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

export async function getRecentActivity(limit = 15) {
  return fetchRecentActivity(limit);
}

export async function getDashboardSnapshot(options: DashboardSnapshotOptions = {}) {
  const [kpis, driveTrend, recentActivity] = await Promise.all([
    getDashboardKpis(),
    getDriveTrend(options.driveTrendLimit ?? 10),
    getRecentActivity(options.recentActivityLimit ?? 15),
  ]);

  const selectedDriveId = options.selectedDriveId ?? null;
  const branchDistribution = selectedDriveId
    ? await getDriveBranchDistribution(selectedDriveId)
    : [];
  const branchAnalytics = selectedDriveId ? await getDriveBranchAnalytics(selectedDriveId) : [];
  const pipeline = selectedDriveId ? await getOpportunityPipeline(selectedDriveId) : null;
  const studentDrilldown = options.enrollmentNo
    ? await getStudentDrilldown(options.enrollmentNo)
    : null;

  const eligibility = selectedDriveId ? await getDriveEligibility(selectedDriveId) : null;

  return {
    kpis,
    driveTrend,
    selectedDriveId,
    branchDistribution,
    branchAnalytics,
    pipeline,
    eligibility,
    studentDrilldown,
    recentActivity,
    refreshedAt: new Date().toISOString(),
  } as DashboardSnapshot;
}

export const adminDashboardAnalyticsService = {
  getDashboardKpis,
  getDriveTrend,
  getDriveBranchDistribution,
  getDriveBranchAnalytics,
  getOpportunityPipeline,
  getStudentDrilldown,
  getSuccessMetrics,
  getRecentActivity,
  getDashboardSnapshot,
};

export default adminDashboardAnalyticsService;
