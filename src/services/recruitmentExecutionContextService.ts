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
}

export const recruitmentExecutionContextService =
  new RecruitmentExecutionContextService();