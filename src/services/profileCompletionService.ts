import { documentService } from "./documentService";
import { studentService } from "./studentService";

export const profileCompletionService = {
  async getCompletion(authUserId: string) {
    const profile =
      await studentService.getProfileByUserId(
        authUserId,
      );

    const result = {
      profile: false,
      resume: false,
      academics: false,
      skills: false,
      certifications: false,
      percentage: 0,
    };

    if (!profile) {
      return result;
    }

    result.profile = true;

    const resume =
      await documentService.getResume(
        profile.student_id,
      );

    if (resume) {
      result.resume = true;
    }

    const completed =
      [
        result.profile,
        result.resume,
        result.academics,
        result.skills,
        result.certifications,
      ].filter(Boolean).length;

    result.percentage =
      Math.round(
        (completed / 5) * 100,
      );

    return result;
  },
};