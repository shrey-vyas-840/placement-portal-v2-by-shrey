import { supabase } from "@/lib/supabase";
import { adminDriveService } from "@/services/adminDriveService";
import { adminOpportunityService } from "@/services/adminOpportunityService";
import { adminQuestionService } from "@/services/adminQuestionService";
import { generateUuid } from "@/lib/generateUuid";
export interface PublishRecruitmentResult {
  driveId: string;
  companyId: string;
}

interface PublishRollbackContext {
  companyCreated: boolean;
  driveCreated: boolean;
  createdOpportunityIds: string[];
  createdDriveRoleIds: string[];
  createdDriveRoleDetailIds: string[];
  createdDriveRoleEligibilityIds: string[];
  createdDriveRoleDocumentIds: string[];
  createdDriveRoleTimelineIds: string[];
  createdDriveRoleQuestionIds: string[];
}

interface PublishValidationResult {
  valid: boolean;
  errors: string[];
}

async function rollbackPublish(
  context: PublishRollbackContext,
  companyId: string,
  driveId: string,
) {
  if (context.createdOpportunityIds.length > 0) {
    await (supabase as any)
      .from("opportunity_master")
      .delete()
      .in("opportunity_id", context.createdOpportunityIds);
  }

  if (context.createdDriveRoleQuestionIds.length > 0) {
    await (supabase as any)
      .from("drive_role_questions")
      .delete()
      .in("drive_role_id", context.createdDriveRoleQuestionIds);
  }

  if (context.createdDriveRoleTimelineIds.length > 0) {
    await (supabase as any)
      .from("drive_role_timeline")
      .delete()
      .in("drive_role_id", context.createdDriveRoleTimelineIds);
  }

  if (context.createdDriveRoleDocumentIds.length > 0) {
    await (supabase as any)
      .from("drive_role_documents")
      .delete()
      .in("drive_role_id", context.createdDriveRoleDocumentIds);
  }

  if (context.createdDriveRoleEligibilityIds.length > 0) {
    await (supabase as any)
      .from("drive_role_eligibility")
      .delete()
      .in("drive_role_id", context.createdDriveRoleEligibilityIds);
  }

  if (context.createdDriveRoleDetailIds.length > 0) {
    await (supabase as any)
      .from("drive_role_details")
      .delete()
      .in("drive_role_id", context.createdDriveRoleDetailIds);
  }

  if (context.createdDriveRoleIds.length > 0) {
    await (supabase as any)
      .from("drive_roles")
      .delete()
      .in("drive_role_id", context.createdDriveRoleIds);
  }

  if (context.driveCreated) {
    await (supabase as any).from("drive_eligibility").delete().eq("drive_id", driveId);

    await (supabase as any).from("drive_master").delete().eq("drive_id", driveId);
  }

  if (context.companyCreated) {
    await (supabase as any).from("company_contacts").delete().eq("company_id", companyId);

    await (supabase as any).from("company_master").delete().eq("company_id", companyId);
  }
}

