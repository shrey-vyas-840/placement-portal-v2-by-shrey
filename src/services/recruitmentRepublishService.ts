import { supabase } from "@/lib/supabase";
import { generateUuid } from "@/lib/generateUuid";
import { recruitmentProjectionService } from "@/services/recruitmentProjectionService";

export interface RepublishRecruitmentResult {
  driveId: string;
  companyId: string;
}

interface RepublishContext {
  draft: any;

  driveId: string;
  companyId: string;
  opportunityId: string;

  publishedAt: Date;

  publishRoleMap: Map<
    string,
    {
      driveRoleId: string;
      opportunityId: string;
    }
  >;
}

/**
 * ============================================================
 * Revision Draft Republish Pipeline
 * ============================================================
 *
 * Business lifecycle
 *
 * Published Recruitment
 *          │
 *          ▼
 * Revision Draft
 *          │
 *      Republish
 *          │
 *          ▼
 * Update Existing Recruitment
 *
 * ------------------------------------------------------------
 *
 * IMPORTANT
 *
 * This service NEVER creates another recruitment.
 *
 * It updates the existing production recruitment.
 *
 * Therefore it preserves:
 *
 * • company identity
 * • drive identity
 * • opportunity identity
 * • analytics
 * • applications
 * • execution history
 *
 * while replacing the editable configuration.
 *
 * ============================================================
 */

export async function republishRecruitmentDraft(draft: any): Promise<RepublishRecruitmentResult> {
  const driveId = draft.published_drive_id ?? draft.created_drive_id;

  if (!driveId) {
    throw new Error("Revision draft is not linked to a published recruitment.");
  }

  const companyId = draft.created_company_id;

  if (!companyId) {
    throw new Error("Revision draft is missing the published company reference.");
  }

  const { data: opportunity, error: opportunityError } = await (supabase as any)
    .from("opportunity_master")
    .select("opportunity_id")
    .eq("drive_id", driveId)
    .single();

  if (opportunityError) {
    throw opportunityError;
  }

  if (!opportunity) {
    throw new Error("Published opportunity could not be located.");
  }

  const publishRoleMap = new Map<
    string,
    {
      driveRoleId: string;
      opportunityId: string;
    }
  >();

  for (const role of draft.roles_data ?? []) {
    publishRoleMap.set(role.role_id, {
      driveRoleId: generateUuid(),
      opportunityId: generateUuid(),
    });
  }

  const context: RepublishContext = {
    draft,

    driveId,

    companyId,

    opportunityId: opportunity.opportunity_id,

    publishedAt: new Date(),

    publishRoleMap,
  };

  /**
   * ----------------------------------------------------------
   * PHASE 1
   * ----------------------------------------------------------
   */

  await updateDriveMaster(context);

  await updateOpportunity(context);

  await replaceDriveEligibility(context);

  /**
   * ----------------------------------------------------------
   * PHASE 2
   * ----------------------------------------------------------
   */

  await replaceRoles(context);

  /**
   * ----------------------------------------------------------
   * PHASE 3
   * ----------------------------------------------------------
   */

  await replaceQuestions(context);

  /**
   * ----------------------------------------------------------
   * PHASE 4
   * ----------------------------------------------------------
   */

  await synchronizeRevisionDraft(context);

  /**
   * Projection cache
   */

  await recruitmentProjectionService.initializeProjection(driveId);

  return {
    driveId,
    companyId,
  };
}

/* ===========================================================
 * Private helpers
 * ===========================================================
 */

async function updateDriveMaster(context: RepublishContext): Promise<void> {
  const { draft, driveId } = context;

  const generatedDriveName = `${String(draft.company_data.company_name).trim()} Recruitment`;

  const { error } = await (supabase as any)
    .from("drive_master")
    .update({
      drive_name: generatedDriveName,

      drive_type: draft.drive_data.drive_type,

      drive_mode: draft.drive_data.drive_mode,

      registration_deadline: draft.drive_data.registration_deadline ?? null,

      lowest_package_lpa: draft.drive_data.lowest_package_lpa,

      highest_package_lpa: draft.drive_data.highest_package_lpa,

      bond_years: draft.drive_data.bond_years,

      total_hiring_requirement: draft.drive_data.total_hiring_requirement,

      remarks: draft.drive_data.remarks,

      role_selection_enabled: draft.publish_data?.role_selection_enabled ?? true,

      minimum_role_selection: draft.publish_data?.minimum_role_selection ?? 1,

      maximum_role_selection: draft.publish_data?.maximum_role_selection ?? 1,

      updated_at: context.publishedAt.toISOString(),
    })
    .eq("drive_id", driveId);

  if (error) {
    throw error;
  }
}

