import type { RecruitmentRole } from "./RecruitmentRoleBuilder";

export type RecruitmentRoleValidationSection =
  "basic" | "compensation" | "hiring" | "eligibility" | "questions" | "documents" | "timeline";

export interface RecruitmentRoleValidationIssue {
  section: RecruitmentRoleValidationSection;
  message: string;
}

export interface RecruitmentRoleValidationResult {
  valid: boolean;
  issues: RecruitmentRoleValidationIssue[];
}

function addIssue(
  issues: RecruitmentRoleValidationIssue[],
  section: RecruitmentRoleValidationSection,
  message: string,
) {
  issues.push({
    section,
    message,
  });
}

export function validateRecruitmentRole(role: RecruitmentRole): RecruitmentRoleValidationResult {
  const issues: RecruitmentRoleValidationIssue[] = [];

  if (!role.role_name.trim()) {
    addIssue(issues, "basic", "Role name is required.");
  }

  if (role.openings === "" || Number(role.openings) <= 0) {
    addIssue(issues, "basic", "Expected openings must be greater than zero.");
  }

  if (!role.role_description.trim()) {
    addIssue(issues, "basic", "Role description is required.");
  }
  if (role.compensation.fixed_ctc === "") {
    addIssue(issues, "compensation", "Fixed CTC must be configured.");
  }

  if (!role.hiring.department.trim()) {
    addIssue(issues, "hiring", "Hiring department is required.");
  }

  if (!role.hiring.expected_joining_date) {
    addIssue(issues, "hiring", "Expected joining date is required.");
  }

  if (role.hiring.locations.length === 0) {
    addIssue(issues, "hiring", "At least one hiring location is required.");
  }

  if (role.eligibility.minimum_cgpa !== "" && Number(role.eligibility.minimum_cgpa) < 0) {
    addIssue(issues, "eligibility", "Minimum CGPA cannot be negative.");
  }

  if (
    role.eligibility.maximum_active_backlogs !== "" &&
    Number(role.eligibility.maximum_active_backlogs) < 0
  ) {
    addIssue(issues, "eligibility", "Maximum active backlogs cannot be negative.");
  }

  if (role.questions.length === 0) {
    addIssue(issues, "questions", "Add at least one application question.");
  } else {
    role.questions.forEach((question, index) => {
      if (!question.question_title.trim()) {
        addIssue(issues, "questions", `Question ${index + 1} requires a title.`);
      }

      if (!question.question_type) {
        addIssue(issues, "questions", `Question ${index + 1} requires a question type.`);
      }

      if (
        (question.question_type === "dropdown" ||
          question.question_type === "mcq" ||
          question.question_type === "checkbox") &&
        question.options.length === 0
      ) {
        addIssue(issues, "questions", `Question ${index + 1} requires at least one option.`);
      }
    });
  }

  if (role.documents.length === 0) {
    addIssue(issues, "documents", "Add at least one required document.");
  } else {
    role.documents.forEach((document, index) => {
      if (!document.document_name.trim()) {
        addIssue(issues, "documents", `Document ${index + 1} requires a document name.`);
      }

      const duplicateCount = role.documents.filter(
        (d) =>
          d.document_name.trim().toLowerCase() === document.document_name.trim().toLowerCase() &&
          document.document_name.trim() !== "",
      ).length;

      if (duplicateCount > 1) {
        addIssue(issues, "documents", `Duplicate document "${document.document_name}" detected.`);
      }
    });
  }
  if (role.timeline.length === 0) {
    addIssue(issues, "timeline", "Add at least one recruitment stage.");
  } else {
    role.timeline.forEach((stage, index) => {
      if (!stage.stage.trim()) {
        addIssue(issues, "timeline", `Timeline stage ${index + 1} requires a stage name.`);
      }

      if (!stage.date) {
        addIssue(issues, "timeline", `Timeline stage ${index + 1} requires a date.`);
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
