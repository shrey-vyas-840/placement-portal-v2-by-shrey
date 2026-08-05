import { supabase } from "@/lib/supabase";

export const adminDriveService = {
  async createDriveForPublish(payload: {
    drive_id: string;
    company_id: string;

    drive_name: string;

    drive_type: string;

    drive_mode: string;

    registration_deadline?: string | null;

    lowest_package_lpa?: number;

    highest_package_lpa?: number;

    bond_years?: number;

    total_hiring_requirement?: number;

    remarks?: string;

    drive_status: string;

    role_selection_enabled: boolean;

    minimum_role_selection: number;

    maximum_role_selection: number;
  }) {
    const { data, error } = await (supabase as any)
      .from("drive_master")
      .insert({
        drive_id: payload.drive_id,
        company_id: payload.company_id,
        drive_name: payload.drive_name,
        drive_type: payload.drive_type,
        drive_mode: payload.drive_mode,
        registration_deadline: payload.registration_deadline ?? null,
        lowest_package_lpa: payload.lowest_package_lpa ?? null,
        highest_package_lpa: payload.highest_package_lpa ?? null,
        bond_years: payload.bond_years ?? null,
        total_hiring_requirement: payload.total_hiring_requirement ?? null,
        remarks: payload.remarks ?? null,
        drive_status: payload.drive_status,
        role_selection_enabled: payload.role_selection_enabled,
        minimum_role_selection: payload.minimum_role_selection,
        maximum_role_selection: payload.maximum_role_selection,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async saveEligibilityForPublish(payload: {
    drive_id: string;
    allowed_institutes: string;
    allowed_branches: string;
    allowed_degrees: string;
    additional_requirements?: string;
    passing_out_batches: string;
    minimum_cgpa: number;
    maximum_active_backlogs: number;
    willing_to_relocate_required: boolean;
  }) {
    const { error } = await (supabase as any).from("drive_eligibility").insert({
      drive_id: payload.drive_id,
      allowed_institutes: payload.allowed_institutes,
      allowed_branches: payload.allowed_branches,
      allowed_degrees: payload.allowed_degrees,
      additional_requirements: payload.additional_requirements ?? null,
      passing_out_batches: payload.passing_out_batches,
      minimum_cgpa: payload.minimum_cgpa,
      maximum_active_backlogs: payload.maximum_active_backlogs,
      willing_to_relocate_required: payload.willing_to_relocate_required,
    });

    if (error) throw error;
  },

  async getCompanies() {
    const { data, error } = await (supabase as any)
      .from("company_master")
      .select("*")
      .eq("is_deleted", false)
      .order("company_name");

    if (error) throw error;

    return data ?? [];
  },

  async getCompanyRecruiters(companyId: string) {
    const { data, error } = await (supabase as any)
      .from("company_contacts")
      .select("*")
      .eq("company_id", companyId)
      .order("primary_contact", { ascending: false });

    if (error) throw error;

    return data ?? [];
  },

  async getLatestPublishedRecruitmentTemplate(companyId: string) {
    const { data, error } = await (supabase as any)
      .from("recruitment_drafts")
      .select(
        `
          draft_id,
          draft_name,
          company_data,
          recruiters_data,
          drive_data,
          eligibility_data,
          default_questions_data,
          roles_data,
          publish_data,
          created_company_id
        `,
      )
      .eq("created_company_id", companyId)
      .eq("status", "PUBLISHED")
      .eq("is_archived", false)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  },

  async createCompanyForPublish(payload: {
    company_id: string;
    company_name: string;
    company_website?: string;
    hiring_location: string;
    industry_type?: string;
    company_description?: string;
    company_size?: string;
  }) {
    const { data, error } = await (supabase as any)
      .from("company_master")
      .insert({
        company_id: payload.company_id,
        company_name: payload.company_name,
        company_website: payload.company_website || null,
        hiring_location: payload.hiring_location,
        industry_type: payload.industry_type || null,
        company_description: payload.company_description || null,
        company_size: payload.company_size || null,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async createCompany(payload: {
    company_name: string;
    company_website?: string;
    hiring_location: string;
    industry_type?: string;
    company_description?: string;
    company_size?: string;
  }) {
    const { data, error } = await (supabase as any)
      .from("company_master")
      .insert({
        company_name: payload.company_name,
        company_website: payload.company_website || null,
        hiring_location: payload.hiring_location,
        industry_type: payload.industry_type || null,
        company_description: payload.company_description || null,
        company_size: payload.company_size || null,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async getDrives() {
    const { data, error } = await (supabase as any)
      .from("drive_master")
      .select(
        `
                *,
                company_master (
                    company_name
                )
            `,
      )
      .eq("is_deleted", false)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data ?? [];
  },

  async createDrive(payload: {
    company_id: string;
    drive_name: string;
    drive_type: string;
    drive_mode: string;
    lowest_package_lpa?: number;
    highest_package_lpa?: number;
    bond_years?: number;
    remarks?: string;
  }) {
    const { data, error } = await (supabase as any)
      .from("drive_master")
      .insert({
        company_id: payload.company_id,

        drive_name: payload.drive_name,

        drive_type: payload.drive_type,

        drive_mode: payload.drive_mode,

        drive_status: "Created",
        lowest_package_lpa: payload.lowest_package_lpa,

        highest_package_lpa: payload.highest_package_lpa,

        bond_years: payload.bond_years,

        remarks: payload.remarks,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateCompany(
    companyId: string,
    payload: {
      company_name: string;
      company_website?: string;
      hiring_location: string;
      industry_type?: string;
      company_description?: string;
      company_size?: string;
    },
  ) {
    const { data, error } = await (supabase as any)
      .from("company_master")
      .update({
        company_name: payload.company_name,

        company_website: payload.company_website || null,

        hiring_location: payload.hiring_location,

        industry_type: payload.industry_type || null,

        company_description: payload.company_description || null,

        company_size: payload.company_size || null,
      })
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateDrive(
    driveId: string,
    payload: {
      company_id: string;
      drive_name: string;
      drive_type: string;
      drive_mode: string;
      lowest_package_lpa?: number;
      highest_package_lpa?: number;
      bond_years?: number;
      remarks?: string;
    },
  ) {
    const { data, error } = await (supabase as any)
      .from("drive_master")
      .update({
        company_id: payload.company_id,

        drive_name: payload.drive_name,

        drive_type: payload.drive_type,

        drive_mode: payload.drive_mode,

        lowest_package_lpa: payload.lowest_package_lpa,

        highest_package_lpa: payload.highest_package_lpa,

        bond_years: payload.bond_years,

        remarks: payload.remarks,
      })
      .eq("drive_id", driveId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async deactivateDrive(driveId: string) {
    const { error } = await (supabase as any)
      .from("drive_master")
      .update({
        is_active: false,
      })
      .eq("drive_id", driveId);

    if (error) throw error;
  },

  async restoreDrive(driveId: string) {
    const { error } = await (supabase as any)
      .from("drive_master")
      .update({
        is_active: true,
      })
      .eq("drive_id", driveId);

    if (error) throw error;
  },

  async updateDriveStatus(driveId: string, status: string) {
    const { error } = await (supabase as any)
      .from("drive_master")
      .update({
        drive_status: status,
      })
      .eq("drive_id", driveId);

    if (error) throw error;
  },
  async getEligibility(driveId: string) {
    const { data, error } = await (supabase as any)
      .from("drive_eligibility")
      .select("*")
      .eq("drive_id", driveId)
      .maybeSingle();

    if (error) throw error;

    return data;
  },

  async publishRoles(
    driveId: string,
    roles: Array<{
      drive_role_id: string;
      drive_role_name: string;
      role_description?: string;
      role_type?: string;
      required_skills?: string;
      inherit_default_questions: boolean;
    }>,
  ) {
    if (roles.length === 0) {
      return;
    }

    const { error } = await (supabase as any).from("drive_roles").insert(
      roles.map((role) => ({
        drive_role_id: role.drive_role_id,
        drive_id: driveId,
        drive_role_name: role.drive_role_name,
        role_description: role.role_description ?? null,
        role_type: role.role_type ?? null,
        required_skills: role.required_skills ?? null,
        inherit_default_questions: role.inherit_default_questions,
      })),
    );

    if (error) {
      throw error;
    }
  },

  async saveEligibility(payload: {
    drive_id: string;
    allowed_institutes: string;
    allowed_branches: string;
    allowed_degrees: string;
    additional_requirements?: string;
    passing_out_batches: string;
    minimum_cgpa: number;
    maximum_active_backlogs: number;
    willing_to_relocate_required: boolean;
  }) {
    const { data: existing } = await (supabase as any)
      .from("drive_eligibility")
      .select("eligibility_id")
      .eq("drive_id", payload.drive_id)
      .maybeSingle();

    if (existing) {
      const { error } = await (supabase as any)
        .from("drive_eligibility")
        .update(payload)
        .eq("drive_id", payload.drive_id);

      if (error) throw error;

      return;
    }

    const { error } = await (supabase as any).from("drive_eligibility").insert(payload);

    if (error) throw error;
  },

  async updateCompanyContact(
    contactId: string,
    payload: {
      contact_name: string;
      contact_email: string;
      contact_number?: string;
      contact_position?: string;
      primary_contact: boolean;
    },
  ) {
    const { data, error } = await (supabase as any)
      .from("company_contacts")
      .update({
        contact_name: payload.contact_name,
        contact_email: payload.contact_email,
        contact_number: payload.contact_number ?? null,
        contact_position: payload.contact_position ?? null,
        primary_contact: payload.primary_contact,
      })
      .eq("contact_id", contactId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async getPrimaryCompanyContact(companyId: string) {
    const { data, error } = await (supabase as any)
      .from("company_contacts")
      .select("*")
      .eq("company_id", companyId)
      .eq("primary_contact", true)
      .maybeSingle();

    if (error) throw error;

    return data;
  },

  async getCompanyContacts(companyId: string) {
    const { data, error } = await (supabase as any)
      .from("company_contacts")
      .select("*")
      .eq("company_id", companyId)
      .order("primary_contact", { ascending: false })
      .order("contact_name");

    if (error) throw error;

    return data ?? [];
  },

  async createCompanyContact(payload: {
    company_id: string;
    contact_name: string;
    contact_email: string;
    contact_number?: string;
    contact_position?: string;
    primary_contact: boolean;
  }) {
    const { data, error } = await (supabase as any)
      .from("company_contacts")
      .insert({
        company_id: payload.company_id,
        contact_name: payload.contact_name,
        contact_email: payload.contact_email,
        contact_number: payload.contact_number ?? null,
        contact_position: payload.contact_position ?? null,
        primary_contact: payload.primary_contact,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async deleteCompanyContact(contactId: string) {
    const { error } = await (supabase as any)
      .from("company_contacts")
      .delete()
      .eq("contact_id", contactId);

    if (error) throw error;
  },
};
