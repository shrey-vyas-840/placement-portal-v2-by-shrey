export interface StudentMaster {
  student_id: string;

  user_id: string;

  enrollment_no: string;

  first_name: string;

  middle_name?: string | null;

  last_name: string;

  institute_email: string;

  personal_email?: string | null;

  contact_number: string;

  alternate_contact_number?: string | null;

  gender?: string | null;

  date_of_birth?: string | null;

  profile_photo_document_id?: string | null;

  placement_preference: string;

  placement_status?: string | null;

  created_at?: string;

  updated_at?: string;

  is_active?: boolean;
}

export type StudentMasterUpdate = Partial<
  Omit<
    StudentMaster,
    "student_id" |
    "user_id" |
    "created_at" |
    "updated_at"
  >
>;

export interface StudentSkillProfile {
  skill_profile_id?: string;

  technical_skills: string;
  programming_languages: string;
  tools_and_technologies: string;

  github_url: string;
  linkedin_url: string;
  portfolio_url: string;

  strengths: string;

  certification_count?: number;
  hackathon_count?: number;
  project_count?: number;
  profile_score?: number;
}

