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
  const { error } = await (supabase as any).from("recruitment_projection").upsert(
    {
      drive_id: driveId,
    },
    {
      onConflict: "drive_id",
    },
  );

  if (error) throw error;
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
  async afterPublish(driveId: string, eligibleStudents: number) {
    await updateProjection(driveId, {
      eligible_students: eligibleStudents,
    });
  },

  async afterApplication(driveId: string, registeredStudents: number, totalApplications: number) {
    await updateProjection(driveId, {
      registered_students: registeredStudents,
      total_applications: totalApplications,
    });
  },

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
