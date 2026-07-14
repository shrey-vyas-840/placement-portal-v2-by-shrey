import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { adminDriveService } from "@/services/adminDriveService";
import { RecruitmentQuestionBuilder } from "@/components/RecruitmentQuestionBuilder";
import {
  RecruitmentEligibilityBuilder,
  type RecruitmentRoleEligibility,
} from "@/components/RecruitmentEligibilityBuilder";
import { RecruitmentRoleBuilder, type RecruitmentRole } from "@/components/RecruitmentRoleBuilder";
import { RecruitmentRolePreview } from "@/components/RecruitmentRolePreview";
import { validateRecruitmentRole } from "@/components/recruitmentRoleValidation";
import { createDraft, getDraftById, saveDraft } from "@/services/recruitmentDraftService";
import { publishRecruitmentDraft } from "@/services/recruitmentPublishService";
import type { RecruitmentQuestion } from "@/components/RecruitmentQuestionBuilder";
import { generateUuid } from "@/lib/generateUuid";
import { supabase } from "@/lib/supabase";

const STEPS = [
  "Company",
  "Recruitment Settings",
  "Default Eligibility",
  "Default Questions",
  "Job Roles",
  "Review & Publish",
];

interface CompanyFormData {
  company_name: string;
  company_website: string;
  hiring_location: string;
  industry_type: string;
  company_description: string;
  company_size: string;
}

interface RecruiterFormData {
  id: string;

  contact_name: string;

  contact_email: string;

  contact_number: string;

  contact_position: string;

  primary_contact: boolean;
}

interface DriveFormData {
  drive_type: "Placement" | "Internship" | "Intern + PPO" | "";
  drive_mode: "Online" | "Offline" | "Hybrid" | "";

  application_open: string;
  application_close: string;
}

interface DefaultEligibilityFormData {
  minimum_cgpa: string;

  maximum_active_backlogs: string;

  willing_to_relocate_required: boolean;

  additional_requirements: string;
}

const EMPTY_ELIGIBILITY: DefaultEligibilityFormData = {
  minimum_cgpa: "",

  maximum_active_backlogs: "0",

  willing_to_relocate_required: false,

  additional_requirements: "",
};

const now = new Date();

const close = new Date(now.getTime() + 48 * 60 * 60 * 1000);

const EMPTY_DRIVE: DriveFormData = {
  drive_type: "",
  drive_mode: "",

  application_open: now.toISOString().slice(0, 16),
  application_close: close.toISOString().slice(0, 16),
};

const EMPTY_RECRUITER = (): RecruiterFormData => ({
  id: generateUuid(),

  contact_name: "",

  contact_email: "",

  contact_number: "",

  contact_position: "Campus HR",

  primary_contact: false,
});

const EMPTY_COMPANY: CompanyFormData = {
  company_name: "",
  company_website: "",
  hiring_location: "",
  industry_type: "",
  company_description: "",
  company_size: "",
};

