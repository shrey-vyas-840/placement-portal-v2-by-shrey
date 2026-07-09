import { useMemo, useState } from "react";
import Select from "react-select";
import { toast } from "sonner";
import { ELIGIBILITY_MAPPING } from "@/constants/eligibilityMapping";

export type RecruitmentRoleEligibility = {
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
  onChange: React.Dispatch<React.SetStateAction<RecruitmentRoleEligibility>>;

  inheritFromRecruitmentDefaults?: boolean;

  onInheritanceChange?: (inherit: boolean) => void;

  readOnly?: boolean;
}

type EligibilityMapping = Record<string, Record<string, string[]>>;

const eligibilityMapping = ELIGIBILITY_MAPPING as EligibilityMapping;

const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: 50,
    borderRadius: 14,
    borderColor: "#e2e8f0",
    boxShadow: "none",
  }),

  multiValue: (base: any) => ({
    ...base,
    borderRadius: 999,
  }),
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isValidInstitute(institute: string) {
  return Object.prototype.hasOwnProperty.call(ELIGIBILITY_MAPPING, institute);
}

export function RecruitmentEligibilityBuilder({
  value,
  onChange,
  inheritFromRecruitmentDefaults = false,
  onInheritanceChange,
  readOnly = false,
}: RecruitmentEligibilityBuilderProps) {
  const selectedInstitutes = value.allowed_institutes;
  const selectedDegrees = value.allowed_degrees;
  const selectedBranches = value.allowed_branches;
  const selectedBatches = value.passing_out_batches;

  const availableInstitutes = Object.keys(ELIGIBILITY_MAPPING);

  const availableDegrees = unique(
    selectedInstitutes.flatMap((institute) => Object.keys(eligibilityMapping[institute] ?? {})),
  );

  const availableBranches = unique(
    selectedInstitutes.flatMap((institute) =>
      selectedDegrees.flatMap((degree) => eligibilityMapping[institute]?.[degree] ?? []),
    ),
  );

  const availableGraduationYears = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

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
          sanitizedDegrees.some((degree) =>
            (eligibilityMapping[institute] ?? {})[degree]?.includes(branch),
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
            checked={inheritFromRecruitmentDefaults}
            onChange={(e) => onInheritanceChange?.(e.target.checked)}
          />

          <div>
            <div className="font-medium">Inherit Recruitment Eligibility</div>

            <div className="mt-1 text-sm text-muted-foreground">
              When enabled, this role inherits the recruitment-level eligibility and no custom
              overrides are applied here.
            </div>
          </div>
        </label>

        {inheritFromRecruitmentDefaults ? (
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
              <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
                {/* Institutes */}

                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Institutes</div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        Select one or more institutes.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Select
                      isDisabled={readOnly}
                      styles={selectStyles}
                      placeholder="Search institute..."

                      isClearable

                      value={null}

                      options={availableInstitutes
                        .filter((item) => !selectedInstitutes.includes(item))
                        .map((item) => ({
                          value: item,
                          label: item,
                        }))}

                      onChange={(option) => {
                        if (!option) return;

                        pushValue({
                          ...value,
                          allowed_institutes: unique([...selectedInstitutes, option.value]),
                        });
                      }}

                      noOptionsMessage={() =>
                        selectedInstitutes.length === availableInstitutes.length
                          ? "All institutes already selected."
                          : "No institute found."
                      }
                    />{" "}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedInstitutes.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No institute selected.</span>
                    ) : (
                      selectedInstitutes.map((institute) => (
                        <span
                          key={institute}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm"
                        >
                          {institute}

                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                pushValue({
                                  ...value,
                                  allowed_institutes: selectedInstitutes.filter(
                                    (item) => item !== institute,
                                  ),
                                  allowed_degrees: selectedDegrees.filter((degree) => {
                                    const degreeStillAvailable = selectedInstitutes
                                      .filter((item) => item !== institute)
                                      .some((remainingInstitute) =>
                                        Object.keys(
                                          eligibilityMapping[remainingInstitute] ?? {},
                                        ).includes(degree),
                                      );

                                    return degreeStillAvailable;
                                  }),
                                  allowed_branches: selectedBranches.filter((branch) => {
                                    const remainingInstitutes = selectedInstitutes.filter(
                                      (item) => item !== institute,
                                    );

                                    return remainingInstitutes.some((remainingInstitute) =>
                                      selectedDegrees.some((degree) =>
                                        (eligibilityMapping[remainingInstitute] ?? {})[
                                          degree
                                        ]?.includes(branch),
                                      ),
                                    );
                                  }),
                                })
                              }
                              className="rounded-full p-0.5 text-xs font-semibold transition-colors hover:bg-muted"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Degrees</div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Select one or more degrees from the selected institutes.
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Select
                    isDisabled={readOnly || !selectedInstitutes.length}
                    styles={selectStyles}
                    placeholder="Search degree..."

                    isClearable

                    value={null}

                    options={availableDegrees
                      .filter((degree) => !selectedDegrees.includes(degree))
                      .map((degree) => ({
                        value: degree,
                        label: degree,
                      }))}

                    onChange={(option) => {
                      if (!option) return;

                      if (!selectedInstitutes.length) {
                        toast.warning("Select at least one institute first.");
                        return;
                      }

                      pushValue({
                        ...value,
                        allowed_degrees: unique([...selectedDegrees, option.value]),
                      });
                    }}

                    noOptionsMessage={() =>
                      !selectedInstitutes.length
                        ? "Select institute first."
                        : availableDegrees.length === selectedDegrees.length
                          ? "All degrees already selected."
                          : "No degree found."
                    }
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedDegrees.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No degree selected.</span>
                  ) : (
                    selectedDegrees.map((degree) => (
                      <span
                        key={degree}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm"
                      >
                        {degree}

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              pushValue({
                                ...value,
                                allowed_degrees: selectedDegrees.filter((item) => item !== degree),
                                allowed_branches: selectedBranches.filter((branch) =>
                                  selectedInstitutes.some((institute) =>
                                    selectedDegrees
                                      .filter((item) => item !== degree)
                                      .some((remainingDegree) =>
                                        (eligibilityMapping[institute] ?? {})[
                                          remainingDegree
                                        ]?.includes(branch),
                                      ),
                                  ),
                                ),
                              })
                            }
                            className="rounded-full p-0.5 text-xs font-semibold transition-colors hover:bg-muted"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Branches</div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Select one or more branches from the selected degree(s).
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Select
                    isDisabled={readOnly || !selectedInstitutes.length || !selectedDegrees.length}

                    styles={selectStyles}

                    placeholder="Search branch..."

                    isClearable

                    value={null}

                    options={availableBranches
                      .filter((branch) => !selectedBranches.includes(branch))
                      .map((branch) => ({
                        value: branch,
                        label: branch,
                      }))}

                    onChange={(option) => {
                      if (!option) return;

                      if (!selectedInstitutes.length) {
                        toast.warning("Select at least one institute first.");
                        return;
                      }

                      if (!selectedDegrees.length) {
                        toast.warning("Select at least one degree first.");
                        return;
                      }

                      pushValue({
                        ...value,
                        allowed_branches: unique([...selectedBranches, option.value]),
                      });
                    }}

                    noOptionsMessage={() => {
                      if (!selectedInstitutes.length) {
                        return "Select institute first.";
                      }

                      if (!selectedDegrees.length) {
                        return "Select degree first.";
                      }

                      if (availableBranches.length === selectedBranches.length) {
                        return "All branches already selected.";
                      }

                      return "No branch found.";
                    }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedBranches.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No branch selected.</span>
                  ) : (
                    selectedBranches.map((branch) => (
                      <span
                        key={branch}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm"
                      >
                        {branch}

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              pushValue({
                                ...value,
                                allowed_branches: selectedBranches.filter(
                                  (item) => item !== branch,
                                ),
                              })
                            }
                            className="rounded-full p-0.5 text-xs font-semibold transition-colors hover:bg-muted"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Passing Out Batches</div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        Select one or more graduation years.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Select
                      isDisabled={readOnly}
                      styles={selectStyles}
                      placeholder="Search graduation year..."

                      isClearable

                      value={null}

                      options={availableGraduationYears
                        .filter((year) => !selectedBatches.includes(year))
                        .map((year) => ({
                          value: year,
                          label: year,
                        }))}

                      onChange={(option) => {
                        if (!option) return;

                        pushValue({
                          ...value,
                          passing_out_batches: unique([...selectedBatches, option.value]),
                        });
                      }}

                      noOptionsMessage={() =>
                        availableGraduationYears.length === selectedBatches.length
                          ? "All graduation years selected."
                          : "No graduation year found."
                      }
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedBatches.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        No graduation year selected.
                      </span>
                    ) : (
                      selectedBatches.map((year) => (
                        <span
                          key={year}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm"
                        >
                          {year}

                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                pushValue({
                                  ...value,
                                  passing_out_batches: selectedBatches.filter(
                                    (item) => item !== year,
                                  ),
                                })
                              }
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))
                    )}
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
                  <span className="text-sm text-muted-foreground">No institute selected yet.</span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
