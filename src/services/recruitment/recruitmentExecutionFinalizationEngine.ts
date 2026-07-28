import { SupabaseClient } from "@supabase/supabase-js";

import type {
  RecruitmentExecutionWorkspace,
  RecruitmentExecutionParticipantWithStudent,
  RecruitmentExecutionHistorySummary,
  RecruitmentExecutionEditedRow,
  RecruitmentExecutionRoundRow,
} from "@/types/recruitmentExecution";

export type FinalizationBlockerCode =
  | "OPPORTUNITY_OPEN"
  | "UNSAVED_STAGE"
  | "DIRTY_STAGE"
  | "PENDING_ATTENDANCE"
  | "PENDING_SHORTLIST"
  | "PENDING_PROGRESS"
  | "PENDING_BATCH_ASSIGNMENT"
  | "PENDING_BATCH_COMPLETION"
  | "PIPELINE_IN_PROGRESS"
  | "NO_SELECTED_CANDIDATES";

export interface FinalizationBlocker {
  code: FinalizationBlockerCode;
  title: string;
  description: string;
  stageNumber?: number;
  executionRoundId?: string;
  executionParticipantId?: string;
}

export interface FinalizationSelectedCandidate {
  executionParticipantId: string;
  applicationId: string;
  studentId: string;

  enrollmentNumber: string;
  studentName: string;
  instituteName: string;
  branchName: string;

  selectedAtStage: number;
  selectedStageName: string;

  companyId: string;
  companyName: string;

  opportunityId: string;
  driveId: string;

  packageLpa: number | null;

  placementType: string | null;
}

export interface FinalizationPendingParticipant {
  executionParticipantId: string;
  studentId: string;

  enrollmentNumber: string;
  studentName: string;

  currentStageNumber: number | null;
  currentStageName: string | null;

  reason: string;
}

export interface FinalizationStatistics {
  totalParticipants: number;

  selectedParticipants: number;

  noProgressParticipants: number;

  pendingParticipants: number;

  shortlistedParticipants: number;

  dirtyStages: number;

  blockingIssues: number;
}

export interface FinalizationPreparationResult {
  canFinalize: boolean;

  blockers: FinalizationBlocker[];

  selectedCandidates: FinalizationSelectedCandidate[];

  pendingParticipants: FinalizationPendingParticipant[];

  statistics: FinalizationStatistics;
}


export interface FinalizationPlacementRow {
  studentId: string;

  opportunityId: string;

  driveId: string;

  companyId: string;

  companyName: string;

  packageLpa: number;

  placementType: string;

  placedAt: string;

  placementNotes: string;

  isCurrent: boolean;
}

export interface FinalizeExecutionRequest {
  finalizedBy: string;

  preparation: FinalizationPreparationResult;

  verification: {
    notes: string;

placements: Array<{
  studentId: string;

  placementType: string;

  packageLpa: number;

  placementNotes: string;
}>;
  };
}

interface FinalizationRpcPayload {
  finalSelectionRows: unknown[];

  placementHistoryRows: FinalizationPlacementRow[];

  studentIds: string[];
}

interface EngineContext {
  supabase: SupabaseClient;

  workspace: RecruitmentExecutionWorkspace;
}

type DerivedParticipantOutcome =
  | "NO_PROGRESS"
  | "SHORTLISTED"
  | "SELECTED";

type ParticipantValidationState =
  | "READY"
  | "PENDING";

interface DerivedParticipantState {
  participant: RecruitmentExecutionParticipantWithStudent;

  history?: RecruitmentExecutionHistorySummary;

  outcome?: DerivedParticipantOutcome;

  validationState: ParticipantValidationState;

  pendingReason?: string;
}

export class RecruitmentExecutionFinalizationEngine {
  private readonly supabase: SupabaseClient;

  private readonly workspace: RecruitmentExecutionWorkspace;

  constructor(context: EngineContext) {
    this.supabase = context.supabase;
    this.workspace = context.workspace;
  }

