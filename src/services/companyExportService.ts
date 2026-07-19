import { supabase } from "@/lib/supabase";

export interface CompanyRecruiter {
  contact_name: string;

  contact_email: string;

  contact_number: string;

  contact_position: string;

  primary_contact: boolean;
}

export interface CompanyExportRow {
  companyId: string;

  companyName: string;

  website: string;

  description: string;

  industry: string;

  hiringLocation: string;

  companySize: string;

  pastRecruitmentCount: number;

  recruiters: CompanyRecruiter[];
}

export interface CompanyExportData {
  rows: CompanyExportRow[];
}

export const companyExportService = {
  async getCompanyExportData(): Promise<CompanyExportData> {
    const { data: companies, error } = await (supabase as any)

      .from("company_master")

      .select("*")

      .eq("is_deleted", false)

      .order("company_name");

    if (error) {
      throw error;
    }

    const companyIds = ((companies ?? []) as any[]).map((company) => company.company_id);
    const { data: contacts } = await (supabase as any)

      .from("company_contacts")

      .select("*")

      .in("company_id", companyIds)

      .order("primary_contact", {
        ascending: false,
      });

    const rows: CompanyExportRow[] = ((companies ?? []) as any[]).map((company) => ({
      companyId: company.company_id,

      companyName: company.company_name ?? "",

      website: company.company_website ?? "",

      description: company.company_description ?? "",

      industry: company.industry_type ?? "",

      hiringLocation: company.hiring_location ?? "",
        
      companySize: company.company_size ?? "",

      pastRecruitmentCount: company.past_drive_count ?? 0,

      recruiters: ((contacts ?? []) as any[])

        .filter((contact) => contact.company_id === company.company_id)

        .map((contact) => ({
          contact_name: contact.contact_name ?? "",

          contact_email: contact.contact_email ?? "",

          contact_number: contact.contact_number ?? "",

          contact_position: contact.contact_position ?? "",

          primary_contact: contact.primary_contact ?? false,
        })),
    }));

    return {
      rows,
    };
  },
};
