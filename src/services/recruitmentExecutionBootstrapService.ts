import { supabase } from "@/integrations/supabase/client";
import type {
  RecruitmentExecutionSeriesSnapshot,
  } from "@/types/recruitmentExecution";

export interface RecruitmentExecutionBootstrapContext {
  opportunityId: string;
  driveId: string;
  companyId: string;

  seriesSnapshot: RecruitmentExecutionSeriesSnapshot;
}
export async function getExecutionBootstrapContext(
  draftId: string,
): Promise<RecruitmentExecutionBootstrapContext> {
  // --------------------------------------------------------
  // Published Opportunity
  // --------------------------------------------------------

const { data: draft, error: draftError } = await (supabase as any)
  .from("recruitment_drafts")
  .select(`
      published_drive_id,
      created_company_id,
      company_data
  `)
  .eq("draft_id", draftId)
  .single();

if (draftError) {
  throw draftError;
}

const { data: opportunity, error: opportunityError } = await (supabase as any)
  .from("opportunity_master")
  .select(`
      opportunity_id,
      drive_id,
      opportunity_title
  `)
  .eq("drive_id", draft.published_drive_id)
  .single();

if (opportunityError) {
  throw opportunityError;
}

  // --------------------------------------------------------
  // Series Snapshot
  // --------------------------------------------------------

const seriesSnapshot: RecruitmentExecutionSeriesSnapshot = {
  opportunity_id: opportunity.opportunity_id,
  drive_id: opportunity.drive_id,
  company_id: draft.created_company_id,

  opportunity_title:
    opportunity.opportunity_title ?? null,

company_name:
    draft.company_data?.company_name ??
    draft.company_data?.companyName ??
    null,
};

  return {
  opportunityId: opportunity.opportunity_id,
  driveId: opportunity.drive_id,
  companyId: draft.created_company_id,

  seriesSnapshot,
};  
}