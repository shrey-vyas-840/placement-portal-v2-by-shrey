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

  const [company, setCompany] = useState<CompanyFormData>(EMPTY_COMPANY);

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
            setSelectedCompanyId("DRAFT_COMPANY");
          }

          if (draft.current_step !== undefined) {
            setCurrentStep(draft.current_step);
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

          currentStep,

          companyData: company,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsSavingDraft(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [company, currentStep, authProviderId, draftLoaded]);

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
                <div className="rounded-2xl border border-border bg-muted/20 p-6">
                  <label className="mb-2 block text-sm font-medium">Search Existing Company</label>

                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by company name, industry or location..."
                    className="w-full rounded-xl border border-border bg-background px-4 py-3"
                  />
                </div>

                <div className="grid gap-4">
                  {filteredCompanies.map((item) => {
                    const selected = selectedCompanyId === item.company_id;

                    return (
                      <button
                        key={item.company_id}
                        type="button"
                        onClick={() => {
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
                        }}
                        className={`rounded-2xl border p-5 text-left transition ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold">{item.company_name}</div>

                            <div className="mt-1 text-sm text-muted-foreground">
                              {item.industry_type || "Industry not specified"}
                            </div>
                          </div>

                          {selected && (
                            <div className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                              Selected
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase text-muted-foreground">Location</div>

                            <div className="mt-1">{item.hiring_location || "-"}</div>
                          </div>

                          <div>
                            <div className="text-xs uppercase text-muted-foreground">Website</div>

                            <div className="mt-1 truncate">{item.company_website || "-"}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {!filteredCompanies.length && (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                      <div className="font-medium">No matching company found.</div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Create a new company instead.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompanyId(null);
                      setCompany(EMPTY_COMPANY);
                      setShowCreateCompany(true);
                    }}
                    className="rounded-xl border border-border px-6 py-3 hover:bg-muted"
                  >
                    + Create New Company
                  </button>
                </div>

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
                  if (currentStep === 0 && !selectedCompanyId) {
                    alert("Please select or create a company.");

                    return;
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
