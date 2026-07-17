import { supabase } from "@/integrations/supabase/client";
import { adminOpportunityService } from "./adminOpportunityService";

export interface RecruitmentSettings {
  driveId: string;
  opportunityId: string;

  applicationStartDate: string | null;
  applicationEndDate: string | null;

  applicationStatus: string | null;
  visibleToStudents: boolean;

  allowRestrictedStudents: boolean;
  allowPlacedStudents: boolean;
}

class RecruitmentSettingsService {
  async getSettings(draftId: string): Promise<RecruitmentSettings> {
    const { data: draft, error: draftError } = await (supabase as any)
      .from("recruitment_drafts")
      .select("published_drive_id, published_opportunity_id")
      .eq("draft_id", draftId)
      .single();

    if (draftError) {
      throw draftError;
    }

    if (!draft?.published_drive_id) {
      throw new Error("Recruitment has not been published.");
    }

    const { data: drive, error: driveError } = await (supabase as any)
      .from("drive_master")
      .select(
        `
        drive_id,
        allow_restricted_students,
        allow_placed_students
      `,
      )
      .eq("drive_id", draft.published_drive_id)
      .single();

    if (driveError) {
      throw driveError;
    }

    const { data: opportunity, error: opportunityError } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
          opportunity_id,
          application_start_date,
          application_end_date,
          application_status,
          visible_to_students
        `,
      )
      .eq("opportunity_id", draft.published_opportunity_id)
      .single();

    if (opportunityError) {
      throw opportunityError;
    }

    return {
      driveId: drive.drive_id,
      opportunityId: opportunity.opportunity_id,

      applicationStartDate: opportunity.application_start_date,

      applicationEndDate: opportunity.application_end_date,

      applicationStatus: opportunity.application_status,

      visibleToStudents: opportunity.visible_to_students ?? true,

      allowRestrictedStudents: drive.allow_restricted_students ?? false,

      allowPlacedStudents: drive.allow_placed_students ?? false,
    };
  }
  async extendDeadline(opportunityId: string, newDeadline: string) {
    return adminOpportunityService.extendDeadline(opportunityId, newDeadline);
  }

  async updateVisibility(opportunityId: string, visible: boolean) {
    return adminOpportunityService.toggleVisibility(opportunityId, visible);
  }

  async updateEligibilityOverrides(
    driveId: string,
    config: {
      allowRestrictedStudents: boolean;
      allowPlacedStudents: boolean;
    },
  ) {
    const { error } = await (supabase as any)
      .from("drive_master")
      .update({
        allow_restricted_students: config.allowRestrictedStudents,

        allow_placed_students: config.allowPlacedStudents,
      })
      .eq("drive_id", driveId);

    if (error) {
      throw error;
    }
  }

  async closeRecruitment(opportunityId: string) {
    const { error } = await (supabase as any)
      .from("opportunity_master")
      .update({
        application_status: "Closed",
        visible_to_students: false,
      })
      .eq("opportunity_id", opportunityId);

    if (error) {
      throw error;
    }
  }

  async reopenRecruitment(opportunityId: string) {
    const { error } = await (supabase as any)
      .from("opportunity_master")
      .update({
        application_status: "Open",
        visible_to_students: true,
      })
      .eq("opportunity_id", opportunityId);

    if (error) {
      throw error;
    }
  }

  async archiveRecruitment(draftId: string) {
    const { error } = await (supabase as any)
      .from("recruitment_drafts")
      .update({
        archived: true,
      })
      .eq("draft_id", draftId);

    if (error) {
      throw error;
    }
  }
}

export const recruitmentSettingsService = new RecruitmentSettingsService();
