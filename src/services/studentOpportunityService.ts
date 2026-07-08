import { supabase } from "@/lib/supabase";

type AnswerInput = {
  question_id: string;
  answer_value: any;
};

type StoredAnswerValue = string | number | boolean | null | Record<string, any> | Array<any>;

function splitCsvList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export const studentOpportunityService = {
  async getPublishedOpportunities(studentId: string) {
    const { data: academic } = await (supabase as any)
      .from("student_academic_details")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    const { data: student } = await (supabase as any)
      .from("student_master")
      .select(
        `
    placement_preference,
    placement_status
    `,
      )
      .eq("student_id", studentId)
      .maybeSingle();

    const { data: activeRestriction } = await (supabase as any)
      .from("student_restrictions")
      .select("*")
      .eq("student_id", studentId)
      .eq("is_active", true)
      .maybeSingle();

    if (!academic) {
      return [];
    }

    const { data: opportunities, error } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
    *,
    drive_master(
        drive_id,
        drive_name,
        drive_type,
        drive_mode,
        lowest_package_lpa,
        highest_package_lpa,
        bond_years,
        company_master(
            company_name
        )
    ),
    student_opportunity_applications(
        student_id,
        application_status
    )
`,
      )
      .eq("visible_to_students", true)
      .eq("application_status", "Open")
      .gt("application_end_date", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    const processedOpportunities: any[] = [];

    for (const opportunity of opportunities || []) {
      const alreadyApplied =
        opportunity.student_opportunity_applications?.some(
          (app: any) => app.student_id === studentId,
        ) || false;

      const { data: eligibility } = await (supabase as any)
        .from("drive_eligibility")
        .select("*")
        .eq("drive_id", opportunity.drive_id)
        .maybeSingle();

      const eligibleBranches =
        eligibility?.allowed_branches
          ?.split(",")
          .map((x: string) => x.trim())
          .filter(Boolean) ?? [];

      if (!eligibility) {
        processedOpportunities.push({
          ...opportunity,
          alreadyApplied,
          eligible_branches: eligibleBranches,
          eligibility_status: "Eligible",
          eligibility_reason: "",
          restriction_active: !!activeRestriction,
          restriction_type: activeRestriction?.restriction_type ?? null,
          restriction_reason: activeRestriction?.restriction_reason ?? null,
          placement_preference: student?.placement_preference ?? null,
          placement_status: student?.placement_status ?? null,
          participation_allowed: student?.placement_preference === "Interested",
          placement_allowed: student?.placement_status === "Unplaced",
        });
        continue;
      }

      const institutes = splitCsvList(eligibility.allowed_institutes);
      const degrees = splitCsvList(eligibility.allowed_degrees);
      const branches = splitCsvList(eligibility.allowed_branches);
      const batches = splitCsvList(eligibility.passing_out_batches);

      const instituteMatch =
        institutes.length === 0 || institutes.includes(academic.current_institute_name);

      const degreeMatch = degrees.length === 0 || degrees.includes(academic.current_degree_level);

      const branchMatch = branches.length === 0 || branches.includes(academic.current_branch_name);

      const cgpaMatch = Number(academic.current_cgpa) >= Number(eligibility.minimum_cgpa || 0);

      const backlogMatch =
        Number(academic.active_backlogs) <= Number(eligibility.maximum_active_backlogs || 0);

      const batchMatch = batches.length === 0 || batches.includes(String(academic.graduation_year));

      // Stage 1 visibility filter.
      // Only Branch + Passing Year decide whether this opportunity
      // should be shown to the student.

      if (!branchMatch || !batchMatch) {
        continue;
      }

      let reason = "";

      if (!instituteMatch) {
        reason = "Institute not eligible";
      } else if (!degreeMatch) {
        reason = "Degree not eligible";
      } else if (!cgpaMatch) {
        reason = "CGPA below requirement";
      } else if (!backlogMatch) {
        reason = "Backlog criteria not met";
      }
      processedOpportunities.push({
        ...opportunity,
        alreadyApplied,
        eligible_branches: eligibleBranches,
        eligibility_status:
          instituteMatch && degreeMatch && cgpaMatch && backlogMatch ? "Eligible" : "Not Eligible",
        eligibility_reason: reason,
        application_status: activeRestriction
          ? "RESTRICTED"
          : student?.placement_status !== "Unplaced"
            ? "PLACED"
            : student?.placement_preference !== "Interested"
              ? "NOT_PARTICIPATING"
              : instituteMatch && degreeMatch && cgpaMatch && backlogMatch
                ? "ELIGIBLE"
                : "INELIGIBLE",
        restriction_active: !!activeRestriction,
        restriction_type: activeRestriction?.restriction_type ?? null,
        restriction_reason: activeRestriction?.restriction_reason ?? null,
      });
    }

    return processedOpportunities;
  },

  async getApplicationQuestions(
  opportunityId: string,
  selectedRoleIds: string[],
  driveId: string,
) {
const { data: defaultQuestions, error: defaultQuestionsError } =
  await (supabase as any)
    .from("opportunity_questions")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("position", { ascending: true });

if (defaultQuestionsError) {
  throw defaultQuestionsError;
}

const { data: selectedRoles, error: selectedRolesError } =
  await (supabase as any)
    .from("drive_roles")
    .select("drive_role_id, inherit_default_questions")
    .eq("drive_id", driveId)
    .in("drive_role_id", selectedRoleIds);

if (selectedRolesError) {
  throw selectedRolesError;
}

const includeDefaultQuestions = (selectedRoles ?? []).some(
  (role: any) => role.inherit_default_questions,
);

const questionMap = new Map<string, any>();

if (includeDefaultQuestions) {
  for (const question of defaultQuestions ?? []) {
    questionMap.set(question.question_id, question);
  }
}

const { data: roleQuestionMappings, error: roleQuestionMappingsError } =
  await (supabase as any)
    .from("drive_role_questions")
    .select(
      `
      question_id,
      drive_role_id,
      opportunity_questions(*)
      `,
    )
    .in("drive_role_id", selectedRoleIds);

if (roleQuestionMappingsError) {
  throw roleQuestionMappingsError;
}

for (const mapping of roleQuestionMappings ?? []) {
  if (mapping.opportunity_questions) {
    questionMap.set(
      mapping.opportunity_questions.question_id,
      mapping.opportunity_questions,
    );
  }
}

return Array.from(questionMap.values()).sort(
  (a: any, b: any) => (a.position ?? 999999) - (b.position ?? 999999),
);

},

  async apply(
  opportunityId: string,
  studentId: string,
  selectedRoleIds: string[] = [],
  answers: AnswerInput[] = [],
) {
    const { data: opportunity, error: opportunityError } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
        application_status,
        application_end_date,
        visible_to_students
      `,
      )
      .eq("opportunity_id", opportunityId)
      .single();

    if (opportunityError) throw opportunityError;

    const deadlinePassed =
      opportunity.application_end_date && new Date(opportunity.application_end_date) < new Date();

    if (
      opportunity.application_status !== "Open" ||
      opportunity.visible_to_students !== true ||
      deadlinePassed
    ) {
      throw new Error("Application closed");
    }

    const { data: existingApplication } = await (supabase as any)
      .from("student_opportunity_applications")
      .select("application_id")
      .eq("opportunity_id", opportunityId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (existingApplication) {
      throw new Error("Already applied");
    }
    const { data: activeRestriction } = await (supabase as any)
      .from("student_restrictions")
      .select("*")
      .eq("student_id", studentId)
      .eq("is_active", true)
      .maybeSingle();

    if (activeRestriction) {
      throw new Error(
        activeRestriction.restriction_reason ||
          "Your placement activities are currently restricted.",
      );
    }

    const { data: student } = await (supabase as any)
      .from("student_master")
      .select(
        `
placement_preference,
placement_status
`,
      )
      .eq("student_id", studentId)
      .maybeSingle();

    if (!student) {
      throw new Error("Student profile not found.");
    }

    if (student.placement_preference !== "Interested") {
      throw new Error(
        `Your current placement preference is "${student.placement_preference}". You are not eligible to apply.`,
      );
    }

    if (student.placement_status !== "Unplaced") {
      throw new Error("You have already been placed. Further applications are disabled.");
    }

    const { data: academic } = await (supabase as any)
      .from("student_academic_details")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (!academic) {
      throw new Error("Academic details not found.");
    }

    const { data: opportunityRecord } = await (supabase as any)
      .from("opportunity_master")
      .select("drive_id")
      .eq("opportunity_id", opportunityId)
      .maybeSingle();

    if (!opportunityRecord) {
      throw new Error("Opportunity not found.");
    }

    const { data: drive } = await (supabase as any)
  .from("drive_master")
  .select(
    `
    role_selection_enabled,
    minimum_role_selection,
    maximum_role_selection
    `,
  )
  .eq("drive_id", opportunityRecord.drive_id)
  .maybeSingle();

if (!drive) {
  throw new Error("Drive not found.");
}

if (drive.role_selection_enabled) {
  if (selectedRoleIds.length < Number(drive.minimum_role_selection || 0)) {
    throw new Error(
      `Please select at least ${drive.minimum_role_selection} role(s).`,
    );
  }

  if (
    selectedRoleIds.length >
    Number(drive.maximum_role_selection || Number.MAX_SAFE_INTEGER)
  ) {
    throw new Error(
      `You can select a maximum of ${drive.maximum_role_selection} role(s).`,
    );
  }
}

    const { data: eligibility } = await (supabase as any)
      .from("drive_eligibility")
      .select("*")
      .eq("drive_id", opportunityRecord.drive_id)
      .maybeSingle();

    if (eligibility) {
      const institutes = splitCsvList(eligibility.allowed_institutes);
      const degrees = splitCsvList(eligibility.allowed_degrees);

      const instituteMatch =
        institutes.length === 0 || institutes.includes(academic.current_institute_name);

      const degreeMatch = degrees.length === 0 || degrees.includes(academic.current_degree_level);

      const cgpaMatch = Number(academic.current_cgpa) >= Number(eligibility.minimum_cgpa || 0);

      const backlogMatch =
        Number(academic.active_backlogs) <= Number(eligibility.maximum_active_backlogs || 0);

      if (!instituteMatch) {
        throw new Error("Institute not eligible.");
      }

      if (!degreeMatch) {
        throw new Error("Degree not eligible.");
      }

      if (!cgpaMatch) {
        throw new Error("CGPA below required eligibility.");
      }

      if (!backlogMatch) {
        throw new Error("Backlog criteria not met.");
      }
    }

    const { data: application, error } = await (supabase as any)
      .from("student_opportunity_applications")
      .insert({
        opportunity_id: opportunityId,
        student_id: studentId,
      })
      .select("application_id")
      .single();

if (error) throw error;

if (selectedRoleIds.length > 0) {
  const { error: selectedRolesError } = await (supabase as any)
    .from("student_application_selected_roles")
    .insert(
      selectedRoleIds.map((driveRoleId) => ({
        application_id: application.application_id,
        drive_role_id: driveRoleId,
      })),
    );

  if (selectedRolesError) {
    await (supabase as any)
      .from("student_opportunity_applications")
      .delete()
      .eq("application_id", application.application_id);

    throw selectedRolesError;
  }
}

const normalizedAnswers = Array.isArray(answers)
      ? answers.filter((answer) => answer && answer.question_id)
      : [];

    if (normalizedAnswers.length > 0) {
      const uploadedFilePaths: string[] = [];

      try {
        const answerRows: Array<{
          application_id: string;
          question_id: string;
          answer: {
            value: StoredAnswerValue;
          };
        }> = [];

        for (const answer of normalizedAnswers) {
          let answerValue: StoredAnswerValue = answer.answer_value;

          if (answer.answer_value instanceof File) {
            const file: File = answer.answer_value;

            const safeFileName = sanitizeFileName(file.name);
            const filePath = `${studentId}/${opportunityId}/${answer.question_id}/${Date.now()}_${safeFileName}`;

            const { error: uploadError } = await supabase.storage
              .from("student-question-files")
              .upload(filePath, file, {
                upsert: false,
                cacheControl: "3600",
              });

            if (uploadError) {
              throw uploadError;
            }

            uploadedFilePaths.push(filePath);

            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from("student-question-files")
              .createSignedUrl(filePath, 60 * 60 * 24 * 365);

            if (signedUrlError) {
              throw signedUrlError;
            }

            answerValue = {
              fileName: file.name,
              fileUrl: signedUrlData?.signedUrl || "",
              mimeType: file.type || null,
              size: file.size,
            };
          }

          answerRows.push({
            application_id: application.application_id,
            question_id: answer.question_id,
            answer: {
              value: answerValue,
            },
          });
        }

        const { error: answerError } = await (supabase as any)
          .from("opportunity_question_answers")
          .insert(answerRows);

        if (answerError) {
          throw answerError;
        }
      } catch (submissionError) {
        if (uploadedFilePaths.length > 0) {
          await supabase.storage.from("student-question-files").remove(uploadedFilePaths);
        }

        await (supabase as any)
          .from("student_opportunity_applications")
          .delete()
          .eq("application_id", application.application_id);

        throw submissionError;
      }
    }

    return application;
  },
};