function validateDraftForPublish(draft: any): PublishValidationResult {
  const errors: string[] = [];

  const company = draft.company_data ?? {};
  const recruiters = Array.isArray(draft.recruiters_data) ? draft.recruiters_data : [];
  const drive = draft.drive_data ?? {};
  const eligibility = draft.eligibility_data ?? {};
  const publish = draft.publish_data ?? {};
  const roles = Array.isArray(draft.roles_data) ? draft.roles_data : [];
  const defaultQuestions = Array.isArray(draft.default_questions_data)
    ? draft.default_questions_data
    : [];

  // Company

  if (!company.company_name?.trim()) {
    errors.push("Company name is required.");
  }

  if (!company.hiring_location?.trim()) {
    errors.push("Hiring location is required.");
  }

  // Recruiters

  if (recruiters.length === 0) {
    errors.push("At least one recruiter is required.");
  } else {
    const primaryRecruiters = recruiters.filter((r: any) => Boolean(r.primary_contact));

    if (primaryRecruiters.length !== 1) {
      errors.push("Exactly one primary recruiter is required.");
    }

    for (const recruiter of recruiters) {
      if (!String(recruiter.contact_name ?? "").trim()) {
        errors.push("Recruiter name is required.");
        break;
      }

      if (!String(recruiter.contact_email ?? "").trim()) {
        errors.push("Recruiter email is required.");
        break;
      }
    }
  }

  // Recruitment

  if (!drive.drive_type) {
    errors.push("Recruitment type is required.");
  }

  if (!drive.drive_mode) {
    errors.push("Recruitment mode is required.");
  }

  // Application window

  const applicationStart = publish.application_start_date ?? drive.application_open;

  const applicationEnd = publish.application_end_date ?? drive.application_close;

  if (applicationStart && applicationEnd) {
    const start = new Date(applicationStart);
    const end = new Date(applicationEnd);

    if (end <= start) {
      errors.push("Application closing date must be after opening date.");
    }
  }

  // Eligibility

  if (!draft.eligibility_data) {
    errors.push("Eligibility configuration is missing.");
  }

  // Roles

  if (roles.length === 0) {
    errors.push("At least one recruitment role is required.");
  } else {
    for (const role of roles) {
      const roleName = String(role.role_name ?? "").trim() || "Untitled Role";

      if (!role.role_name?.trim()) {
        errors.push("Every role must have a role name.");
        continue;
      }

      if (
        role.openings !== "" &&
        role.openings !== null &&
        role.openings !== undefined &&
        Number(role.openings) < 1
      ) {
        errors.push(`${roleName}: openings must be at least 1.`);
      }

      const compensation = role.compensation ?? {};

      const numericFields = [
        {
          label: "Fixed CTC",
          value: compensation.fixed_ctc,
        },
        {
          label: "Variable CTC",
          value: compensation.variable_ctc,
        },
        {
          label: "Joining Bonus",
          value: compensation.joining_bonus,
        },
        {
          label: "Retention Bonus",
          value: compensation.retention_bonus,
        },
        {
          label: "Internship Stipend",
          value: compensation.internship_stipend,
        },
        {
          label: "PPO Package",
          value: compensation.ppo_package,
        },
      ];

      for (const field of numericFields) {
        if (
          field.value !== "" &&
          field.value !== null &&
          field.value !== undefined &&
          Number(field.value) < 0
        ) {
          errors.push(`${roleName}: ${field.label} cannot be negative.`);
        }
      }
    }
  }

  // Role selection settings

  if (
    publish.minimum_role_selection !== undefined &&
    publish.maximum_role_selection !== undefined
  ) {
    const min = Number(publish.minimum_role_selection);
    const max = Number(publish.maximum_role_selection);

    if (min < 1) {
      errors.push("Minimum role selection must be at least 1.");
    }

    if (max < min) {
      errors.push("Maximum role selection cannot be less than minimum.");
    }

    if (max > roles.length) {
      errors.push("Maximum role selection exceeds available roles.");
    }
  }

  // Questions

  const hasRoleQuestions = roles.some(
    (role: any) => Array.isArray(role.questions) && role.questions.length > 0,
  );

  if (defaultQuestions.length === 0 && !hasRoleQuestions) {
    errors.push("No application questions were configured.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function publishRecruitmentDraft(draftId: string): Promise<PublishRecruitmentResult> {
  const { data: draft, error: draftError } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .eq("draft_id", draftId)
    .single();

  if (draftError) {
    throw draftError;
  }

  if (!draft) {
    throw new Error("Recruitment draft not found.");
  }
  const validation = validateDraftForPublish(draft);

  if (!validation.valid) {
    throw new Error(validation.errors.join("\n"));
  }

  const companyId = draft.created_company_id ?? generateUuid();

  const driveId = draft.created_drive_id ?? generateUuid();

  const wizardState = (draft.wizard_state ?? {}) as Record<string, unknown>;

  const companySelectionMode =
    typeof wizardState.companySelectionMode === "string" ? wizardState.companySelectionMode : "new";

  const selectedCompanyId =
    typeof wizardState.selectedCompanyId === "string" ? wizardState.selectedCompanyId : null;

  const isExistingCompany =
    companySelectionMode === "existing" &&
    selectedCompanyId !== null &&
    selectedCompanyId !== "DRAFT_COMPANY";

  const effectiveCompanyId = isExistingCompany ? selectedCompanyId : companyId;

  const generatedDriveName = `${String(draft.company_data.company_name).trim()} Recruitment`;

  const companyAlreadyPublished =
    typeof draft.created_company_id === "string" && draft.created_company_id.trim() !== "";

  const driveAlreadyPublished =
    typeof draft.created_drive_id === "string" && draft.created_drive_id.trim() !== "";

  const isRepublish = companyAlreadyPublished || driveAlreadyPublished;

  const rollbackContext: PublishRollbackContext = {
    companyCreated: false,
    driveCreated: false,
    createdOpportunityIds: [],
    createdDriveRoleIds: [],
    createdDriveRoleDetailIds: [],
    createdDriveRoleEligibilityIds: [],
    createdDriveRoleDocumentIds: [],
    createdDriveRoleTimelineIds: [],
    createdDriveRoleQuestionIds: [],
  };
  /**
   * During publishing we generate deterministic production IDs.
   *
   * We intentionally do NOT persist a direct FK between
   * drive_roles and opportunity_master.
   *
   * Instead this map represents the publish session.
   *
   * draft role
   *        ↓
   * production drive_role_id
   *        ↓
   * production opportunity_id
   */
  const publishRoleMap = new Map<
    string,
    {
      driveRoleId: string;
      opportunityId: string;
    }
  >();

  for (const role of draft.roles_data as any[]) {
    const publishedRole = {
      driveRoleId: generateUuid(),
      opportunityId: generateUuid(),
    };

    publishRoleMap.set(role.role_id, publishedRole);

    rollbackContext.createdDriveRoleIds.push(publishedRole.driveRoleId);
  }
  // Phase 1 publish pipeline will be implemented here
  // using the existing admin services only.
  if (isRepublish) {
    throw new Error("Republish pipeline is not implemented yet.");
  }

  try {
    if (!isExistingCompany) {
      await adminDriveService.createCompanyForPublish({
        company_id: companyId,

        company_name: draft.company_data.company_name,

        company_website: draft.company_data.company_website,

        hiring_location: draft.company_data.hiring_location,

        industry_type: draft.company_data.industry_type,

        company_description: draft.company_data.company_description,

        company_size: draft.company_data.company_size,
      });

      rollbackContext.companyCreated = true;
    }

    if (isExistingCompany) {
      const { error } = await (supabase as any).rpc("increment_company_past_drive_count", {
        p_company_id: effectiveCompanyId,
      });

      if (error) {
        throw error;
      }
    } else {
      const { error } = await (supabase as any)
        .from("company_master")
        .update({
          past_drive_count: 1,
        })
        .eq("company_id", effectiveCompanyId);

      if (error) {
        throw error;
      }
    }

    void adminOpportunityService;
    void adminQuestionService;

    await adminDriveService.createDriveForPublish({
      drive_id: driveId,

      company_id: effectiveCompanyId,

      drive_name: generatedDriveName,

      drive_type: draft.drive_data.drive_type,

      drive_mode: draft.drive_data.drive_mode,

      registration_deadline: draft.drive_data.registration_deadline ?? null,

      lowest_package_lpa: draft.drive_data.lowest_package_lpa,

      highest_package_lpa: draft.drive_data.highest_package_lpa,

      bond_years: draft.drive_data.bond_years,

      total_hiring_requirement: draft.drive_data.total_hiring_requirement,

      remarks: draft.drive_data.remarks,

      role_selection_enabled: draft.publish_data?.role_selection_enabled ?? true,

      minimum_role_selection: draft.publish_data?.minimum_role_selection ?? 1,

      maximum_role_selection: draft.publish_data?.maximum_role_selection ?? 1,

      drive_status: draft.drive_data.drive_status ?? "Created",
    });

    rollbackContext.driveCreated = true;

    await adminDriveService.publishRoles(
      driveId,
      (draft.roles_data as any[]).map((role) => {
        const publishedRole = publishRoleMap.get(role.role_id)!;

        return {
          drive_role_id: publishedRole.driveRoleId,
          drive_role_name: role.role_name,
          role_description: role.role_description,
          role_type: role.role_type,
          required_skills: Array.isArray(role.required_skills)
            ? role.required_skills.join(", ")
            : role.required_skills,
          inherit_default_questions: Boolean(role.inheritDefaultQuestions),
        };
      }),
    );

    const recruitmentOpportunityId = generateUuid();

    const publishedAt = new Date();

    const applicationStartDate =
      draft.drive_data?.application_open ??
      draft.publish_data?.application_start_date ??
      publishedAt.toISOString();

    const applicationEndDate =
      draft.drive_data?.application_close ??
      draft.publish_data?.application_end_date ??
      new Date(publishedAt.getTime() + 48 * 60 * 60 * 1000).toISOString();

    const applicationStartsAt = new Date(applicationStartDate);

    const shouldBeOpen = applicationStartsAt.getTime() <= publishedAt.getTime();

    const initialApplicationStatus = shouldBeOpen ? "Open" : "Upcoming";

    const visibleToStudents = true;

    await adminOpportunityService.createPublishedOpportunity({
      opportunity_id: recruitmentOpportunityId,
      drive_id: driveId,
      opportunity_title: generatedDriveName,
      opportunity_description: draft.drive_data.remarks ?? null,
      application_start_date: applicationStartDate,
      application_end_date: applicationEndDate,
      application_status: initialApplicationStatus,
      visible_to_students: visibleToStudents,
      created_by: draft.created_by ?? null,
    });

    rollbackContext.createdOpportunityIds.push(recruitmentOpportunityId);

    if (
      !isExistingCompany &&
      Array.isArray(draft.recruiters_data) &&
      draft.recruiters_data.length > 0
    ) {
      for (const recruiter of draft.recruiters_data) {
        const contactName = String(recruiter.contact_name ?? recruiter.name ?? "").trim();
        const contactEmail = String(recruiter.contact_email ?? recruiter.email ?? "").trim();
        const contactNumber = String(recruiter.contact_number ?? recruiter.phone ?? "").trim();
        const contactPosition = String(
          recruiter.contact_position ?? recruiter.designation ?? "",
        ).trim();

        if (!contactName) {
          throw new Error("Recruiter contact name is missing.");
        }

        if (!contactEmail) {
          throw new Error("Recruiter contact email is missing.");
        }

        await (supabase as any).from("company_contacts").insert({
          company_id: effectiveCompanyId,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_number: contactNumber || null,
          contact_position: contactPosition || null,
          primary_contact: Boolean(recruiter.primary_contact ?? recruiter.isPrimary),
        });
      }
    }

    await adminQuestionService.saveQuestions(
      recruitmentOpportunityId,
      (draft.default_questions_data ?? []).map((question: any) => ({
        ...question,
        question_id: undefined,
      })),
    );

    const publishedQuestionMap = new Map<string, string>();

    const { data: publishedQuestions, error: publishedQuestionsError } = await (supabase as any)
      .from("opportunity_questions")
      .select("*")
      .eq("opportunity_id", recruitmentOpportunityId)
      .order("position");

    if (publishedQuestionsError) {
      throw publishedQuestionsError;
    }

    let nextQuestionPosition = (publishedQuestions?.length ?? 0) + 1;

    for (const question of publishedQuestions ?? []) {
      publishedQuestionMap.set(question.question_title.trim().toLowerCase(), question.question_id);
    }

    for (const role of draft.roles_data ?? []) {
      for (const question of role.questions ?? []) {
        const key = String(question.question_title).trim().toLowerCase();

        if (publishedQuestionMap.has(key)) {
          continue;
        }

        const { data, error } = await (supabase as any)
          .from("opportunity_questions")
          .insert({
            opportunity_id: recruitmentOpportunityId,
            question_title: question.question_title,
            question_type: question.question_type,
            is_required: question.is_required,
            validation: question.validation || {},
            position: nextQuestionPosition++,
          })
          .select("question_id")
          .single();

        if (error) {
          throw error;
        }

        publishedQuestionMap.set(key, data.question_id);

        if (question.options?.length) {
          await (supabase as any).from("opportunity_question_options").insert(
            question.options.map((option: string, index: number) => ({
              question_id: data.question_id,
              option_text: option,
              position: index,
            })),
          );
        }
      }
    }

    for (const role of draft.roles_data ?? []) {
      const publishedRole = publishRoleMap.get(role.role_id);

      if (!publishedRole) {
        throw new Error(`Missing published role mapping for ${role.role_name}`);
      }

      const roleQuestionsToMap = role.inheritDefaultQuestions
        ? [...(draft.default_questions_data ?? []), ...(role.questions ?? [])]
        : (role.questions ?? []);

      for (const question of roleQuestionsToMap) {
        const questionId = publishedQuestionMap.get(
          String(question.question_title).trim().toLowerCase(),
        );

        if (!questionId) {
          throw new Error(`Published question not found: ${question.question_title}`);
        }

        await (supabase as any).from("drive_role_questions").insert({
          drive_role_id: publishedRole.driveRoleId,
          question_id: questionId,
        });

        rollbackContext.createdDriveRoleQuestionIds.push(publishedRole.driveRoleId);
      }

      await (supabase as any).from("drive_role_details").insert({
        drive_role_id: publishedRole.driveRoleId,

        employment_type: role.employment_type,

        work_mode: role.work_mode,

        openings: role.openings === "" ? null : Number(role.openings),

        fixed_ctc: role.compensation.fixed_ctc === "" ? null : Number(role.compensation.fixed_ctc),

        variable_ctc:
          role.compensation.variable_ctc === "" ? null : Number(role.compensation.variable_ctc),

        joining_bonus:
          role.compensation.joining_bonus === "" ? null : Number(role.compensation.joining_bonus),

        retention_bonus:
          role.compensation.retention_bonus === ""
            ? null
            : Number(role.compensation.retention_bonus),

        internship_stipend:
          role.compensation.internship_stipend === ""
            ? null
            : Number(role.compensation.internship_stipend),

        ppo_package:
          role.compensation.ppo_package === "" ? null : Number(role.compensation.ppo_package),

        department: role.hiring.department,

        expected_joining_date: role.hiring.expected_joining_date || null,

        hiring_locations: role.hiring.locations.join(","),

        travel_required: Boolean(role.hiring.travel_required),

        shift_details: role.hiring.shift_details || null,
      });

      rollbackContext.createdDriveRoleDetailIds.push(publishedRole.driveRoleId);

      if (!role.inheritDefaultEligibility) {
        await (supabase as any).from("drive_role_eligibility").insert({
          drive_role_id: publishedRole.driveRoleId,

          allowed_institutes: role.eligibility.allowed_institutes?.join(",") ?? "",

          allowed_branches: role.eligibility.allowed_branches?.join(",") ?? "",

          allowed_degrees: role.eligibility.allowed_degrees?.join(",") ?? "",

          passing_out_batches: role.eligibility.passing_out_batches?.join(",") ?? "",

          minimum_cgpa:
            role.eligibility.minimum_cgpa === "" ? null : Number(role.eligibility.minimum_cgpa),

          maximum_active_backlogs:
            role.eligibility.maximum_active_backlogs === ""
              ? null
              : Number(role.eligibility.maximum_active_backlogs),

          willing_to_relocate_required: Boolean(role.eligibility.willing_to_relocate_required),

          additional_requirements: role.eligibility.additional_requirements ?? null,
        });

        rollbackContext.createdDriveRoleEligibilityIds.push(publishedRole.driveRoleId);
      }

      for (const document of role.documents ?? []) {
        await (supabase as any).from("drive_role_documents").insert({
          drive_role_id: publishedRole.driveRoleId,

          document_name: document.document_name,

          description: document.description ?? null,

          required: Boolean(document.required),

          display_order: document.display_order ?? role.documents.indexOf(document) + 1,
        });

        rollbackContext.createdDriveRoleDocumentIds.push(publishedRole.driveRoleId);
      }

      for (const stage of role.timeline ?? []) {
        await (supabase as any).from("drive_role_timeline").insert({
          drive_role_id: publishedRole.driveRoleId,

          stage_name: stage.stage,

          stage_date: stage.date || null,

          description: stage.description ?? null,

          display_order: stage.display_order ?? role.timeline.indexOf(stage) + 1,
        });

        rollbackContext.createdDriveRoleTimelineIds.push(publishedRole.driveRoleId);
      }
    }

    await adminDriveService.saveEligibilityForPublish({
      drive_id: driveId,

      allowed_institutes: (draft.eligibility_data?.allowed_institutes ?? []).join(","),

      allowed_branches: (draft.eligibility_data?.allowed_branches ?? []).join(","),

      allowed_degrees: (draft.eligibility_data?.allowed_degrees ?? []).join(","),

      passing_out_batches: (draft.eligibility_data?.passing_out_batches ?? []).join(","),

      minimum_cgpa:
        draft.eligibility_data?.minimum_cgpa === ""
          ? 0
          : Number(draft.eligibility_data?.minimum_cgpa ?? 0),

      maximum_active_backlogs:
        draft.eligibility_data?.maximum_active_backlogs === ""
          ? 0
          : Number(draft.eligibility_data?.maximum_active_backlogs ?? 0),

      willing_to_relocate_required: Boolean(draft.eligibility_data?.willing_to_relocate_required),

      additional_requirements: draft.eligibility_data?.additional_requirements ?? "",
    });

    await (supabase as any)
      .from("recruitment_drafts")
      .update({
        status: "PUBLISHED",

        is_completed: true,

        published_at: publishedAt.toISOString(),

        published_drive_id: driveId,

        created_company_id: effectiveCompanyId,

        created_drive_id: driveId,

        current_step: 6,

        last_saved_at: publishedAt.toISOString(),

        updated_at: publishedAt.toISOString(),

        publish_data: {
          ...(draft.publish_data ?? {}),

          application_start_date: applicationStartDate,

          application_end_date: applicationEndDate,

          published_at: publishedAt.toISOString(),

          application_status: initialApplicationStatus,

          publish_immediately: true,

          role_selection_enabled: draft.publish_data?.role_selection_enabled ?? true,

          minimum_role_selection: draft.publish_data?.minimum_role_selection ?? 1,

          maximum_role_selection: draft.publish_data?.maximum_role_selection ?? 1,
        },

        wizard_state: {
          ...(draft.wizard_state ?? {}),

          publishCompleted: true,

          publishedOpportunityId: recruitmentOpportunityId,

          publishedDriveId: driveId,

          publishedCompanyId: companyId,
        },
      })
      .eq("draft_id", draftId);

    return {
      driveId,
      companyId,
    };
  } catch (error) {
    await rollbackPublish(rollbackContext, companyId, driveId);

    throw error;
  }
}