export function RecruitmentWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);

  const [searchText, setSearchText] = useState("");

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const isDraftCompany = selectedCompanyId === "DRAFT_COMPANY";

  const [showCreateCompany, setShowCreateCompany] = useState(false);

  const [pendingCompany, setPendingCompany] = useState<any | null>(null);

  const [showExistingCompanyDialog, setShowExistingCompanyDialog] = useState(false);

  const [dontShowCompanyWarning, setDontShowCompanyWarning] = useState(
    () => localStorage.getItem("hide-existing-company-warning") === "true",
  );

  const [company, setCompany] = useState<CompanyFormData>(EMPTY_COMPANY);

  const [recruiters, setRecruiters] = useState<RecruiterFormData[]>([
    {
      ...EMPTY_RECRUITER(),
      primary_contact: true,
    },
  ]);

  const [drive, setDrive] = useState<DriveFormData>(EMPTY_DRIVE);

  const [eligibility, setEligibility] = useState<RecruitmentRoleEligibility>({
    allowed_institutes: [],

    allowed_degrees: [],

    allowed_branches: [],

    passing_out_batches: [],

    minimum_cgpa: "",

    maximum_active_backlogs: "",

    willing_to_relocate_required: false,

    additional_requirements: "",
  });

  const [defaultQuestions, setDefaultQuestions] = useState<RecruitmentQuestion[]>([]);

  const [roles, setRoles] = useState<RecruitmentRole[]>([]);

  const [draftId, setDraftId] = useState<string | null>(null);

  const [authProviderId, setAuthProviderId] = useState<string | null>(null);

  const [draftLoaded, setDraftLoaded] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [isPublishing, setIsPublishing] = useState(false);

  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const [roleSelectionEnabled, setRoleSelectionEnabled] = useState(true);

  const [minimumRoleSelection, setMinimumRoleSelection] = useState(1);

  const [maximumRoleSelection, setMaximumRoleSelection] = useState(1);

  const filteredCompanies = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) return companies;

    return companies.filter((company) => {
      return (
        company.company_name?.toLowerCase().includes(search) ||
        company.industry_type?.toLowerCase().includes(search) ||
        company.hiring_location?.toLowerCase().includes(search)
      );
    });
  }, [companies, searchText]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await adminDriveService.getCompanies();

        setCompanies(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompanyId || selectedCompanyId === "DRAFT_COMPANY" || companies.length === 0) {
      return;
    }

    const master = companies.find((c) => c.company_id === selectedCompanyId);

    if (!master) return;

    setCompany({
      company_name: master.company_name ?? "",
      company_website: master.company_website ?? "",
      hiring_location: master.hiring_location ?? "",
      industry_type: master.industry_type ?? "",
      company_description: master.company_description ?? "",
      company_size: master.company_size ?? "",
    });
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    async function initializeDraft() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        setAuthProviderId(user.id);

        const url = new URL(window.location.href);

        const draftIdFromUrl = url.searchParams.get("draft");

        let draft;

        if (draftIdFromUrl) {
          draft = await getDraftById(draftIdFromUrl);
        } else {
          setDraftLoaded(true);
          return;
        }

        if (draft && draft.auth_provider_id === user.id) {
          setDraftId(draft.draft_id);

          if (draft.company_data) {
            const companyData = draft.company_data as Record<string, unknown>;

            setCompany({
              company_name: String(companyData.company_name ?? ""),
              company_website: String(companyData.company_website ?? ""),
              hiring_location: String(companyData.hiring_location ?? ""),
              industry_type: String(companyData.industry_type ?? ""),
              company_description: String(companyData.company_description ?? ""),

              company_size: String(companyData.company_size ?? ""),
            });
            const wizardState = (draft.wizard_state ?? {}) as Record<string, unknown>;

            setShowCreateCompany(false);

            const restoredSelectedCompanyId =
              typeof wizardState.selectedCompanyId === "string"
                ? wizardState.selectedCompanyId
                : "DRAFT_COMPANY";

            setSelectedCompanyId(restoredSelectedCompanyId);
            if (restoredSelectedCompanyId !== "DRAFT_COMPANY") {
              await loadCompanyRecruiters(restoredSelectedCompanyId);
            }
          }

          if (draft.current_step !== undefined) {
            setCurrentStep(draft.current_step);
          }
          if (Array.isArray(draft.recruiters_data) && draft.recruiters_data.length > 0) {
            setRecruiters(draft.recruiters_data as unknown as RecruiterFormData[]);
          }
          if (draft.drive_data) {
            const driveData = draft.drive_data as Record<string, unknown>;

            setDrive({
              drive_type: String(driveData.drive_type ?? "") as DriveFormData["drive_type"],

              drive_mode: String(driveData.drive_mode ?? "") as DriveFormData["drive_mode"],

              application_open: String(
                driveData.application_open ?? now.toISOString().slice(0, 16),
              ),

              application_close: String(
                driveData.application_close ?? close.toISOString().slice(0, 16),
              ),
            });
          }
          if (draft.eligibility_data) {
            const eligibilityData = draft.eligibility_data as Record<string, unknown>;

            setEligibility({
              allowed_institutes: Array.isArray(eligibilityData.allowed_institutes)
                ? eligibilityData.allowed_institutes
                : [],

              allowed_degrees: Array.isArray(eligibilityData.allowed_degrees)
                ? eligibilityData.allowed_degrees
                : [],

              allowed_branches: Array.isArray(eligibilityData.allowed_branches)
                ? eligibilityData.allowed_branches
                : [],

              passing_out_batches: Array.isArray(eligibilityData.passing_out_batches)
                ? eligibilityData.passing_out_batches
                : [],
              minimum_cgpa:
                typeof eligibilityData.minimum_cgpa === "number"
                  ? eligibilityData.minimum_cgpa
                  : "",

              maximum_active_backlogs:
                typeof eligibilityData.maximum_active_backlogs === "number"
                  ? eligibilityData.maximum_active_backlogs
                  : "",

              willing_to_relocate_required: Boolean(eligibilityData.willing_to_relocate_required),

              additional_requirements: String(eligibilityData.additional_requirements ?? ""),
            });
          }

          if (Array.isArray(draft.default_questions_data)) {
            setDefaultQuestions(
              draft.default_questions_data.map((question) => ({
                ...question,
                question_id:
                  question.question_id && question.question_id.trim() !== ""
                    ? question.question_id
                    : generateUuid(),
              })),
            );
          }

          if (Array.isArray(draft.roles_data)) {
            setRoles(
              draft.roles_data.map((role) => ({
                ...role,
                questions: (role.questions ?? []).map((question: RecruitmentQuestion) => ({
                  ...question,
                  question_id:
                    question.question_id && question.question_id.trim() !== ""
                      ? question.question_id
                      : generateUuid(),
                })),
              })),
            );
          }
        }

        setDraftLoaded(true);
      } catch (error) {
        console.error(error);
      }
    }

    initializeDraft();
  }, []);

  useEffect(() => {
    if (!draftLoaded || !authProviderId || !draftId) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setIsSavingDraft(true);

        await saveDraft({
          draftId,
          authProviderId,
          draftName:
            company.company_name.trim() === ""
              ? "Untitled Recruitment"
              : `${company.company_name} Recruitment`,

          currentStep,

          companyData: company,
          recruitersData: recruiters,
          driveData: drive,
          eligibilityData: eligibility,
          defaultQuestionsData: defaultQuestions,
          rolesData: roles,

          wizardState: {
            selectedCompanyId,
            companySelectionMode:
              selectedCompanyId === "DRAFT_COMPANY" ? "new" : selectedCompanyId ? "existing" : null,
          },
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsSavingDraft(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [
    company,
    recruiters,
    drive,
    eligibility,
    defaultQuestions,
    roles,
    currentStep,
    authProviderId,
    draftId,
    draftLoaded,
    selectedCompanyId,
  ]);
  async function loadCompanyRecruiters(companyId: string) {
    try {
      const contacts = await adminDriveService.getCompanyRecruiters(companyId);

      if (contacts.length === 0) {
        setRecruiters([
          {
            ...EMPTY_RECRUITER(),
            primary_contact: true,
          },
        ]);
        return;
      }

      setRecruiters(
        contacts.map((contact: any) => ({
          id: generateUuid(),
          contact_name: contact.contact_name ?? "",
          contact_email: contact.contact_email ?? "",
          contact_number: contact.contact_number ?? "",
          contact_position: contact.contact_position ?? "Campus HR",
          primary_contact: Boolean(contact.primary_contact),
        })),
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function handleCreateCompany() {
    if (!company.company_name.trim()) {
      alert("Company Name is required.");
      return;
    }

    if (!company.hiring_location.trim()) {
      alert("Hiring Location is required.");
      return;
    }

    const normalizedName = company.company_name.trim().toLowerCase();

    const existingCompany = companies.find(
      (item) =>
        String(item.company_name ?? "")
          .trim()
          .toLowerCase() === normalizedName,
    );

    if (existingCompany) {
      alert(
        'A company with this name already exists.\n\nPlease select it from the "Existing Companies" list instead of creating a new company.',
      );

      setSearchText(company.company_name);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setSelectedCompanyId("DRAFT_COMPANY");

    setShowCreateCompany(false);

    alert("Company saved into Recruitment Draft.");
  }

  function addRecruiter() {
    setRecruiters((previous) => [...previous, EMPTY_RECRUITER()]);
  }

  function removeRecruiter(id: string) {
    setRecruiters((previous) => {
      if (previous.length === 1) {
        return previous;
      }

      return previous.filter((r) => r.id !== id);
    });
  }

  function updateRecruiter(id: string, field: keyof RecruiterFormData, value: unknown) {
    setRecruiters((previous) =>
      previous.map((recruiter) => {
        if (recruiter.id !== id) {
          return recruiter;
        }

        return {
          ...recruiter,
          [field]: value,
        };
      }),
    );
  }

  function makePrimaryRecruiter(id: string) {
    setRecruiters((previous) =>
      previous.map((recruiter) => ({
        ...recruiter,
        primary_contact: recruiter.id === id,
      })),
    );
  }

  function addRoleFromWizard() {
    setRoles((previous) => [
      ...previous,
      {
        role_id: generateUuid(),

        role_name: "",

        employment_type: "Full Time",

        work_mode: "Onsite",

        role_description: "",

        openings: "",

        status: "Draft",

        compensation: {
          currency: "INR",
          fixed_ctc: "",
          variable_ctc: "",
          joining_bonus: "",
          retention_bonus: "",
          internship_stipend: "",
          ppo_package: "",
        },

        hiring: {
          locations: [],
          expected_joining_date: "",
          department: "",
          travel_required: false,
          shift_details: "",
        },

        inheritDefaultEligibility: true,

        eligibility: structuredClone(eligibility),

        inheritDefaultQuestions: true,

        questions: [],

        documents: [],

        timeline: [],
      },
    ]);
  }

  async function saveRolesOnly() {
    if (!draftId || !authProviderId) return;

    await saveDraft({
      draftId,
      authProviderId,
      draftName:
        company.company_name.trim() === ""
          ? "Untitled Recruitment"
          : `${company.company_name} Recruitment`,
      currentStep,
      companyData: company,
      recruitersData: recruiters,
      driveData: drive,
      eligibilityData: eligibility,
      defaultQuestionsData: defaultQuestions,
      rolesData: roles,
      wizardState: {
        selectedCompanyId,
        companySelectionMode:
          selectedCompanyId === "DRAFT_COMPANY" ? "new" : selectedCompanyId ? "existing" : null,
      },
    });

    alert("Roles saved.");
  }

  async function handlePublishRecruitment() {
    if (!draftId) {
      alert("Recruitment draft not found.");
      return;
    }

    const invalidRole = roles.find((role) => !validateRecruitmentRole(role).valid);

    if (invalidRole) {
      alert(`Role "${invalidRole.role_name || "Untitled Role"}" is incomplete.`);
      return;
    }

    setMaximumRoleSelection((previous) => {
      if (previous > roles.length) {
        return Math.max(1, roles.length);
      }

      return previous;
    });

    setShowPublishDialog(true);
  }

  async function confirmPublishRecruitment() {
    if (!draftId) {
      alert("Recruitment draft not found.");
      return;
    }

    try {
      setIsPublishing(true);

      await saveDraft({
        draftId: draftId!,
        authProviderId: authProviderId!,
        draftName:
          company.company_name.trim() === ""
            ? "Untitled Recruitment"
            : `${company.company_name} Recruitment`,
        currentStep,
        companyData: company,
        recruitersData: recruiters,
        driveData: drive,
        eligibilityData: eligibility,
        defaultQuestionsData: defaultQuestions,
        rolesData: roles,
        publishData: {
          role_selection_enabled: roleSelectionEnabled,
          minimum_role_selection: roleSelectionEnabled ? minimumRoleSelection : 0,
          maximum_role_selection: roleSelectionEnabled ? maximumRoleSelection : 0,
        },
        wizardState: {
          selectedCompanyId,
          companySelectionMode:
            selectedCompanyId === "DRAFT_COMPANY" ? "new" : selectedCompanyId ? "existing" : null,
        },
      });

      await publishRecruitmentDraft(draftId!);

      alert("Recruitment published successfully.");

      navigate({
        to: "/admin/recruitment",
        replace: true,
      });
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "Failed to publish recruitment.");
    } finally {
      setIsPublishing(false);
      setShowPublishDialog(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Recruitment Wizard
              </div>

              <h1 className="mt-2 text-3xl font-bold">New Recruitment</h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Guided campus recruitment creation.
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                {draftLoaded
                  ? isSavingDraft
                    ? "Saving draft..."
                    : "Draft saved automatically."
                  : "Loading draft..."}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Auto Save Enabled
                </span>

                {draftId && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    Draft Connected
                  </span>
                )}

                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  No database changes until Publish
                </span>
              </div>
            </div>

            <Link
              to="/admin/recruitment"
              className="rounded-xl border border-border px-4 py-2 hover:bg-muted"
            >
              Exit Wizard
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 text-lg font-semibold">Progress</div>

            <div className="space-y-3">
              {STEPS.map((step, index) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(index)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    index === currentStep
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="text-xs uppercase text-muted-foreground">Step {index + 1}</div>

                  <div className="mt-1 font-medium">{step}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Step {currentStep + 1}
            </div>

            <h2 className="mt-2 text-3xl font-bold">{STEPS[currentStep]}</h2>

            {isDraftCompany && (
              <div className="mt-2 mb-3 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                Draft Company
              </div>
            )}

            {currentStep === 0 && (
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                Search an existing company or create a new company for this recruitment.
              </p>
            )}

            {currentStep === 0 ? (
              <div className="mt-8 space-y-8">
                <div className="flex items-end gap-4 rounded-2xl border border-border bg-muted/20 p-6">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-medium">Search Company</label>

                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search company..."
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompanyId(null);
                      setCompany(EMPTY_COMPANY);
                      setShowCreateCompany(true);
                    }}
                    className="h-[50px] rounded-xl bg-primary px-6 text-primary-foreground"
                  >
                    + New Company
                  </button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border">
                  <div className="max-h-[450px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b">
                          <th className="w-20 px-4 py-4 text-left text-m uppercase">Select</th>
                          <th className="px-4 py-4 text-left text-m uppercase">Company</th>
                          <th className="px-4 py-4 text-left text-m uppercase">Industry</th>
                          <th className="px-4 py-4 text-left text-m uppercase">Location</th>
                          <th className="px-4 py-4 text-left text-m uppercase">Website</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredCompanies.map((item) => {
                          const selected =
                            selectedCompanyId === item.company_id ||
                            pendingCompany?.company_id === item.company_id;

                          return (
                            <tr
                              key={item.company_id}
                              onClick={async () => {
                                if (dontShowCompanyWarning) {
                                  setSelectedCompanyId(item.company_id);

                                  setShowCreateCompany(false);

                                  setCompany({
                                    company_name: item.company_name ?? "",
                                    company_website: item.company_website ?? "",
                                    hiring_location: item.hiring_location ?? "",
                                    industry_type: item.industry_type ?? "",
                                    company_description: item.company_description ?? "",
                                    company_size: item.company_size ?? "",
                                  });

                                  await loadCompanyRecruiters(item.company_id);

                                  return;
                                }
                                setPendingCompany(item);
                                setShowExistingCompanyDialog(true);
                              }}
                              className={`cursor-pointer border-b transition hover:bg-muted ${
                                selected ? "bg-primary/10 ring-1 ring-primary" : ""
                              }`}
                            >
                              <td className="px-4 py-4">
                                <input type="radio" checked={selected} readOnly />
                              </td>

                              <td className="px-4 py-4 font-medium">{item.company_name}</td>

                              <td className="px-4 py-4">{item.industry_type || "-"}</td>

                              <td className="px-4 py-4">{item.hiring_location || "-"}</td>

                              <td className="px-4 py-4 truncate">{item.company_website || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {!filteredCompanies.length && (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                      <div className="font-medium">
                        No matching company found. Click "New Company" to create one.
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Create a new company instead.
                      </div>
                    </div>
                  )}
                </div>

                {showExistingCompanyDialog && pendingCompany && (
                  <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
                    <h3 className="text-xl font-semibold">Continue with Existing Company?</h3>

                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      You selected
                      <span className="font-semibold"> {pendingCompany.company_name}</span>.
                    </p>

                    <div className="mt-5 rounded-xl border border-amber-300 bg-white p-5 text-sm leading-7">
                      <div>
                        ✓ A recruitment draft will be created using this company's information.
                      </div>

                      <div className="mt-2">
                        ✓ You may edit Company Information and Recruiters safely.
                      </div>

                      <div className="mt-2">
                        ✓ Your changes are stored only inside this Recruitment Draft.
                      </div>

                      <div className="mt-2 font-medium text-amber-700">
                        Company Master will NOT be modified by these edits.
                      </div>
                    </div>

                    <label className="mt-5 flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          localStorage.setItem(
                            "hide-existing-company-warning",
                            String(e.target.checked),
                          );

                          setDontShowCompanyWarning(e.target.checked);
                        }}
                      />
                      Don't show this message again
                    </label>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowExistingCompanyDialog(false);
                          setPendingCompany(null);
                        }}
                        className="rounded-xl border px-5 py-2"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!pendingCompany) return;

                          setSelectedCompanyId(pendingCompany.company_id);

                          setShowCreateCompany(false);

                          setCompany({
                            company_name: pendingCompany.company_name ?? "",
                            company_website: pendingCompany.company_website ?? "",
                            hiring_location: pendingCompany.hiring_location ?? "",
                            industry_type: pendingCompany.industry_type ?? "",
                            company_description: pendingCompany.company_description ?? "",
                            company_size: pendingCompany.company_size ?? "",
                          });

                          await loadCompanyRecruiters(pendingCompany.company_id);

                          window.scrollTo({
                            top: document.body.scrollHeight,
                            behavior: "smooth",
                          });

                          setShowExistingCompanyDialog(false);

                          setPendingCompany(null);
                        }}
                        className="rounded-xl bg-primary px-5 py-2 text-primary-foreground"
                      >
                        Continue with Draft Copy
                      </button>
                    </div>
                  </div>
                )}

                {selectedCompanyId && !showCreateCompany && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Selected Company
                        </div>

                        <h3 className="mt-1 text-xl font-semibold">
                          {company.company_name || "Draft Company"}
                        </h3>

                        <p className="mt-2 text-sm text-muted-foreground">
                          {company.industry_type || "Industry not specified"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCreateCompany(true)}
                        className="rounded-lg border px-4 py-2"
                      >
                        Edit Company
                      </button>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-3">
                      <div>
                        <div className="text-xs uppercase text-muted-foreground">Location</div>

                        <div className="mt-1">{company.hiring_location || "-"}</div>
                      </div>

                      <div>
                        <div className="text-xs uppercase text-muted-foreground">Website</div>

                        <div className="mt-1 truncate">{company.company_website || "-"}</div>
                      </div>

                      <div>
                        <div className="text-xs uppercase text-muted-foreground">Recruiters</div>

                        <div className="mt-1">{recruiters.length}</div>
                      </div>
                    </div>
                  </div>
                )}

                {showCreateCompany && (
                  <div className="mt-10 rounded-3xl border border-border bg-card p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-semibold">Create Company</h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          This company will become part of the master company database.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateCompany(false);
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                          setCompany(EMPTY_COMPANY);
                        }}
                        className="rounded-xl border border-border px-5 py-2"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Company Name</label>

                        <input
                          value={company.company_name}
                          onChange={(e) =>
                            setCompany((previous) => ({
                              ...previous,
                              company_name: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Website</label>

                        <input
                          value={company.company_website}
                          onChange={(e) =>
                            setCompany((previous) => ({
                              ...previous,
                              company_website: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Hiring Location</label>

                        <input
                          value={company.hiring_location}
                          onChange={(e) =>
                            setCompany((previous) => ({
                              ...previous,
                              hiring_location: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Industry</label>

                        <input
                          value={company.industry_type}
                          onChange={(e) =>
                            setCompany((previous) => ({
                              ...previous,
                              industry_type: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border px-4 py-3"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium">
                          Company Description
                        </label>

                        <textarea
                          rows={5}
                          value={company.company_description}
                          onChange={(e) =>
                            setCompany((previous) => ({
                              ...previous,
                              company_description: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Company Size</label>

                        <select
                          value={company.company_size}
                          onChange={(e) =>
                            setCompany((previous) => ({
                              ...previous,
                              company_size: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border px-4 py-3"
                        >
                          <option value="">Select</option>

                          <option value="Startup">Startup</option>

                          <option value="Small">Small</option>

                          <option value="Medium">Medium</option>

                          <option value="Large">Large</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 flex justify-end pt-5">
                        <button
                          type="button"
                          onClick={handleCreateCompany}
                          className="rounded-xl bg-primary px-8 py-3 text-primary-foreground transition hover:opacity-90"
                        >
                          Save Company
                        </button>
                      </div>
                    </div>
                    <div className="mt-10 border-t border-border pt-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">Recruiters</h3>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Add all company contacts participating in this recruitment.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={addRecruiter}
                          className="rounded-xl border border-border px-5 py-2 hover:bg-muted"
                        >
                          + Add Recruiter
                        </button>
                      </div>

                      <div className="mt-8 space-y-6">
                        {recruiters.map((recruiter, index) => (
                          <div
                            key={recruiter.id}
                            className="rounded-2xl border border-border bg-muted/20 p-6"
                          >
                            <div className="mb-6 flex items-center justify-between">
                              <div>
                                <div className="font-semibold">Recruiter {index + 1}</div>

                                <div className="text-xs text-muted-foreground">Company Contact</div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeRecruiter(recruiter.id)}
                                className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Contact Name
                                </label>

                                <input
                                  value={recruiter.contact_name}
                                  onChange={(e) =>
                                    updateRecruiter(recruiter.id, "contact_name", e.target.value)
                                  }
                                  className="w-full rounded-xl border border-border px-4 py-3"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm font-medium">Email</label>

                                <input
                                  value={recruiter.contact_email}
                                  onChange={(e) =>
                                    updateRecruiter(recruiter.id, "contact_email", e.target.value)
                                  }
                                  className="w-full rounded-xl border border-border px-4 py-3"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Contact Number
                                </label>

                                <input
                                  value={recruiter.contact_number}
                                  onChange={(e) =>
                                    updateRecruiter(recruiter.id, "contact_number", e.target.value)
                                  }
                                  className="w-full rounded-xl border border-border px-4 py-3"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Designation
                                </label>

                                <input
                                  value={recruiter.contact_position}
                                  onChange={(e) =>
                                    updateRecruiter(
                                      recruiter.id,
                                      "contact_position",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded-xl border border-border px-4 py-3"
                                />
                              </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                Primary recruiter for this recruitment
                              </div>

                              <button
                                type="button"
                                onClick={() => makePrimaryRecruiter(recruiter.id)}
                                className={`rounded-full px-4 py-2 text-sm ${
                                  recruiter.primary_contact
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border"
                                }`}
                              >
                                {recruiter.primary_contact ? "Primary" : "Make Primary"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : currentStep === 1 ? (
              <div className="mt-8 space-y-8">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <div className="font-semibold">Recruitment Settings</div>

                  <p className="mt-2 text-sm text-muted-foreground leading-6">
                    These settings apply to this recruitment. Eligibility, Questions and Role
                    configuration can be customized later.
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-card p-8">
                  <div className="grid gap-6 md:grid-cols-4 items-start">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Recruitment Type</label>

                      <select
                        value={drive.drive_type}
                        onChange={(e) =>
                          setDrive((prev) => ({
                            ...prev,
                            drive_type: e.target.value as DriveFormData["drive_type"],
                          }))
                        }
                        className="w-full rounded-xl border border-border px-4 py-3"
                      >
                        <option value="">Select</option>

                        <option value="Placement">Placement</option>

                        <option value="Internship">Internship</option>

                        <option value="Intern + PPO">Intern + PPO</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Recruitment Mode</label>

                      <select
                        value={drive.drive_mode}
                        onChange={(e) =>
                          setDrive((prev) => ({
                            ...prev,
                            drive_mode: e.target.value as DriveFormData["drive_mode"],
                          }))
                        }
                        className="w-full rounded-xl border border-border px-4 py-3"
                      >
                        <option value="">Select</option>

                        <option>Online</option>

                        <option>Offline</option>

                        <option>Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Application Opens</label>

                      <input
                        type="datetime-local"
                        value={drive.application_open}
                        onChange={(e) =>
                          setDrive((prev) => ({
                            ...prev,
                            application_open: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-border px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Application Closes</label>

                      <input
                        type="datetime-local"
                        value={drive.application_close}
                        onChange={(e) =>
                          setDrive((prev) => ({
                            ...prev,
                            application_close: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-border px-4 py-3"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Applications automatically open and close according to these dates.
                  </div>
                </div>
              </div>
            ) : currentStep === 2 ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">Recruitment Default Eligibility</h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Configure the default eligibility criteria for this recruitment. These rules
                    become the default eligibility for every new job role. Individual job roles may
                    later override any of these settings if required.
                  </p>
                </div>

                <RecruitmentEligibilityBuilder
                  value={eligibility}
                  onChange={setEligibility}
                  showInheritanceToggle={false}
                />
              </div>
            ) : currentStep === 3 ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
                  <div className="text-xl font-semibold">Default Questions (Optional)</div>

                  <p className="mt-3 text-sm leading-5 text-muted-foreground">
                    Add questions that should appear for every role in this recruitment. Later, each
                    role may add, remove or modify its own questions independently. If this
                    recruitment doesn't require additional questions, simply leave this empty and
                    continue.
                  </p>
                </div>

                <RecruitmentQuestionBuilder
                  questions={defaultQuestions}
                  onChange={setDefaultQuestions}
                  title="Recruitment Default Questions"
                  subtitle="These questions will be inherited by newly created job roles."
                />
              </div>
            ) : currentStep === 4 ? (
              <RecruitmentRoleBuilder
                roles={roles}
                onChange={setRoles}
                defaultEligibility={eligibility}
                defaultQuestions={defaultQuestions}
              />
            ) : (
              <div className="space-y-8">
                <div className="rounded-3xl border border-border bg-card p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold">Recruitment Review</h3>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Verify every configuration before publishing.
                      </p>
                    </div>

                    <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium">
                      {roles.length} Job Role{roles.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="text-lg font-semibold">Recruitment</div>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Company</span>

                        <span className="font-medium">{company.company_name || "—"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recruitment Type</span>

                        <span className="font-medium">{drive.drive_type || "—"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mode</span>

                        <span className="font-medium">{drive.drive_mode || "—"}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Application Window</span>

                        <span className="font-medium">
                          {drive.application_open || "—"} → {drive.application_close || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recruiters</span>

                        <span className="font-medium">{recruiters.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="text-lg font-semibold">Configuration Summary</div>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Default Questions</span>

                        <span className="font-medium">{defaultQuestions.length}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Job Roles</span>

                        <span className="font-medium">{roles.length}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Draft Status</span>

                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          Draft
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {roles.map((role) => {
                    const validation = validateRecruitmentRole(role);

                    return (
                      <RecruitmentRolePreview
                        key={role.role_id}
                        role={role}
                        defaultEligibility={eligibility}
                        defaultQuestions={defaultQuestions}
                        variant="summary"
                        status={validation.valid ? "Ready" : "Draft"}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="rounded-xl border border-border px-5 py-2 disabled:opacity-40 transition hover:bg-gray-200"
              >
                Back
              </button>

              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </div>

              <button
                onClick={async () => {
                  if (currentStep === 5) {
                    await handlePublishRecruitment();
                    return;
                  }
                  if (currentStep === 0) {
                    if (!selectedCompanyId) {
                      alert("Please select or create a company.");
                      return;
                    }

                    const primaryRecruiter = recruiters.find((r) => r.primary_contact);

                    if (!primaryRecruiter) {
                      alert("Please select a primary recruiter.");
                      return;
                    }

                    if (!primaryRecruiter.contact_name.trim()) {
                      alert("Primary recruiter name is required.");
                      return;
                    }

                    if (!primaryRecruiter.contact_email.trim()) {
                      alert("Primary recruiter email is required.");
                      return;
                    }
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                    if (!emailPattern.test(primaryRecruiter.contact_email)) {
                      alert("Primary recruiter email is invalid.");

                      return;
                    }

                    if (!draftId) {
                      const newDraft = await createDraft(
                        authProviderId!,
                        company.company_name.trim() === ""
                          ? "Untitled Recruitment"
                          : `${company.company_name} Recruitment`,
                        company,
                        recruiters,
                      );

                      setDraftId(newDraft.draft_id);

                      navigate({
                        to: "/admin/recruitment-new",
                        search: {
                          draft: newDraft.draft_id,
                        },
                        replace: true,
                      });
                    }
                  }
                  if (currentStep === 1) {
                    if (!drive.drive_type) {
                      alert("Please select Recruitment Type.");

                      return;
                    }

                    if (!drive.drive_mode) {
                      alert("Please select Recruitment Mode.");

                      return;
                    }

                    if (!drive.application_open) {
                      alert("Please select Application Open Date.");
                      return;
                    }

                    if (!drive.application_close) {
                      alert("Please select Application Close Date.");
                      return;
                    }

                    const openDate = new Date(drive.application_open);

                    const closeDate = new Date(drive.application_close);

                    if (closeDate <= openDate) {
                      alert("Application Close must be after Application Open.");
                      return;
                    }
                  }
                  setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));
                }}
                disabled={isPublishing}
                className="rounded-xl bg-primary px-5 py-2 text-primary-foreground disabled:opacity-40 text-m font-semibold transition hover:bg-blue-600"
              >
                {currentStep === 4
                  ? "Review Recruitment"
                  : currentStep === 5
                    ? isPublishing
                      ? "Publishing..."
                      : "Publish Recruitment"
                    : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPublishDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl">
            <h2 className="text-2xl font-bold">Publish Recruitment</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Configure how students can apply before publishing.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Enable Multiple Role Selection
                </label>

                <select
                  value={roleSelectionEnabled ? "yes" : "no"}
                  onChange={(e) => {
                    const enabled = e.target.value === "yes";

                    setRoleSelectionEnabled(enabled);

                    if (!enabled) {
                      setMinimumRoleSelection(0);
                      setMaximumRoleSelection(0);
                    } else {
                      setMinimumRoleSelection(1);
                      setMaximumRoleSelection(1);
                    }
                  }}
                  className="w-full rounded-xl border border-border px-4 py-3"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              {roleSelectionEnabled && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Minimum Roles</label>

                    <input
                      type="number"
                      min={1}
                      max={roles.length}
                      step={1}
                      value={minimumRoleSelection}
                      onChange={(e) =>
                        setMinimumRoleSelection(
                          Math.max(
                            1,
                            Math.min(roles.length, Number.parseInt(e.target.value || "1", 10)),
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-border px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Maximum Roles</label>

                    <input
                      type="number"
                      min={1}
                      max={roles.length}
                      step={1}
                      value={maximumRoleSelection}
                      onChange={(e) =>
                        setMaximumRoleSelection(
                          Math.max(
                            minimumRoleSelection,
                            Math.min(roles.length, Number.parseInt(e.target.value || "1", 10)),
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-border px-4 py-3"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                <div>
                  Available Roles: <strong>{roles.length}</strong>
                </div>

                <div className="mt-1">
                  Students may select between <strong>{minimumRoleSelection}</strong> and{" "}
                  <strong>{maximumRoleSelection}</strong> role(s).
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPublishDialog(false)}
                disabled={isPublishing}
                className="rounded-xl border px-5 py-2"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isPublishing ||
                  (roleSelectionEnabled &&
                    (minimumRoleSelection < 1 ||
                      maximumRoleSelection < minimumRoleSelection ||
                      maximumRoleSelection > roles.length))
                }
                onClick={confirmPublishRecruitment}
                className="rounded-xl bg-primary px-6 py-2 text-primary-foreground disabled:opacity-50"
              >
                {isPublishing ? "Publishing..." : "Publish Recruitment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
