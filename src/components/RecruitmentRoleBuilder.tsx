import { useEffect, useMemo, useRef, useState } from "react";
import type { RecruitmentQuestion } from "./RecruitmentQuestionBuilder";
import type { Dispatch, SetStateAction } from "react";

export type RecruitmentRole = {
  role_id: string;

  role_name: string;

  employment_type: "Full Time" | "Internship" | "Intern + PPO";

  work_mode: "Onsite" | "Hybrid" | "Remote";

  role_description: string;

  openings: number | "";

  status: "Draft" | "Ready";

  compensation: RecruitmentRoleCompensation;

  hiring: RecruitmentRoleHiring;

  eligibility: RecruitmentRoleEligibility;

  questions: RecruitmentQuestion[];

  documents: RecruitmentRoleDocument[];

  timeline: RecruitmentRoleTimeline[];
};

export type RecruitmentRoleCompensation = {
  currency: "INR";

  fixed_ctc: number | "";

  variable_ctc: number | "";

  joining_bonus: number | "";

  retention_bonus: number | "";

  internship_stipend: number | "";

  ppo_package: number | "";
};

export type RecruitmentRoleHiring = {
  locations: string[];

  expected_joining_date: string;

  department: string;

  travel_required: boolean;

  shift_details: string;
};

export type RecruitmentRoleEligibility = {
  useRecruitmentDefaults: boolean;
};

export type RecruitmentRoleDocument = {
  id: string;

  title: string;

  url: string;

  required: boolean;
};

export type RecruitmentRoleTimeline = {
  id: string;

  stage: string;

  date: string;
};

interface RecruitmentRoleBuilderProps {
  roles: RecruitmentRole[];

  onChange: Dispatch<SetStateAction<RecruitmentRole[]>>;

  readOnly?: boolean;

  loading?: boolean;

  allowSave?: boolean;

  saving?: boolean;

  onSave?: () => Promise<void>;
}

function createEmptyRole(): RecruitmentRole {
  return {
    role_id: crypto.randomUUID(),

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

    eligibility: {
      useRecruitmentDefaults: true,
    },

    questions: [],

    documents: [],

    timeline: [],
  };
}

