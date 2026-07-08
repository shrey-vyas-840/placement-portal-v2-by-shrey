import { supabase } from "@/lib/supabase";
import { ELIGIBILITY_MAPPING } from "@/constants/eligibilityMapping";
import { getHodEmail } from "@/config/hodMapping";

type AnyRecord = Record<string, any>;

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function splitCsvList(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function fullName(student: AnyRecord) {
  return [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAllowed(candidate: string | null | undefined, allowed: string[]) {
  if (!allowed.length) return true;
  return allowed.some((item) => normalize(item) === normalize(candidate));
}

function buildEligibilityCatalog() {
  return Object.entries(ELIGIBILITY_MAPPING).map(([institute, degrees]) => ({
    institute,
    degrees: Object.entries(degrees).map(([degree, branches]) => ({
      degree,
      branches: [...branches],
    })),
  }));
}

const COMPANY_LOGO_BUCKET = "company-logos"; // change only if your bucket name differs

function resolveCompanyLogoUrl(path?: string | null) {
  if (!path) return null;

  const { data } = supabase.storage.from(COMPANY_LOGO_BUCKET).getPublicUrl(path);

  return data?.publicUrl || null;
}

export const adminOpportunityService = {
  async createOpportunityForPublish(payload: {
    opportunity_id: string;
    drive_id: string;
    opportunity_title: string;
    opportunity_description?: string;
    application_start_date?: string | null;
    application_end_date?: string | null;
    application_status: string;
    visible_to_students: boolean;
    created_by?: string | null;
  }) {
    const { data, error } = await (supabase as any)
      .from("opportunity_master")
      .insert({
        opportunity_id: payload.opportunity_id,
        drive_id: payload.drive_id,
        opportunity_title: payload.opportunity_title,
        opportunity_description: payload.opportunity_description ?? null,
        application_start_date: payload.application_start_date ?? null,
        application_end_date: payload.application_end_date ?? null,
        application_status: payload.application_status,
        visible_to_students: payload.visible_to_students,
        created_by: payload.created_by ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async getDrives() {
    const { data, error } = await (supabase as any)
      .from("drive_master")
      .select(
        `
                    *,
                    company_master(
                        company_name
                    )
                `,
      )
      .eq("is_active", true)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  async getOpportunities() {
    const { data, error } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
                    *,
                    drive_master(
                        drive_name
                    )
                `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  async createOpportunity(payload: {
    drive_id: string;
    opportunity_title: string;
    opportunity_description?: string;
    application_end_date: string;
    publish: boolean;
  }) {
    const { data, error } = await (supabase as any)
      .from("opportunity_master")
      .insert({
        drive_id: payload.drive_id,

        opportunity_title: payload.opportunity_title,

        opportunity_description: payload.opportunity_description || null,

        application_start_date: new Date().toISOString(),

        application_end_date: payload.application_end_date,

        application_status: payload.publish ? "Open" : "Draft",

        visible_to_students: payload.publish,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async publishOpportunity(opportunityId: string) {
    const { error } = await (supabase as any)
      .from("opportunity_master")
      .update({
        visible_to_students: true,

        application_status: "Open",

        application_start_date: new Date().toISOString(),
      })
      .eq("opportunity_id", opportunityId);

    if (error) {
      throw error;
    }
  },

  async extendDeadline(opportunityId: string, newDeadline: string) {
    const { error } = await (supabase as any)

      .from("opportunity_master")

      .update({
        application_end_date: newDeadline,

        application_status: "Open",

        visible_to_students: true,
      })

      .eq("opportunity_id", opportunityId);

    if (error) throw error;
  },
  async updateOpportunityStatus(opportunityId: string, status: string) {
    const { error } = await (supabase as any)
      .from("opportunity_master")
      .update({
        application_status: status,
      })
      .eq("opportunity_id", opportunityId);

    if (error) throw error;
  },

  async toggleVisibility(opportunityId: string, visible: boolean) {
    const { error } = await (supabase as any)
      .from("opportunity_master")
      .update({
        visible_to_students: visible,
      })
      .eq("opportunity_id", opportunityId);

    if (error) throw error;
  },

  async getApplications() {
    const { data, error } = await (supabase as any)
      .from("student_opportunity_applications")
      .select(
        `
                *,
                student_master(
                    student_id,
                    first_name,
                    last_name,
                    enrollment_no
                ),
                opportunity_master(
                    opportunity_id,
                    opportunity_title
                )
            `,
      )
      .order("applied_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  async updateApplicationStatus(applicationId: string, status: string) {
    const { error } = await (supabase as any)
      .from("student_opportunity_applications")
      .update({
        application_status: status,
      })
      .eq("application_id", applicationId);

    if (error) throw error;
  },

  async getApplicantDetails() {
    const { data, error } = await (supabase as any)
      .from("student_opportunity_applications")
      .select(
        `
                *,
                student_master(
                    student_id,
                    first_name,
                    last_name,
                    enrollment_no
                ),
                opportunity_master(
                    opportunity_id,
                    opportunity_title
                )
            `,
      )
      .order("applied_at", {
        ascending: false,
      });

    if (error) throw error;

    const applications = data || [];

    const studentIds = applications.map((x: any) => x.student_id);

    const { data: academics } = await (supabase as any)
      .from("student_academic_details")
      .select(
        `
                student_id,
                current_branch_name,
                current_cgpa,
                graduation_year
            `,
      )
      .in("student_id", studentIds);

    const { data: resumes } = await (supabase as any)
      .from("student_documents")
      .select(
        `
                student_id,
                document_metadata(
                    storage_url,
                    document_type
                )
            `,
      )
      .eq("is_active", true);

    return applications.map((application: any) => {
      const academic = academics?.find((a: any) => a.student_id === application.student_id);

      const resume = resumes?.find(
        (r: any) =>
          r.student_id === application.student_id &&
          r.document_metadata?.document_type === "Resume",
      );

      return {
        ...application,
        academic,
        resumeUrl: resume?.document_metadata?.storage_url || "",
      };
    });
  },

  async getOpportunityCards() {
    const { data: opportunities, error } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
                *,
                drive_master(
    drive_id,
    drive_name,
    company_id
)
            `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    const companyIds =
      opportunities?.map((x: any) => x.drive_master?.company_id).filter(Boolean) ?? [];

    const { data: companies } = await (supabase as any)
      .from("company_master")
      .select("company_id, company_name")
      .in("company_id", companyIds);

    const { data: students } = await (supabase as any).from("student_academic_details").select(`
            student_id,
            current_institute_name,
            current_branch_name,
            current_degree_level,
            current_cgpa,
            active_backlogs,
            graduation_year
        `);

    const { data: applications } = await (supabase as any)
      .from("student_opportunity_applications")
      .select(
        `
    opportunity_id,
    student_id
    `,
      );

    const { data: eligibilityRules } = await (supabase as any)
      .from("drive_eligibility")
      .select("*");

    return (opportunities ?? []).map((opp: any) => {
      const company = companies?.find((c: any) => c.company_id === opp.drive_master?.company_id);

      const applied = [
        ...new Set(
          applications
            ?.filter((a: any) => a.opportunity_id === opp.opportunity_id)
            .map((a: any) => a.student_id) ?? [],
        ),
      ].length;

      const rule = eligibilityRules?.find((r: any) => r.drive_id === opp.drive_id);

      const eligible = (students ?? []).filter((student: any) => {
        if (!rule) {
          return true;
        }

        const institutes = rule.allowed_institutes?.split(",").map((x: string) => x.trim()) ?? [];

        const branches = rule.allowed_branches?.split(",").map((x: string) => x.trim()) ?? [];

        const degrees = rule.allowed_degrees?.split(",").map((x: string) => x.trim()) ?? [];

        const batches = rule.passing_out_batches?.split(",").map((x: string) => x.trim()) ?? [];

        return (
          (institutes.length === 0 || institutes.includes(student.current_institute_name)) &&
          (branches.length === 0 || branches.includes(student.current_branch_name)) &&
          (degrees.length === 0 || degrees.includes(student.current_degree_level)) &&
          (batches.length === 0 || batches.includes(String(student.graduation_year))) &&
          Number(student.current_cgpa) >= Number(rule.minimum_cgpa || 0) &&
          Number(student.active_backlogs) <= Number(rule.maximum_active_backlogs || 0)
        );
      }).length;

      return {
        ...opp,

        company: company?.company_name,

        deadline: opp.application_end_date,

        eligibleCount: eligible,

        appliedCount: applied,

        unappliedCount: eligible - applied,
      };
    });
  },

  async getOpportunityApplicants(opportunityId: string) {
    const { data: applications, error } = await (supabase as any)
      .from("student_opportunity_applications")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("applied_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    const studentIds = applications?.map((x: any) => x.student_id) ?? [];

    const { data: students } = await (supabase as any)
      .from("student_master")
      .select(
        `
            student_id,
            enrollment_no,
            first_name,
            last_name
        `,
      )
      .in("student_id", studentIds);

    const { data: academics } = await (supabase as any)
      .from("student_academic_details")
      .select(
        `
            student_id,
            current_institute_name,
            current_branch_name,
            current_cgpa,
            graduation_year
        `,
      )
      .in("student_id", studentIds);

    return (applications ?? []).map((app: any) => ({
      ...app,

      student_master: students?.find((s: any) => s.student_id === app.student_id),

      academic: academics?.find((a: any) => a.student_id === app.student_id),
    }));
  },

  async getOpportunityById(opportunityId: string) {
    const { data, error } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
                *,
                drive_master(
                    drive_id,
                    drive_name,
                    company_id
                )
            `,
      )
      .eq("opportunity_id", opportunityId)
      .single();

    if (error) {
      throw error;
    }

    const { data: company } = await (supabase as any)
      .from("company_master")
      .select("company_name")
      .eq("company_id", data.drive_master.company_id)
      .single();

    return {
      ...data,

      company_name: company?.company_name,
    };
  },

  async updateOpportunity(
    opportunityId: string,
    payload: {
      opportunity_title: string;
      opportunity_description?: string;
      application_end_date: string;
    },
  ) {
    const { error } = await (supabase as any)
      .from("opportunity_master")
      .update({
        opportunity_title: payload.opportunity_title,

        opportunity_description: payload.opportunity_description,

        application_end_date: payload.application_end_date,
      })
      .eq("opportunity_id", opportunityId);

    if (error) {
      throw error;
    }
  },

  async getOpportunityMailWorkspace(opportunityId: string) {
    const { data: opportunity, error: opportunityError } = await (supabase as any)
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
                    remarks,
                    company_master(
    company_name,
    hiring_location,
    company_website,
    industry_type,
    company_description,
    company_size,
    company_logo
)
                )
            `,
      )
      .eq("opportunity_id", opportunityId)
      .single();

    if (opportunityError) throw opportunityError;

    const { data: eligibility, error: eligibilityError } = await (supabase as any)
      .from("drive_eligibility")
      .select("*")
      .eq("drive_id", opportunity.drive_id)
      .maybeSingle();

    if (eligibilityError) throw eligibilityError;

    const allowedInstitutes = splitCsvList(eligibility?.allowed_institutes);

    const allowedDegrees = splitCsvList(eligibility?.allowed_degrees);

    const allowedBranches = splitCsvList(eligibility?.allowed_branches);

    const allowedBatches = splitCsvList(eligibility?.passing_out_batches);

    const minCgpa = Number(eligibility?.minimum_cgpa ?? 0) || 0;

    const maxBacklogs = Number(eligibility?.maximum_active_backlogs ?? 0) || 0;

    const [studentsResult, academicsResult, hodMappingsResult] = await Promise.all([
      (supabase as any)
        .from("student_master")
        .select(
          `
                    student_id,
                    user_id,
                    enrollment_no,
                    first_name,
                    middle_name,
                    last_name,
                    institute_email,
                    personal_email,
                    is_active
                `,
        )
        .eq("is_active", true),

      (supabase as any).from("student_academic_details").select(`
                    student_id,
                    current_institute_name,
                    current_degree_level,
                    current_branch_name,
                    current_cgpa,
                    active_backlogs,
                    graduation_year
                `),

      (supabase as any)
        .from("branch_hod_mapping")
        .select(
          `
                    institute_name,
                    degree_name,
                    branch_name,
                    hod_email,
                    is_active
                `,
        )
        .eq("is_active", true),
    ]);

    if (studentsResult.error) throw studentsResult.error;
    if (academicsResult.error) throw academicsResult.error;
    if (hodMappingsResult.error) throw hodMappingsResult.error;

    const students = (studentsResult.data ?? []) as AnyRecord[];
    const academics = (academicsResult.data ?? []) as AnyRecord[];
    const hodMappings = (hodMappingsResult.data ?? []) as AnyRecord[];

    const academicMap = new Map<string, AnyRecord>(
      academics.map((row) => [String(row.student_id), row]),
    );

    const eligibleStudents = students
      .map((student: AnyRecord) => {
        const academic = academicMap.get(String(student.student_id)) as AnyRecord | undefined;

        if (!academic) return null;

        const instituteMatch = matchesAllowed(academic.current_institute_name, allowedInstitutes);

        const degreeMatch = matchesAllowed(academic.current_degree_level, allowedDegrees);

        const branchMatch = matchesAllowed(academic.current_branch_name, allowedBranches);

        const cgpaMatch = minCgpa <= 0 ? true : Number(academic.current_cgpa ?? 0) >= minCgpa;

        const backlogMatch =
          maxBacklogs < 0 ? true : Number(academic.active_backlogs ?? 0) <= maxBacklogs;

        const batchMatch = allowedBatches.length
          ? allowedBatches.includes(String(academic.graduation_year ?? ""))
          : true;

        if (
          !instituteMatch ||
          !degreeMatch ||
          !branchMatch ||
          !cgpaMatch ||
          !backlogMatch ||
          !batchMatch
        ) {
          return null;
        }

        const email = student.institute_email || student.personal_email || "";

        if (!email) return null;

        return {
          student_id: student.student_id,
          enrollment_no: student.enrollment_no,
          student_name: fullName(student),
          institute_email: student.institute_email || null,
          personal_email: student.personal_email || null,
          current_institute_name: academic.current_institute_name || null,
          current_degree_level: academic.current_degree_level || null,
          current_branch_name: academic.current_branch_name || null,
          current_cgpa: academic.current_cgpa || null,
          active_backlogs: academic.active_backlogs ?? 0,
          graduation_year: academic.graduation_year || null,
          email,
        };
      })
      .filter(Boolean);

    const studentEmails = uniqueStrings(eligibleStudents.map((item: any) => item.email));

    let hodEmails = uniqueStrings(
      hodMappings
        .filter((row: AnyRecord) => {
          const instituteMatch = matchesAllowed(row.institute_name, allowedInstitutes);

          const degreeMatch = matchesAllowed(row.degree_name, allowedDegrees);

          const branchMatch = matchesAllowed(row.branch_name, allowedBranches);

          return instituteMatch && degreeMatch && branchMatch;
        })
        .map((row: AnyRecord) => row.hod_email),
    );

    if (!hodEmails.length) {
      hodEmails = uniqueStrings(
        eligibleStudents.map((student: any) =>
          getHodEmail(
            student.current_institute_name,
            student.current_degree_level,
            student.current_branch_name,
          ),
        ),
      );
    }

    const companyName =
      opportunity?.drive_master?.company_master?.company_name ||
      opportunity?.drive_master?.company_name ||
      "";

    const driveName = opportunity?.drive_master?.drive_name || "";

    const packageRange =
      opportunity?.drive_master?.lowest_package_lpa != null ||
      opportunity?.drive_master?.highest_package_lpa != null
        ? `${opportunity?.drive_master?.lowest_package_lpa ?? "-"} LPA - ${opportunity?.drive_master?.highest_package_lpa ?? "-"} LPA`
        : "Package not specified";

    const deadlineText = opportunity.application_end_date
      ? new Date(opportunity.application_end_date).toLocaleString()
      : "-";

    return {
      companyLogoUrl: resolveCompanyLogoUrl(
        opportunity?.drive_master?.company_master?.company_logo,
      ),

      companyDescription: opportunity?.drive_master?.company_master?.company_description || "",

      companyWebsite: opportunity?.drive_master?.company_master?.company_website || "",

      companyLocation: opportunity?.drive_master?.company_master?.hiring_location || "",

      lowestPackage: opportunity?.drive_master?.lowest_package_lpa ?? null,

      highestPackage: opportunity?.drive_master?.highest_package_lpa ?? null,

      bondYears: opportunity?.drive_master?.bond_years ?? null,

      driveType: opportunity?.drive_master?.drive_type ?? "",

      driveMode: opportunity?.drive_master?.drive_mode ?? "",

      remarks: opportunity?.drive_master?.remarks ?? "",

      industryType: opportunity?.drive_master?.company_master?.industry_type ?? "",

      companySize: opportunity?.drive_master?.company_master?.company_size ?? "",

      opportunity: {
        ...opportunity,

        company_name: companyName,

        drive_name: driveName,

        package_range: packageRange,

        deadline_text: deadlineText,
      },

      eligibility: {
        allowedInstitutes,
        allowedDegrees,
        allowedBranches,
        allowedBatches,
        minimumCgpa: minCgpa,
        maximumActiveBacklogs: maxBacklogs,
        willingToRelocateRequired: !!eligibility?.willing_to_relocate_required,
        additionalRequirements: eligibility?.additional_requirements ?? "",
      },

      eligibleStudents,

      studentEmails,

      hodEmails,

      eligibilityCatalog: buildEligibilityCatalog(),
    };
  },
};
