import { studentService } from "./studentService";

export const profileStatusService = {
  async hasProfile(authUserId: string): Promise<boolean> {
    const profile = await studentService.getProfileByUserId(authUserId);
    return !!profile;
  },
};