async function updateOpportunity(context: RepublishContext): Promise<void> {
  const { draft, opportunityId } = context;

  const applicationStartDate =
    draft.drive_data?.application_open ??
    draft.publish_data?.application_start_date ??
    context.publishedAt.toISOString();

  const applicationEndDate =
    draft.drive_data?.application_close ??
    draft.publish_data?.application_end_date ??
    new Date(context.publishedAt.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const shouldBeOpen = new Date(applicationStartDate).getTime() <= context.publishedAt.getTime();

  const applicationStatus = shouldBeOpen ? "Open" : "Upcoming";

  const { error } = await (supabase as any)
    .from("opportunity_master")
    .update({
      opportunity_title: `${draft.company_data.company_name} Recruitment`,

      opportunity_description: draft.drive_data.remarks ?? null,

      application_start_date: applicationStartDate,

      application_end_date: applicationEndDate,

      application_status: applicationStatus,

      visible_to_students: true,
    })
    .eq("opportunity_id", opportunityId);

  if (error) {
    throw error;
  }
}

async function replaceDriveEligibility(context: RepublishContext): Promise<void> {
  const { draft, driveId } = context;

  await (supabase as any).from("drive_eligibility").delete().eq("drive_id", driveId);

  const { error } = await (supabase as any).from("drive_eligibility").insert({
    drive_id: driveId,

    allowed_institutes: (draft.eligibility_data?.allowed_institutes ?? []).join(","),

    allowed_branches: (draft.eligibility_data?.allowed_branches ?? []).join(","),

    allowed_degrees: (draft.eligibility_data?.allowed_degrees ?? []).join(","),

    passing_out_batches: (draft.eligibility_data?.passing_out_batches ?? []).join(","),

    minimum_cgpa:
      draft.eligibility_data?.minimum_cgpa === ""
        ? 0
        : Number(draft.eligibility_data?.minimum_cgpa ?? 0),

    maximum_active_backlogs:
      draft.eligibility_data?.maximum_active_backlogs === ""
        ? 0
        : Number(draft.eligibility_data?.maximum_active_backlogs ?? 0),

    willing_to_relocate_required: Boolean(draft.eligibility_data?.willing_to_relocate_required),

    additional_requirements: draft.eligibility_data?.additional_requirements ?? "",
  });

  if (error) {
    throw error;
  }
}

async function replaceRoles(context: RepublishContext): Promise<void> {
  const { draft, driveId, publishRoleMap } = context;

  /*
   * -------------------------------------------------------
   * Remove previous production role graph.
   *
   * We intentionally rebuild it from scratch using the
   * latest Revision Draft snapshot.
   * -------------------------------------------------------
   */

  const { data: existingRoles, error: existingRolesError } = await (supabase as any)
    .from("drive_roles")
    .select("drive_role_id")
    .eq("drive_id", driveId);

  if (existingRolesError) {
    throw existingRolesError;
  }

  const existingRoleIds = (existingRoles ?? []).map((role: any) => role.drive_role_id);

  if (existingRoleIds.length > 0) {
    await (supabase as any)
      .from("drive_role_questions")
      .delete()
      .in("drive_role_id", existingRoleIds);

    await (supabase as any)
      .from("drive_role_details")
      .delete()
      .in("drive_role_id", existingRoleIds);

    await (supabase as any)
      .from("drive_role_timeline")
      .delete()
      .in("drive_role_id", existingRoleIds);

    await (supabase as any)
      .from("drive_role_eligibility")
      .delete()
      .in("drive_role_id", existingRoleIds);
  }

  await (supabase as any).from("drive_roles").delete().eq("drive_id", driveId);

  /*
   * -------------------------------------------------------
   * Rebuild production roles
   * -------------------------------------------------------
   */

  for (const role of draft.roles_data ?? []) {
    const ids = publishRoleMap.get(role.role_id);

    if (!ids) {
      throw new Error(`Missing publish mapping for role ${role.role_name}`);
    }

    const driveRoleId = ids.driveRoleId;

    /*
     * drive_roles
     */

    const { error: roleError } = await (supabase as any).from("drive_roles").insert({
      drive_role_id: driveRoleId,

      drive_id: driveId,

      drive_role_name: role.role_name,

      role_description: role.role_description ?? null,

      role_type: role.role_type ?? null,

      required_skills: Array.isArray(role.required_skills)
        ? role.required_skills.join(",")
        : (role.required_skills ?? null),

      inherit_default_questions: role.inheritDefaultQuestions ?? true,
    });

    if (roleError) {
      throw roleError;
    }

    /*
     * drive_role_details
     */

    const { error: detailsError } = await (supabase as any).from("drive_role_details").insert({
      drive_role_id: driveRoleId,

      employment_type: role.employment_type,

      work_mode: role.work_mode,

      openings: role.openings === "" ? null : Number(role.openings),

      fixed_ctc:
        role.compensation?.fixed_ctc === "" ? null : Number(role.compensation?.fixed_ctc ?? 0),

      variable_ctc:
        role.compensation?.variable_ctc === ""
          ? null
          : Number(role.compensation?.variable_ctc ?? 0),

      joining_bonus:
        role.compensation?.joining_bonus === ""
          ? null
          : Number(role.compensation?.joining_bonus ?? 0),

      retention_bonus:
        role.compensation?.retention_bonus === ""
          ? null
          : Number(role.compensation?.retention_bonus ?? 0),

      internship_stipend:
        role.compensation?.internship_stipend === ""
          ? null
          : Number(role.compensation?.internship_stipend ?? 0),

      ppo_package:
        role.compensation?.ppo_package === "" ? null : Number(role.compensation?.ppo_package ?? 0),

      department: role.hiring?.department ?? null,

      expected_joining_date: role.hiring?.expected_joining_date || null,

      hiring_locations: (role.hiring?.locations ?? []).join(","),

      travel_required: role.hiring?.travel_required ?? false,

      shift_details: role.hiring?.shift_details ?? null,
    });

    if (detailsError) {
      throw detailsError;
    }

    /*
     * drive_role_eligibility
     */

    if (!role.inheritDefaultEligibility && role.eligibility) {
      const eligibility = role.eligibility;

      const { error: eligibilityError } = await (supabase as any)
        .from("drive_role_eligibility")
        .insert({
          drive_role_id: driveRoleId,

          allowed_institutes: (eligibility.allowed_institutes ?? []).join(","),

          allowed_branches: (eligibility.allowed_branches ?? []).join(","),

          allowed_degrees: (eligibility.allowed_degrees ?? []).join(","),

          passing_out_batches: (eligibility.passing_out_batches ?? []).join(","),

          minimum_cgpa: eligibility.minimum_cgpa === "" ? null : Number(eligibility.minimum_cgpa),

          maximum_active_backlogs:
            eligibility.maximum_active_backlogs === ""
              ? null
              : Number(eligibility.maximum_active_backlogs),

          willing_to_relocate_required: eligibility.willing_to_relocate_required,

          additional_requirements: eligibility.additional_requirements,
        });

      if (eligibilityError) {
        throw eligibilityError;
      }
    }

    /*
     * drive_role_timeline
     */

    for (const [index, stage] of (role.timeline ?? []).entries()) {
      const { error: timelineError } = await (supabase as any).from("drive_role_timeline").insert({
        drive_role_id: driveRoleId,

        stage_name: stage.stage,

        stage_date: stage.date || null,

        description: stage.description ?? null,

        display_order: index + 1,
      });

      if (timelineError) {
        throw timelineError;
      }
    }
  }
}

async function replaceQuestions(context: RepublishContext): Promise<void> {
  throw new Error("Not implemented.");
}

async function synchronizeRevisionDraft(context: RepublishContext): Promise<void> {
  throw new Error("Not implemented.");
}
