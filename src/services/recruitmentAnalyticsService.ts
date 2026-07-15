import { supabase } from "@/lib/supabase";

export interface RecruitmentWorkspaceSummary {
  draftId: string;

  driveId: string | null;

  opportunityId: string |null;

  companyId: string | null;

  companyName: string;

  recruitmentName: string;

  applicationStatus: string;

  applicationStartDate: string | null;

  applicationEndDate: string | null;

  totalApplications: number;

  totalRoles: number;

  averageApplicationsPerRole: number;

  recentApplications: {
    applicationId: string;
    studentId: string;
    appliedAt: string;
  }[];
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
  .select(`
    application_id,
    student_id,
    applied_at
  `)
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

  if (driveId) {
    const { count } = await (supabase as any)
      .from("drive_roles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("drive_id", driveId);

    roleCount = count ?? 0;
  }

  return {
    draftId,

    driveId,

    opportunityId: opportunity?.opportunity_id ?? null,

    companyId: draft.created_company_id ?? null,

    companyName:
      draft.company_data?.company_name ??
      draft.company_data?.companyName ??
      "",

    recruitmentName: draft.draft_name,

    applicationStatus:
      opportunity?.application_status ?? "Draft",

    applicationStartDate:
      opportunity?.application_start_date ?? null,

    applicationEndDate:
      opportunity?.application_end_date ?? null,

    totalApplications: applicationCount,

   totalRoles: roleCount,

averageApplicationsPerRole:
  roleCount === 0
    ? 0
    : Number((applicationCount / roleCount).toFixed(1)),

recentApplications,
  };
}