  async prepareFinalization(): Promise<FinalizationPreparationResult> {
  return this.buildPreparationResult();
}

async finalize(
  request: FinalizeExecutionRequest,
): Promise<void> {
  const { preparation, verification } = request;

  if (!preparation.canFinalize) {
    throw new Error(
      "Recruitment execution cannot be finalized because blocking issues still exist.",
    );
  }

  const placementRows: FinalizationPlacementRow[] =
    preparation.selectedCandidates.map((candidate) => {
      const configuration =
        verification.placements.find(
          (placement) =>
            placement.studentId === candidate.studentId,
        );

      return {
        studentId: candidate.studentId,

        opportunityId: candidate.opportunityId,

        driveId: candidate.driveId,

        companyId: candidate.companyId,

        companyName: candidate.companyName,

   packageLpa:
  configuration?.packageLpa ??
  4,

placementType:
  configuration?.placementType ??
  "On Campus Internship + PPO",

placedAt:
  new Date()
    .toISOString()
    .slice(0, 10),

placementNotes:
  configuration?.placementNotes ?? "",

isCurrent: true,
      };
    });

await this.executeFinalization({
    finalizedBy: request.finalizedBy,

    preparation,

    placementRows,

    notes: verification.notes,
});
}
  // --------------------------------------------------------------------------
  // Context Builders
  // --------------------------------------------------------------------------

  private get participants(): RecruitmentExecutionParticipantWithStudent[] {
    return this.workspace.participants;
  }

  private get rounds(): RecruitmentExecutionRoundRow[] {
    return this.workspace.rounds;
  }

  private get history() {
    return this.workspace.historySummary;
  }

  private getParticipantMap() {
    return new Map(
      this.participants.map((participant) => [
        participant.execution_participant_id,
        participant,
      ]),
    );
  }

  private getHistoryMap() {
    return new Map(
      this.history.map((history) => [
        history.execution_participant_id,
        history,
      ]),
    );
  }

  private getRoundMap() {
    return new Map(
      this.rounds.map((round) => [
        round.execution_round_id,
        round,
      ]),
    );
  }

 private getRound(
  executionRoundId: string,
): RecruitmentExecutionRoundRow | undefined {
  return this.rounds.find(
    (round) => round.execution_round_id === executionRoundId,
  );
}

private getStageName(
  executionRoundId: string | null,
): string | null {
  if (!executionRoundId) {
    return null;
  }

  return this.getRound(executionRoundId)?.round_name ?? null;
}

private getStageNumber(
  executionRoundId: string | null,
): number | null {
  if (!executionRoundId) {
    return null;
  }

  return this.getRound(executionRoundId)?.stage_number ?? null;
}

  private getLatestHistory(
    executionParticipantId: string,
  ): RecruitmentExecutionHistorySummary | undefined {
    return this.getHistoryMap().get(executionParticipantId);
  }

  private getEditedRow(
    executionParticipantId: string,
  ): RecruitmentExecutionEditedRow | undefined {
    const history = this.getLatestHistory(executionParticipantId);

    if (!history) {
      return undefined;
    }

    return {
      attendanceStatus: history.attendance_status,
      gateStatus: history.restriction_override
        ? "ALLOWED"
        : history.gate_status,
      progressionStatus: history.progression_status,
      remarks: history.remarks ?? "",
      absenceDisposition: history.absence_disposition,
      absenceReason: history.absence_reason ?? "",
      restrictionOverride: history.restriction_override,
      overrideReason: history.restriction_override_reason ?? "",
    };
  }

  private createBlocker(
    code: FinalizationBlockerCode,
    title: string,
    description: string,
    stageNumber?: number,
    executionRoundId?: string,
    executionParticipantId?: string,
  ): FinalizationBlocker {
    return {
      code,
      title,
      description,
      stageNumber,
      executionRoundId,
      executionParticipantId,
    };
  }

