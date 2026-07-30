import { supabase } from "@/integrations/supabase/client";
import type {
  RecruitmentExecutionRow,
  RecruitmentExecutionSeriesRow,
} from "@/types/recruitmentExecution";

export class RecruitmentExecutionParticipantInitializationService {
  private getExecutionRevision!: (executionId: string) => Promise<RecruitmentExecutionRow | null>;

  private getExecutionSeries!: (seriesId: string) => Promise<RecruitmentExecutionSeriesRow | null>;

  registerProviders(input: {
    getExecutionRevision: (executionId: string) => Promise<RecruitmentExecutionRow | null>;

    getExecutionSeries: (seriesId: string) => Promise<RecruitmentExecutionSeriesRow | null>;
  }) {
    this.getExecutionRevision = input.getExecutionRevision;
    this.getExecutionSeries = input.getExecutionSeries;
  }

  constructor(
    private readonly applicationsTable: string,
    private readonly participantsTable: string,
  ) {}

  async initializeParticipants(executionId: string): Promise<number> {
    const execution = await this.getExecutionRevision(executionId);

    if (!execution) {
      throw new Error("Execution not found.");
    }

    const series = await this.getExecutionSeries(execution.series_id);

    if (!series) {
      throw new Error("Execution series not found.");
    }

    const { data: applications, error: applicationError } = await (supabase as any)
      .from(this.applicationsTable)
      .select(
        `
      application_id,
      student_id
    `,
      )
      .eq("opportunity_id", series.opportunity_id);

    if (applicationError) {
      throw applicationError;
    }

    const { data: existingParticipants, error: existingError } = await (supabase as any)
      .from(this.participantsTable)
      .select("application_id")
      .eq("execution_id", executionId);

    if (existingError) {
      throw existingError;
    }

    const existingApplicationIds = new Set(
      (existingParticipants ?? []).map((participant: any) => participant.application_id),
    );

    const rowsToInsert = (applications ?? [])
      .filter((application: any) => !existingApplicationIds.has(application.application_id))
      .map((application: any) => ({
        execution_id: executionId,
        application_id: application.application_id,
        student_id: application.student_id,
      }));

    if (rowsToInsert.length === 0) {
      return 0;
    }

    const { error: insertError } = await (supabase as any)
      .from(this.participantsTable)
      .insert(rowsToInsert);

    if (insertError) {
      throw insertError;
    }

    return rowsToInsert.length;
  }
}

export const recruitmentExecutionParticipantInitializationService =
  new RecruitmentExecutionParticipantInitializationService(
    "student_opportunity_applications",
    "recruitment_execution_participants",
  );
