import { supabase } from "@/integrations/supabase/client";
import type {
  RecruitmentExecutionRow,
  RecruitmentExecutionSeriesRow,
} from "@/types/recruitmentExecution";

const OPPORTUNITY_TABLE = "opportunity_master";

export class RecruitmentExecutionContextService {
  async getExecutionContext(input: {
    execution: RecruitmentExecutionRow;
    series: RecruitmentExecutionSeriesRow;
  }) {
    const { data: opportunity, error } = await (supabase as any)
      .from(OPPORTUNITY_TABLE)
      .select("*")
      .eq("opportunity_id", input.series.opportunity_id)
      .single();

    if (error) {
      throw error;
    }

    return {
      execution: input.execution,
      series: input.series,
      opportunity,
    };
  }

  async validateOpportunityClosed(input: {
  execution: RecruitmentExecutionRow;
  series: RecruitmentExecutionSeriesRow;
}) {
  const context = await this.getExecutionContext(input);

  if (context.opportunity.application_status !== "Closed") {
    throw new Error(
      "Recruitment execution cannot be finalized while applications are still accepting submissions.",
    );
  }

  return context;
}

async getCompanyName(input: {
  execution: RecruitmentExecutionRow;
  series: RecruitmentExecutionSeriesRow;
}) {
  const context = await this.getExecutionContext(input);

  return context.opportunity.company_name ?? "";
}


async getOpportunity(input: {
  execution: RecruitmentExecutionRow;
  series: RecruitmentExecutionSeriesRow;
}) {
  const context = await this.getExecutionContext(input);

  return context.opportunity;
}




}

export const recruitmentExecutionContextService =
  new RecruitmentExecutionContextService();