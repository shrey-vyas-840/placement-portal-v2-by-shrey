import { supabase } from "@/integrations/supabase/client";

export interface ExecutionRestrictionState {
  studentId: string;

  isGloballyRestricted: boolean;

  restrictionReason: string | null;

  hasOpportunityOverride: boolean;

  effectiveGateStatus: "ALLOWED" | "RESTRICTED";

  canOverride: boolean;
}

export class RecruitmentExecutionRestrictionService {
  static async resolveParticipantRestrictions(
    opportunityId: string,
    participantStudentIds: string[],
  ): Promise<Map<string, ExecutionRestrictionState>> {
    const result = new Map<string, ExecutionRestrictionState>();

    if (participantStudentIds.length === 0) {
      return result;
    }

    // ------------------------------------------------------------
    // Load active global restrictions
    // ------------------------------------------------------------

    const { data: restrictions, error: restrictionError } = await (supabase as any)
      .from("student_restrictions")
      .select(
        `
          student_id,
          restriction_reason
        `,
      )
      .in("student_id", participantStudentIds);

    if (restrictionError) {
      throw restrictionError;
    }

    // ------------------------------------------------------------
    // Load opportunity overrides
    // ------------------------------------------------------------

    const { data: overrides, error: overrideError } = await (supabase as any)
      .from("student_placement_overrides")
      .select(
        `
          student_id
        `,
      )
      .eq("opportunity_id", opportunityId)
      .in("student_id", participantStudentIds);

    if (overrideError) {
      throw overrideError;
    }

    const restrictedMap = new Map<
      string,
      {
        reason: string | null;
      }
    >();

(restrictions ?? []).forEach(
  (restriction: {
    student_id: string;
    restriction_reason: string | null;
  }) => {
    restrictedMap.set(restriction.student_id, {
      reason: restriction.restriction_reason,
    });
  },
);

    const overrideSet = new Set<string>();

(overrides ?? []).forEach(
  (override: {
    student_id: string;
  }) => {
    overrideSet.add(override.student_id);
  },
);
    // ------------------------------------------------------------
    // Build execution restriction model
    // ------------------------------------------------------------

    participantStudentIds.forEach((studentId) => {
      const restriction = restrictedMap.get(studentId);

      const isRestricted = !!restriction;

      const hasOverride = overrideSet.has(studentId);

      result.set(studentId, {
        studentId,

        isGloballyRestricted: isRestricted,

        restrictionReason: restriction?.reason ?? null,

        hasOpportunityOverride: hasOverride,

        effectiveGateStatus:
          isRestricted && !hasOverride
            ? "RESTRICTED"
            : "ALLOWED",

        canOverride: isRestricted && !hasOverride,
      });
    });

    return result;
  }
}

export const recruitmentExecutionRestrictionService =
  RecruitmentExecutionRestrictionService;