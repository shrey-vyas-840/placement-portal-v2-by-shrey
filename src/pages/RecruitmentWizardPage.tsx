import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { adminDriveService } from "@/services/adminDriveService";

import { getLatestDraft, saveDraft } from "@/services/recruitmentDraftService";

import { supabase } from "@/lib/supabase";

const STEPS = ["Company", "Drive", "Eligibility", "Questions", "Job Roles", "Review"];

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

const EMPTY_RECRUITER = (): RecruiterFormData => ({
  id: crypto.randomUUID(),

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

  const [draftId, setDraftId] = useState<string | null>(null);

  const [authProviderId, setAuthProviderId] = useState<string | null>(null);

  const [draftLoaded, setDraftLoaded] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

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
    async function initializeDraft() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        setAuthProviderId(user.id);

        const draft = await getLatestDraft();

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
            setShowCreateCompany(false);
            setSelectedCompanyId("DRAFT_COMPANY");
          }

          if (draft.current_step !== undefined) {
            setCurrentStep(draft.current_step);
          }
          if (Array.isArray(draft.recruiters_data) && draft.recruiters_data.length > 0) {
            setRecruiters(draft.recruiters_data as unknown as RecruiterFormData[]);
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
    if (!draftLoaded || !authProviderId) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setIsSavingDraft(true);

        await saveDraft({
          authProviderId,
          draftName:
            company.company_name.trim() === ""
              ? "Untitled Recruitment"
              : `${company.company_name} Campus Recruitment`,
          currentStep,
          companyData: company,
          recruitersData: recruiters,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsSavingDraft(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [company, recruiters, currentStep, authProviderId, draftLoaded]);

  async function handleCreateCompany() {
    if (!company.company_name.trim()) {
      alert("Company Name is required.");
      return;
    }

    if (!company.hiring_location.trim()) {
      alert("Hiring Location is required.");
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
              <div className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                Draft Company • Not yet created in Company Master
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
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b">
                          <th className="w-20 px-4 py-3 text-left text-xs uppercase">Select</th>

                          <th className="px-4 py-3 text-left text-xs uppercase">Company</th>

                          <th className="px-4 py-3 text-left text-xs uppercase">Industry</th>

                          <th className="px-4 py-3 text-left text-xs uppercase">Location</th>

                          <th className="px-4 py-3 text-left text-xs uppercase">Website</th>
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
                              onClick={() => {
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

                                  return;
                                }

                                setPendingCompany(item);
                                setShowExistingCompanyDialog(true);
                                setSelectedCompanyId(item.company_id);
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

                          setSelectedCompanyId(null);
                        }}
                        className="rounded-xl border px-5 py-2"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!pendingCompany) return;

                          setSelectedCompanyId(pendingCompany.company_id);
                          window.scrollTo({
                            top: document.body.scrollHeight,
                            behavior: "smooth",
                          });
                          setShowCreateCompany(false);

                          setCompany({
                            company_name: pendingCompany.company_name ?? "",
                            company_website: pendingCompany.company_website ?? "",
                            hiring_location: pendingCompany.hiring_location ?? "",
                            industry_type: pendingCompany.industry_type ?? "",
                            company_description: pendingCompany.company_description ?? "",
                            company_size: pendingCompany.company_size ?? "",
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
                        <div className="md:col-span-2 flex justify-end pt-4">
                          <button
                            type="button"
                            onClick={handleCreateCompany}
                            className="rounded-xl bg-primary px-8 py-3 text-primary-foreground transition hover:opacity-90"
                          >
                            Save Company
                          </button>
                        </div>
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
            ) : (
              <div className="mt-8 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border">
                <div className="text-center">
                  <div className="text-2xl font-semibold">{STEPS[currentStep]}</div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    UI for this step will be implemented in upcoming phases.
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="rounded-xl border border-border px-5 py-2 disabled:opacity-40"
              >
                Back
              </button>

              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </div>

              <button
                onClick={() => {
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
                  }

                  setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));
                }}
                disabled={currentStep === STEPS.length - 1}
                className="rounded-xl bg-primary px-5 py-2 text-primary-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
