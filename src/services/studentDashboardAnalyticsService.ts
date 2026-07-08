import { adminDashboardAnalyticsService } from "@/services/adminDashboardAnalyticsService";
import { studentService } from "@/services/studentService";

export async function getMyStudentDrilldown(userId: string) {
  const profile = await studentService.getProfileByUserId(userId);

  if (!profile?.enrollment_no) {
    return null;
  }

  return adminDashboardAnalyticsService.getStudentDrilldown(profile.enrollment_no);
}