export function RecruitmentRoleBuilder({
  roles,
  onChange,
  readOnly = false,
  loading = false,
  allowSave = false,
  saving = false,
  onSave,
}: RecruitmentRoleBuilderProps) {
  const [expandedRoles, setExpandedRoles] = useState<Record<number, boolean>>({
    0: true,
  });

  function toggleRole(index: number) {
    setExpandedRoles((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  }

  function updateRole(index: number, field: keyof RecruitmentRole, value: any) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      copy[index] = {
        ...copy[index],
        [field]: value,
      };

      return copy;
    });
  }

  function updateCompensation(index: number, field: keyof RecruitmentRoleCompensation, value: any) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      copy[index] = {
        ...copy[index],
        compensation: {
          ...copy[index].compensation,
          [field]: value,
        },
      };

      return copy;
    });
  }

  function updateHiring(index: number, field: keyof RecruitmentRoleHiring, value: any) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      copy[index] = {
        ...copy[index],
        hiring: {
          ...copy[index].hiring,
          [field]: value,
        },
      };

      return copy;
    });
  }

  function updateEligibility(index: number, field: keyof RecruitmentRoleEligibility, value: any) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      copy[index] = {
        ...copy[index],
        eligibility: {
          ...copy[index].eligibility,
          [field]: value,
        },
      };

      return copy;
    });
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="text-sm text-muted-foreground">Loading job roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Job Roles</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Create one or more roles for this recruitment.
            </p>
          </div>

          {!readOnly && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onChange((previous) => [...previous, createEmptyRole()])}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                + Add Job Role
              </button>

              {allowSave && onSave && (
                <button
                  type="button"
                  disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Roles"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {!roles.length ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <div className="text-5xl">💼</div>

          <h3 className="mt-4 text-xl font-semibold">No job roles added yet</h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Every published opportunity is generated from a job role.
          </p>

          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange(() => [createEmptyRole()])}
              className="mt-6 rounded-xl border border-dashed border-border bg-background px-5 py-3 text-sm font-medium hover:bg-muted"
            >
              + Create First Job Role
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role, index) => {
            const isExpanded =
              expandedRoles[index] ?? (Object.keys(expandedRoles).length === 0 && index === 0);

            return (
              <div
                key={role.role_id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="flex items-start justify-between p-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        Role {index + 1}
                      </div>

                      <div className="text-base font-semibold">
                        {role.role_name.trim() !== "" ? role.role_name : "Untitled Role"}
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-[11px] ${
                          role.status === "Ready"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {role.status}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      {role.employment_type} • {role.work_mode}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRole(index)}
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
                      >
                        {isExpanded ? "▲ Collapse Role" : "▼ Edit Role"}
                      </button>

                      <button
                        type="button"
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 px-6 py-5">
                    <div className="rounded-xl border border-border bg-background">
                      <div className="border-b border-border px-5 py-4">
                        <div className="font-medium">Basic Information</div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Configure the primary details of this job role.
                        </div>
                      </div>

                      <div className="space-y-5 p-5">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Role Name</label>

                          <input
                            disabled={readOnly}
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            placeholder="Software Engineer"
                            value={role.role_name}
                            onChange={(e) => updateRole(index, "role_name", e.target.value)}
                          />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Employment Type
                            </label>

                            <select
                              disabled={readOnly}
                              className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                              value={role.employment_type}
                              onChange={(e) =>
                                updateRole(
                                  index,
                                  "employment_type",
                                  e.target.value as RecruitmentRole["employment_type"],
                                )
                              }
                            >
                              <option>Full Time</option>
                              <option>Internship</option>
                              <option>Intern + PPO</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium">Work Mode</label>

                            <select
                              disabled={readOnly}
                              className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                              value={role.work_mode}
                              onChange={(e) =>
                                updateRole(
                                  index,
                                  "work_mode",
                                  e.target.value as RecruitmentRole["work_mode"],
                                )
                              }
                            >
                              <option>Onsite</option>
                              <option>Hybrid</option>
                              <option>Remote</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Role Description</label>

                          <textarea
                            disabled={readOnly}
                            rows={5}
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            placeholder="Describe responsibilities, expectations and technologies."
                            value={role.role_description}
                            onChange={(e) => updateRole(index, "role_description", e.target.value)}
                          />
                        </div>

                        <div className="max-w-sm">
                          <label className="mb-2 block text-sm font-medium">
                            Expected Openings
                          </label>

                          <input
                            disabled={readOnly}
                            type="number"
                            min={1}
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            placeholder="10"
                            value={role.openings}
                            onChange={(e) =>
                              updateRole(
                                index,
                                "openings",
                                e.target.value === "" ? "" : Number(e.target.value),
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-border bg-background">
                      <div className="border-b border-border px-5 py-4">
                        <div className="font-medium">Compensation</div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Configure the exact package offered for this role.
                        </div>
                      </div>

                      <div className="grid gap-5 p-5 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Fixed CTC (LPA)</label>

                          <input
                            disabled={readOnly}
                            type="number"
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            value={role.compensation.fixed_ctc}
                            onChange={(e) =>
                              onChange((previous) => {
                                const copy = [...previous];

                                copy[index] = {
                                  ...copy[index],
                                  compensation: {
                                    ...copy[index].compensation,
                                    fixed_ctc: e.target.value === "" ? "" : Number(e.target.value),
                                  },
                                };

                                return copy;
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Variable CTC (LPA)
                          </label>

                          <input
                            disabled={readOnly}
                            type="number"
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            value={role.compensation.variable_ctc}
                            onChange={(e) =>
                              onChange((previous) => {
                                const copy = [...previous];

                                copy[index] = {
                                  ...copy[index],
                                  compensation: {
                                    ...copy[index].compensation,
                                    variable_ctc:
                                      e.target.value === "" ? "" : Number(e.target.value),
                                  },
                                };

                                return copy;
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Joining Bonus (₹)
                          </label>

                          <input
                            disabled={readOnly}
                            type="number"
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            value={role.compensation.joining_bonus}
                            onChange={(e) =>
                              onChange((previous) => {
                                const copy = [...previous];

                                copy[index] = {
                                  ...copy[index],
                                  compensation: {
                                    ...copy[index].compensation,
                                    joining_bonus:
                                      e.target.value === "" ? "" : Number(e.target.value),
                                  },
                                };

                                return copy;
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Retention Bonus (₹)
                          </label>

                          <input
                            disabled={readOnly}
                            type="number"
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            value={role.compensation.retention_bonus}
                            onChange={(e) =>
                              onChange((previous) => {
                                const copy = [...previous];

                                copy[index] = {
                                  ...copy[index],
                                  compensation: {
                                    ...copy[index].compensation,
                                    retention_bonus:
                                      e.target.value === "" ? "" : Number(e.target.value),
                                  },
                                };

                                return copy;
                              })
                            }
                          />
                        </div>

                        {role.employment_type !== "Full Time" && (
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Internship Stipend (₹ / Month)
                            </label>

                            <input
                              disabled={readOnly}
                              type="number"
                              className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                              value={role.compensation.internship_stipend}
                              onChange={(e) =>
                                onChange((previous) => {
                                  const copy = [...previous];

                                  copy[index] = {
                                    ...copy[index],
                                    compensation: {
                                      ...copy[index].compensation,
                                      internship_stipend:
                                        e.target.value === "" ? "" : Number(e.target.value),
                                    },
                                  };

                                  return copy;
                                })
                              }
                            />
                          </div>
                        )}

                        {role.employment_type === "Intern + PPO" && (
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              PPO Package (LPA)
                            </label>

                            <input
                              disabled={readOnly}
                              type="number"
                              className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                              value={role.compensation.ppo_package}
                              onChange={(e) =>
                                onChange((previous) => {
                                  const copy = [...previous];

                                  copy[index] = {
                                    ...copy[index],
                                    compensation: {
                                      ...copy[index].compensation,
                                      ppo_package:
                                        e.target.value === "" ? "" : Number(e.target.value),
                                    },
                                  };

                                  return copy;
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-border bg-background">
                      <div className="border-b border-border px-5 py-4">
                        <div className="font-medium">Hiring Details</div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Configure hiring logistics for this role.
                        </div>
                      </div>

                      <div className="space-y-5 p-5">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Hiring Locations</label>

                          <input
                            disabled={readOnly}
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            placeholder="Ahmedabad, Bangalore, Pune"
                            value={role.hiring.locations.join(", ")}
                            onChange={(e) =>
                              onChange((previous) => {
                                const copy = [...previous];

                                copy[index] = {
                                  ...copy[index],
                                  hiring: {
                                    ...copy[index].hiring,
                                    locations: e.target.value
                                      .split(",")
                                      .map((location) => location.trim())
                                      .filter(Boolean),
                                  },
                                };

                                return copy;
                              })
                            }
                          />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Expected Joining Date
                            </label>

                            <input
                              disabled={readOnly}
                              type="date"
                              className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                              value={role.hiring.expected_joining_date}
                              onChange={(e) =>
                                onChange((previous) => {
                                  const copy = [...previous];

                                  copy[index] = {
                                    ...copy[index],
                                    hiring: {
                                      ...copy[index].hiring,
                                      expected_joining_date: e.target.value,
                                    },
                                  };

                                  return copy;
                                })
                              }
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium">Department</label>

                            <input
                              disabled={readOnly}
                              className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                              placeholder="Engineering"
                              value={role.hiring.department}
                              onChange={(e) =>
                                onChange((previous) => {
                                  const copy = [...previous];

                                  copy[index] = {
                                    ...copy[index],
                                    hiring: {
                                      ...copy[index].hiring,
                                      department: e.target.value,
                                    },
                                  };

                                  return copy;
                                })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Shift Details</label>

                          <input
                            disabled={readOnly}
                            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                            placeholder="General Shift / Rotational Shift"
                            value={role.hiring.shift_details}
                            onChange={(e) =>
                              onChange((previous) => {
                                const copy = [...previous];

                                copy[index] = {
                                  ...copy[index],
                                  hiring: {
                                    ...copy[index].hiring,
                                    shift_details: e.target.value,
                                  },
                                };

                                return copy;
                              })
                            }
                          />
                        </div>

                        <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                          <input
                            disabled={readOnly}
                            type="checkbox"
                            checked={role.hiring.travel_required}
                            onChange={(e) =>
                              onChange((previous) => {
                                const copy = [...previous];

                                copy[index] = {
                                  ...copy[index],
                                  hiring: {
                                    ...copy[index].hiring,
                                    travel_required: e.target.checked,
                                  },
                                };

                                return copy;
                              })
                            }
                          />
                          Travel Required
                        </label>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-border bg-background">
                      <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center justify-between">
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
                            checked={role.eligibility.useRecruitmentDefaults}
                            onChange={(e) =>
                              updateEligibility(index, "useRecruitmentDefaults", e.target.checked)
                            }
                          />

                          <div>
                            <div className="font-medium">Use Recruitment Default Eligibility</div>

                            <div className="mt-1 text-sm text-muted-foreground">
                              This role will inherit the default eligibility configured for the
                              recruitment.
                            </div>
                          </div>
                        </label>

                        {!role.eligibility.useRecruitmentDefaults && (
                          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                            <div className="text-sm font-medium">Custom Role Eligibility</div>

                            <div className="mt-2 text-sm text-muted-foreground">
                              Existing Eligibility Builder will be mounted here in the next step.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
