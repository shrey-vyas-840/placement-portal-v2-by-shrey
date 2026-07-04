import type { RecruitmentRoleEligibility } from "./RecruitmentEligibilityBuilder";

export function createEmptyRecruitmentRoleEligibility(): RecruitmentRoleEligibility {
  return {
    useRecruitmentDefaults: true,
    allowed_institutes: [],
    allowed_degrees: [],
    allowed_branches: [],
    passing_out_batches: [],
    minimum_cgpa: "",
    maximum_active_backlogs: "",
    willing_to_relocate_required: false,
    additional_requirements: "",
  };
}