  private emptyStatistics(): FinalizationStatistics {
    return {
      totalParticipants: 0,
      selectedParticipants: 0,
     noProgressParticipants: 0,
      pendingParticipants: 0,
      shortlistedParticipants: 0,
      dirtyStages: 0,
      blockingIssues: 0,
    };
  }

  private createPreparationResult(): FinalizationPreparationResult {
    return {
      canFinalize: false,
      blockers: [],
      selectedCandidates: [],
      pendingParticipants: [],
      statistics: this.emptyStatistics(),
    };
  }

  // --------------------------------------------------------------------------
  // Participant State Derivation
  // --------------------------------------------------------------------------

  private deriveParticipantState(
    participant: RecruitmentExecutionParticipantWithStudent,
  ): DerivedParticipantState {
    const history = this.getLatestHistory(
      participant.execution_participant_id,
    );

    if (!history) {
      return {
        participant,
        validationState: "PENDING",
        pendingReason:
          "Participant has not yet entered the execution pipeline.",
      };
    }

    switch (history.progression_status) {
      case "SELECTED":
        return {
          participant,
          history,
          outcome: "SELECTED",
          validationState: "READY",
        };

      case "SHORTLISTED":
        return {
          participant,
          history,
          outcome: "SHORTLISTED",
          validationState: "READY",
        };

      case "NONE":
      default: {
        if (history.attendance_status === null) {
          return {
            participant,
            history,
            validationState: "PENDING",
            pendingReason:
              "Attendance has not yet been completed.",
          };
        }

        return {
          participant,
          history,
          outcome: "NO_PROGRESS",
          validationState: "READY",
        };
      }
    }
  }
  
    // --------------------------------------------------------------------------
  // Finalization Validation
  // --------------------------------------------------------------------------

private validateParticipants(
  result: FinalizationPreparationResult,
): void {
  result.statistics.totalParticipants = this.participants.length;

  for (const participant of this.participants) {
    const state = this.deriveParticipantState(participant);

    const studentName =
      [
        participant.student.first_name,
        participant.student.middle_name,
        participant.student.last_name,
      ]
        .filter(Boolean)
        .join(" ") || "Unknown Student";

    if (state.validationState === "PENDING") {
      result.pendingParticipants.push({
        executionParticipantId:
          participant.execution_participant_id,
        studentId: participant.student_id,

        enrollmentNumber:
          participant.student.enrollment_no,

        studentName,

        currentStageNumber: state.history
          ? this.getStageNumber(
              state.history.execution_round_id,
            )
          : null,

        currentStageName: state.history
          ? this.getStageName(
              state.history.execution_round_id,
            )
          : null,

        reason:
          state.pendingReason ??
          "Participant is still pending.",
      });

      continue;
    }

    switch (state.outcome) {
      case "SELECTED":
        result.statistics.selectedParticipants++;
        break;

      case "SHORTLISTED":
        result.statistics.shortlistedParticipants++;

        result.pendingParticipants.push({
          executionParticipantId:
            participant.execution_participant_id,
          studentId: participant.student_id,

          enrollmentNumber:
            participant.student.enrollment_no,

          studentName,

          currentStageNumber:
            this.getStageNumber(
              state.history!.execution_round_id,
            ),

          currentStageName:
            this.getStageName(
              state.history!.execution_round_id,
            ),

          reason:
            "Participant is still progressing through the recruitment pipeline.",
        });

        break;

      case "NO_PROGRESS":
        result.statistics.noProgressParticipants++;
        break;
    }
  }

  result.statistics.pendingParticipants =
    result.pendingParticipants.length;
}

  // --------------------------------------------------------------------------
  // Selected Candidate Aggregation
  // --------------------------------------------------------------------------

