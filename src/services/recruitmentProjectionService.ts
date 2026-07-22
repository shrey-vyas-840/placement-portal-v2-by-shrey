import { supabase } from "@/lib/supabase";

interface ProjectionUpdate {
  eligible_students?: number;
  registered_students?: number;
  total_applications?: number;
  present_students?: number;
  absent_students?: number;
  shortlisted_students?: number;
  interviewed_students?: number;
  selected_students?: number;
  rejected_students?: number;
}

async function ensureProjectionRow(driveId: string) {
  const { data, error } = await (supabase as any)
    .from("recruitment_projection")
    .select("drive_id")
    .eq("drive_id", driveId)
    .maybeSingle();

  if (error) throw error;

  if (data) return;

  const { error: insertError } = await (supabase as any).from("recruitment_projection").insert({
    drive_id: driveId,
  });

  if (insertError) throw insertError;
}

async function updateProjection(driveId: string, values: ProjectionUpdate) {
  await ensureProjectionRow(driveId);

  const { error } = await (supabase as any)
    .from("recruitment_projection")
    .update(values)
    .eq("drive_id", driveId)
    .eq("projection_locked", false);

  if (error) throw error;
}

export const recruitmentProjectionService = {
  async initializeProjection(driveId: string) {
    await ensureProjectionRow(driveId);
  },

  async getProjection(driveId: string) {
    const { data, error } = await (supabase as any)
      .from("recruitment_projection")
      .select("*")
      .eq("drive_id", driveId)
      .single();

    if (error) throw error;

    return data;
  },

  async ensureProjection(driveId: string) {
    await ensureProjectionRow(driveId);

    return this.getProjection(driveId);
  },

  async invalidateEligibility(driveId: string) {
    const { error } = await (supabase as any)
      .from("recruitment_projection")
      .update({
        eligible_students: null,
        eligibility_computed_at: null,
      })
      .eq("drive_id", driveId)
      .eq("projection_locked", false);

    if (error) throw error;
  },

  async updateEligibleStudents(driveId: string, eligibleStudents: number) {
    const { error } = await (supabase as any)
      .from("recruitment_projection")
      .update({
        eligible_students: eligibleStudents,
        eligibility_computed_at: new Date().toISOString(),
      })
      .eq("drive_id", driveId)
      .eq("projection_locked", false);

    if (error) throw error;
  },

  async needsEligibilityRefresh(driveId: string) {
    const projection = await this.getProjection(driveId);

    return projection.eligible_students == null;
  },

    async getEligibleStudentCount(
    driveId: string
  ): Promise<number> {
    const projection = await this.ensureProjection(driveId);

    if (projection.eligible_students !== null) {
      return projection.eligible_students;
    }

    /**
     * TODO:
     * Compute eligible students using the existing
     * Recruitment Eligibility Engine.
     *
     * This intentionally remains the single integration
     * point so that the eligibility engine is never
     * duplicated across the project.
     */
    throw new Error(
      "Eligibility projection has not been implemented yet."
    );
  },
  
  async isProjectionLocked(driveId: string) {
    const projection = await this.getProjection(driveId);

    return Boolean(projection.projection_locked);
  },

  async refreshApplicationMetrics(driveId: string) {
    const { data: opportunities, error: opportunityError } = await (supabase as any)
      .from("opportunity_master")
      .select("opportunity_id")
      .eq("drive_id", driveId);

    if (opportunityError) throw opportunityError;

    const opportunityIds = (opportunities ?? []).map((item: any) => item.opportunity_id);

    if (opportunityIds.length === 0) {
      return;
    }

    const { count, error: countError } = await (supabase as any)
      .from("student_opportunity_applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .in("opportunity_id", opportunityIds);

    if (countError) throw countError;

    await updateProjection(driveId, {
      registered_students: count ?? 0,
      total_applications: count ?? 0,
    });
  },

  /**
   * Application metrics are always synchronized from
   * canonical application tables.
   *
   * We intentionally do NOT expose a public
   * afterApplication() writer because application
   * counts should never be manually supplied by
   * calling services.
   */

  async afterWithdrawal(driveId: string, registeredStudents: number, totalApplications: number) {
    await updateProjection(driveId, {
      registered_students: registeredStudents,
      total_applications: totalApplications,
    });
  },

  async afterAttendance(driveId: string, presentStudents: number, absentStudents: number) {
    await updateProjection(driveId, {
      present_students: presentStudents,
      absent_students: absentStudents,
    });
  },

  async afterRoundSave(driveId: string, shortlistedStudents: number, interviewedStudents: number) {
    await updateProjection(driveId, {
      shortlisted_students: shortlistedStudents,
      interviewed_students: interviewedStudents,
    });
  },

  async afterFinalSelection(driveId: string, selectedStudents: number, rejectedStudents: number) {
    await updateProjection(driveId, {
      selected_students: selectedStudents,
      rejected_students: rejectedStudents,
    });
  },

  async afterFinalize(driveId: string) {
    const { error } = await (supabase as any)
      .from("recruitment_projection")
      .update({
        projection_locked: true,
      })
      .eq("drive_id", driveId);

    if (error) throw error;
  },
};
