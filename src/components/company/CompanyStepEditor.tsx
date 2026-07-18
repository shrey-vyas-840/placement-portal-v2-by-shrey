import { generateUuid } from "@/lib/generateUuid";

export interface CompanyFormData {
  company_name: string;
  company_website: string;
  hiring_location: string;
  industry_type: string;
  company_description: string;
  company_size: string;
}

export interface RecruiterFormData {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_number: string;
  contact_position: string;
  primary_contact: boolean;
}

export const EMPTY_COMPANY: CompanyFormData = {
  company_name: "",
  company_website: "",
  hiring_location: "",
  industry_type: "",
  company_description: "",
  company_size: "",
};

export const EMPTY_RECRUITER = (): RecruiterFormData => ({
  id: generateUuid(),
  contact_name: "",
  contact_email: "",
  contact_number: "",
  contact_position: "Campus HR",
  primary_contact: false,
});

interface Props {
  company: CompanyFormData;
  recruiters: RecruiterFormData[];

  setCompany: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  setRecruiters: React.Dispatch<React.SetStateAction<RecruiterFormData[]>>;
}

export function CompanyStepEditor({
  company,
  recruiters,
}: Props) {
  return (
    <div className="rounded-3xl border border-border bg-card p-10 text-center">
      <h3 className="text-2xl font-semibold">
        Company Step Editor
      </h3>

      <p className="mt-2 text-muted-foreground">
        Step 1 extraction in progress...
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 text-left">
        <div>
          <div className="text-xs uppercase text-muted-foreground">
            Company
          </div>

          <div className="font-medium">
            {company.company_name || "Not Selected"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase text-muted-foreground">
            Recruiters
          </div>

          <div className="font-medium">
            {recruiters.length}
          </div>
        </div>
      </div>
    </div>
  );
}