  private buildSelectedCandidates(
    result: FinalizationPreparationResult,
  ): void {
    for (const participant of this.participants) {
      const state = this.deriveParticipantState(participant);

      if (state.outcome !== "SELECTED") {
        continue;
      }

      const studentName =
        [
          participant.student.first_name,
          participant.student.middle_name,
          participant.student.last_name,
        ]
          .filter(Boolean)
          .join(" ") || "Unknown Student";

      const selectedRole =
        participant.selected_roles[0];

      result.selectedCandidates.push({
        executionParticipantId:
          participant.execution_participant_id,

        applicationId:
          participant.application_id,

        studentId:
          participant.student_id,

        enrollmentNumber:
          participant.student.enrollment_no,

        studentName,

        instituteName: "",

        branchName:
          selectedRole?.drive_role_name ?? "",

        selectedAtStage:
          this.getStageNumber(
            state.history!.execution_round_id,
          ) ?? 0,

        selectedStageName:
          this.getStageName(
            state.history!.execution_round_id,
          ) ?? "",

        companyId:
          this.workspace.series.company_id,

        companyName:
          (
            this.workspace.series
              .series_snapshot
              ?.company_name as string | undefined
          ) ?? "",

        opportunityId:
          this.workspace.series.opportunity_id,

        driveId:
          this.workspace.series.drive_id,

        packageLpa: null,

        placementType: null,
      });
    }
  }

  private buildPipelineBlockers(
    result: FinalizationPreparationResult,
  ): void {
    if (result.pendingParticipants.length > 0) {
      result.blockers.push(
        this.createBlocker(
          "PIPELINE_IN_PROGRESS",
          "Recruitment Pipeline Still Active",
          "Some participants are still active in the recruitment pipeline.",
        ),
      );
    }

    if (result.statistics.selectedParticipants === 0) {
      result.blockers.push(
        this.createBlocker(
          "NO_SELECTED_CANDIDATES",
          "No Selected Candidates",
          "Final Save requires at least one selected candidate.",
        ),
      );
    }

    result.statistics.blockingIssues =
      result.blockers.length;
  }

    // --------------------------------------------------------------------------
  // Finalization Preparation
  // --------------------------------------------------------------------------

  private finalizeStatistics(
    result: FinalizationPreparationResult,
  ): void {
    result.statistics.pendingParticipants =
      result.pendingParticipants.length;

    result.statistics.blockingIssues =
      result.blockers.length;

    result.canFinalize =
      result.blockers.length === 0;
  }

  private buildPreparationResult(): FinalizationPreparationResult {
    const result =
      this.createPreparationResult();

this.validateParticipants(result);

this.buildSelectedCandidates(result);

this.buildPipelineBlockers(result);

    this.finalizeStatistics(result);

    return result;
  }

    // --------------------------------------------------------------------------
  // RPC Payload Builders
  // --------------------------------------------------------------------------

  private buildFinalizationPayload(
    preparation: FinalizationPreparationResult,
  ): FinalizationRpcPayload {
    return {
      finalSelectionRows: preparation.selectedCandidates.map(
  (candidate) => ({
    execution_id: this.workspace.execution.execution_id,

    execution_participant_id:
      candidate.executionParticipantId,

    application_id:
      candidate.applicationId,

    student_id:
      candidate.studentId,
  }),
),

placementHistoryRows: [],

      studentIds:
        preparation.selectedCandidates.map(
          (candidate) => candidate.studentId,
        ),
    };
  }

    // --------------------------------------------------------------------------
  // Finalization RPC
  // --------------------------------------------------------------------------

private async executeFinalization({
  finalizedBy,
  preparation,
  placementRows,
  notes,
}: {
  finalizedBy: string;

  preparation: FinalizationPreparationResult;

  placementRows: FinalizationPlacementRow[];

  notes: string;

}) {
    const payload =
      this.buildFinalizationPayload(
        preparation,
      );

    const { data, error } =
      await this.supabase.rpc(
        "finalize_recruitment_execution",
        {
          p_execution_id:
           this.workspace.execution.execution_id,

       p_finalized_by:
    finalizedBy,

          p_finalization_notes:
            notes || null,

          p_final_selection_rows:
            payload.finalSelectionRows,

p_placement_history_rows:
    placementRows,

          p_student_ids:
            payload.studentIds,
        },
      );

    if (error) {
      throw error;
    }

    return data;
  }

