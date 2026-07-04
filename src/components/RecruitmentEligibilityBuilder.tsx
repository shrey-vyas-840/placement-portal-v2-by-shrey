import { useMemo, useState } from "react";
import { ELIGIBILITY_MAPPING } from "@/constants/eligibilityMapping";

export type RecruitmentRoleEligibility = {
  useRecruitmentDefaults: boolean;
  allowed_institutes: string[];
  allowed_degrees: string[];
  allowed_branches: string[];
  passing_out_batches: string[];
  minimum_cgpa: number | "";
  maximum_active_backlogs: number | "";
  willing_to_relocate_required: boolean;
  additional_requirements: string;
};

interface RecruitmentEligibilityBuilderProps {
  value: RecruitmentRoleEligibility;
  onChange: (next: RecruitmentRoleEligibility) => void;
  readOnly?: boolean;
  loading?: boolean;
}

type EligibilityMapping = Record<string, Record<string, string[]>>;

const eligibilityMapping = ELIGIBILITY_MAPPING as EligibilityMapping;

type InstituteEntry = [string, Record<string, string[]>];

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isValidInstitute(institute: string) {
  return Object.prototype.hasOwnProperty.call(ELIGIBILITY_MAPPING, institute);
}

export function RecruitmentEligibilityBuilder({
  value,
  onChange,
  readOnly = false,
  loading = false,
}: RecruitmentEligibilityBuilderProps) {
  const [batchInput, setBatchInput] = useState("");

  const instituteEntries = useMemo<InstituteEntry[]>(
    () => Object.entries(ELIGIBILITY_MAPPING) as InstituteEntry[],
    [],
  );

  const selectedInstitutes = value.allowed_institutes;
  const selectedDegrees = value.allowed_degrees;
  const selectedBranches = value.allowed_branches;
  const selectedBatches = value.passing_out_batches;

  function pushValue(next: RecruitmentRoleEligibility) {
    const sanitizedInstitutes = unique(next.allowed_institutes.filter(isValidInstitute));

    const sanitizedDegrees = unique(
      next.allowed_degrees.filter((degree) =>
        sanitizedInstitutes.some((institute) =>
          Object.prototype.hasOwnProperty.call(eligibilityMapping[institute] ?? {}, degree),
        ),
      ),
    );

    const sanitizedBranches = unique(
      next.allowed_branches.filter((branch) =>
        sanitizedInstitutes.some((institute) =>
          sanitizedDegrees.some(
            (degree) => (eligibilityMapping[institute] ?? {})[degree]?.includes(branch),
          ),
        ),
      ),
    );

    onChange({
      ...next,
      allowed_institutes: sanitizedInstitutes,
      allowed_degrees: sanitizedDegrees,
      allowed_branches: sanitizedBranches,
      passing_out_batches: unique(next.passing_out_batches.map((item) => item.trim())),
    });
  }

  function updateField(
    field: "minimum_cgpa" | "maximum_active_backlogs" | "additional_requirements",
    nextValue: string | number | "",
  ) {
    pushValue({
      ...value,
      [field]: nextValue,
    });
  }

  function toggleInstitute(institute: string, checked: boolean) {
    const nextInstitutes = checked
      ? unique([...selectedInstitutes, institute])
      : selectedInstitutes.filter((item) => item !== institute);

    const nextDegrees = selectedDegrees.filter((degree) =>
      nextInstitutes.some((nextInstitute) =>
        Object.prototype.hasOwnProperty.call(eligibilityMapping[nextInstitute] ?? {}, degree),
      ),
    );

    const nextBranches = selectedBranches.filter((branch) =>
      nextInstitutes.some((nextInstitute) =>
        nextDegrees.some(
          (degree) => (eligibilityMapping[nextInstitute] ?? {})[degree]?.includes(branch),
        ),
      ),
    );

    pushValue({
      ...value,
      allowed_institutes: nextInstitutes,
      allowed_degrees: nextDegrees,
      allowed_branches: nextBranches,
    });
  }

  function toggleDegree(institute: string, degree: string, checked: boolean) {
    const nextInstitutes = checked
      ? unique([...selectedInstitutes, institute])
      : selectedInstitutes;

    const nextDegrees = checked
      ? unique([...selectedDegrees, degree])
      : selectedDegrees.filter((item) => item !== degree);

    const nextBranches = selectedBranches.filter((branch) =>
      nextInstitutes.some((nextInstitute) =>
        nextDegrees.some(
          (nextDegree) => (eligibilityMapping[nextInstitute] ?? {})[nextDegree]?.includes(branch),
        ),
      ),
    );

    pushValue({
      ...value,
      allowed_institutes: nextInstitutes,
      allowed_degrees: nextDegrees,
      allowed_branches: nextBranches,
    });
  }

  function toggleBranch(branch: string, checked: boolean) {
    const nextBranches = checked
      ? unique([...selectedBranches, branch])
      : selectedBranches.filter((item) => item !== branch);

    pushValue({
      ...value,
      allowed_branches: nextBranches,
    });
  }

  function addBatch() {
    const batch = batchInput.trim();

    if (!batch) return;

    pushValue({
      ...value,
      passing_out_batches: unique([...selectedBatches, batch]),
    });

    setBatchInput("");
  }

  function removeBatch(batch: string) {
    pushValue({
      ...value,
      passing_out_batches: selectedBatches.filter((item) => item !== batch),
    });
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="text-sm text-muted-foreground">Loading eligibility editor...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Eligibility</div>

            <div className="mt-1 text-xs text-muted-foreground">
              Configure who is eligible to apply for this role.
            </div>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            Role Level
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <label className="flex items-start gap-3 rounded-xl border border-border p-4">
          <input
            type="checkbox"
            disabled={readOnly}
            checked={value.useRecruitmentDefaults}
            onChange={(e) =>
              pushValue({
                ...value,
                useRecruitmentDefaults: e.target.checked,
              })
            }
          />

          <div>
            <div className="font-medium">Use Recruitment Default Eligibility</div>

            <div className="mt-1 text-sm text-muted-foreground">
              When enabled, this role inherits the recruitment-level eligibility and no custom
              overrides are applied here.
            </div>
          </div>
        </label>

        {value.useRecruitmentDefaults ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
            <div className="text-sm font-medium">Inherited from recruitment defaults</div>

            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              Turn this off to override institutes, degrees, branches, batches, CGPA, backlogs,
              relocation and notes for this specific role.
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Institute / Degree / Branch</div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Built directly from the shared institute hierarchy.
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {selectedInstitutes.length} institute(s)
                  </div>
                </div>

                <div className="mt-4 max-h-[520px] space-y-4 overflow-y-auto pr-1">
                  {instituteEntries.map(([institute, degrees]) => {
                    const instituteChecked = selectedInstitutes.includes(institute);

                    return (
                      <div key={institute} className="rounded-xl border border-border p-4">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            disabled={readOnly}
                            checked={instituteChecked}
                            onChange={(e) => toggleInstitute(institute, e.target.checked)}
                          />

                          <div>
                            <div className="font-medium">{institute}</div>

                            <div className="mt-1 text-xs text-muted-foreground">
                              Toggle the institute first, then narrow by degree and branch.
                            </div>
                          </div>
                        </label>

                        {instituteChecked ? (
                          <div className="mt-4 space-y-3">
                            {Object.entries(degrees).map(([degree, branches]) => {
                              const degreeChecked = selectedDegrees.includes(degree);

                              return (
                                <div
                                  key={degree}
                                  className="rounded-xl border border-dashed border-border p-4"
                                >
                                  <label className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      disabled={readOnly}
                                      checked={degreeChecked}
                                      onChange={(e) =>
                                        toggleDegree(institute, degree, e.target.checked)
                                      }
                                    />

                                    <div>
                                      <div className="font-medium">{degree}</div>

                                      <div className="mt-1 text-xs text-muted-foreground">
                                        Select the degree to reveal its branch list.
                                      </div>
                                    </div>
                                  </label>

                                  {degreeChecked ? (
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                      {branches.map((branch) => {
                                        const branchChecked = selectedBranches.includes(branch);

                                        return (
                                          <label
                                            key={branch}
                                            className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                          >
                                            <input
                                              type="checkbox"
                                              disabled={readOnly}
                                              checked={branchChecked}
                                              onChange={(e) =>
                                                toggleBranch(branch, e.target.checked)
                                              }
                                            />

                                            <span>{branch}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="font-medium">Passing Out Batches</div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    Add the batch years that remain eligible for this role.
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedBatches.length ? (
                      selectedBatches.map((batch) => (
                        <span
                          key={batch}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm"
                        >
                          {batch}

                          {!readOnly ? (
                            <button
                              type="button"
                              onClick={() => removeBatch(batch)}
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                              aria-label={`Remove batch ${batch}`}
                            >
                              ×
                            </button>
                          ) : null}
                        </span>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No batches added yet.</div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="2026"
                      value={batchInput}
                      disabled={readOnly}
                      onChange={(e) => setBatchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addBatch();
                        }
                      }}
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                    />

                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={addBatch}
                      className="rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Minimum CGPA</label>

                      <input
                        type="number"
                        step="0.01"
                        value={value.minimum_cgpa}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateField(
                            "minimum_cgpa",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Maximum Backlogs</label>

                      <input
                        type="number"
                        value={value.maximum_active_backlogs}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateField(
                            "maximum_active_backlogs",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                      />
                    </div>
                  </div>

                  <label className="mt-4 flex items-start gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={value.willing_to_relocate_required}
                      onChange={(e) =>
                        pushValue({
                          ...value,
                          willing_to_relocate_required: e.target.checked,
                        })
                      }
                    />

                    <span>Willing to relocate is required</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <label className="mb-2 block text-sm font-medium">Additional Requirements</label>

              <textarea
                rows={4}
                value={value.additional_requirements}
                disabled={readOnly}
                onChange={(e) => updateField("additional_requirements", e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                placeholder="Any extra notes or constraints for this role."
              />
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">Current selection summary</div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    This summary is kept in local state only and will later be serialized during
                    publish.
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {selectedDegrees.length} degree(s) · {selectedBranches.length} branch(es)
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedInstitutes.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-background px-3 py-1 text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}

                {!selectedInstitutes.length ? (
                  <span className="text-sm text-muted-foreground">
                    No institute selected yet.
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}