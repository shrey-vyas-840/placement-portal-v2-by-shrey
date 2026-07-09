import { useEffect, useMemo, useRef, useState } from "react";
import { RecruitmentQuestionBuilder, type RecruitmentQuestion } from "./RecruitmentQuestionBuilder";
import { RecruitmentEligibilityBuilder } from "./RecruitmentEligibilityBuilder";
import { RecruitmentDocumentsBuilder } from "./RecruitmentDocumentsBuilder";
import { RecruitmentTimelineBuilder } from "./RecruitmentTimelineBuilder";
import { createEmptyRecruitmentRoleEligibility } from "./recruitmentEligibilityDefaults";
import type { RecruitmentRoleEligibility } from "./RecruitmentEligibilityBuilder";
import type { Dispatch, SetStateAction } from "react";
import { validateRecruitmentRole } from "./recruitmentRoleValidation";
import { generateUuid } from "@/lib/generateUuid";

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

  inheritDefaultEligibility: boolean;

  eligibility: RecruitmentRoleEligibility;

  inheritDefaultQuestions: boolean;

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

export type RecruitmentRoleDocument = {
  id: string;

  document_name: string;

  description: string;

  required: boolean;
};

export type RecruitmentRoleTimeline = {
  id: string;

  stage: string;

  date: string;

  description: string;
};

const ROLE_SECTIONS = [
  {
    id: "basic",
    label: "Basic Info",
  },
  {
    id: "compensation",
    label: "Compensation",
  },
  {
    id: "hiring",
    label: "Hiring",
  },
  {
    id: "eligibility",
    label: "Eligibility",
  },
  {
    id: "questions",
    label: "Questions",
  },
  {
    id: "documents",
    label: "Documents",
  },
  {
    id: "timeline",
    label: "Timeline",
  },
] as const;

type RoleSection = (typeof ROLE_SECTIONS)[number]["id"];

interface RecruitmentRoleBuilderProps {
  roles: RecruitmentRole[];

  onChange: Dispatch<SetStateAction<RecruitmentRole[]>>;
  defaultEligibility: RecruitmentRoleEligibility;

  defaultQuestions: RecruitmentQuestion[];
  readOnly?: boolean;

  loading?: boolean;

  allowSave?: boolean;

  saving?: boolean;

  onSave?: () => Promise<void>;
}

function createEmptyRole(): RecruitmentRole {
  return {
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

    eligibility: createEmptyRecruitmentRoleEligibility(),

    inheritDefaultQuestions: true,

    questions: [],

    documents: [],

    timeline: [],
  };
}

export function RecruitmentRoleBuilder({
  roles,
  onChange,
  defaultEligibility,
  defaultQuestions,
  readOnly = false,
  loading = false,
  allowSave = false,
  saving = false,
  onSave,
}: RecruitmentRoleBuilderProps) {
  const [expandedRole, setExpandedRole] = useState(0);

  const [activeSections, setActiveSections] = useState<Record<string, RoleSection>>({});

  function toggleRole(index: number) {
    setExpandedRole((current) => (current === index ? -1 : index));
  }

  function getActiveSection(roleId: string) {
    return activeSections[roleId] ?? "basic";
  }

  function setActiveSection(roleId: string, section: RoleSection) {
    setActiveSections((previous) => ({
      ...previous,
      [roleId]: section,
    }));
  }

  function goToPreviousSection(roleId: string) {
    const current = getActiveSection(roleId);

    const index = ROLE_SECTIONS.findIndex((s) => s.id === current);

    if (index > 0) {
      setActiveSection(roleId, ROLE_SECTIONS[index - 1].id);
    }
  }

  function goToNextSection(roleId: string) {
    const current = getActiveSection(roleId);

    const index = ROLE_SECTIONS.findIndex((s) => s.id === current);

    if (index < ROLE_SECTIONS.length - 1) {
      setActiveSection(roleId, ROLE_SECTIONS[index + 1].id);
    }
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

  function updateQuestions(index: number, updater: React.SetStateAction<RecruitmentQuestion[]>) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      const currentQuestions = copy[index].questions;

      copy[index] = {
        ...copy[index],
        questions:
          typeof updater === "function"
            ? (updater as (previous: RecruitmentQuestion[]) => RecruitmentQuestion[])(
                currentQuestions,
              )
            : updater,
      };

      return copy;
    });
  }

  function updateDocuments(
    index: number,
    updater: React.SetStateAction<RecruitmentRoleDocument[]>,
  ) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      const currentDocuments = copy[index].documents;

      copy[index] = {
        ...copy[index],
        documents:
          typeof updater === "function"
            ? (updater as (previous: RecruitmentRoleDocument[]) => RecruitmentRoleDocument[])(
                currentDocuments,
              )
            : updater,
      };

      return copy;
    });
  }

  function updateTimeline(index: number, updater: React.SetStateAction<RecruitmentRoleTimeline[]>) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      const currentTimeline = copy[index].timeline;

      copy[index] = {
        ...copy[index],
        timeline:
          typeof updater === "function"
            ? (updater as (previous: RecruitmentRoleTimeline[]) => RecruitmentRoleTimeline[])(
                currentTimeline,
              )
            : updater,
      };

      return copy;
    });
  }

  function setEligibilityInheritance(index: number, inherit: boolean) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      const role = copy[index];

      copy[index] = {
        ...role,

        inheritDefaultEligibility: inherit,

        eligibility: inherit ? role.eligibility : structuredClone(defaultEligibility),
      };

      return copy;
    });
  }

  function duplicateRole(index: number) {
    if (readOnly) return;

    onChange((previous) => {
      const source = previous[index];

      const duplicate: RecruitmentRole = {
        ...structuredClone(source),

        role_id: generateUuid(),

        role_name: source.role_name.trim() === "" ? "" : `${source.role_name} Copy`,

        status: "Draft",

        questions: source.questions.map((question) => ({
          ...structuredClone(question),
          question_id: generateUuid(),
        })),

        documents: source.documents.map((document) => ({
          ...structuredClone(document),
          id: generateUuid(),
        })),

        timeline: source.timeline.map((stage) => ({
          ...structuredClone(stage),
          id: generateUuid(),
        })),
      };

      queueMicrotask(() => {
        setExpandedRole(index + 1);
      });

      const copy = [...previous];

      copy.splice(index + 1, 0, duplicate);

      return copy;
    });
  }

  function deleteRole(index: number) {
    if (readOnly) return;

    if (roles.length <= 1) {
      window.alert("At least one job role is required.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${roles[index].role_name || `Role ${index + 1}`}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    onChange((previous) => previous.filter((_, roleIndex) => roleIndex !== index));

    queueMicrotask(() => {
      setExpandedRole((current) => {
        if (current > index) {
          return current - 1;
        }

        if (current === index) {
          return Math.max(0, index - 1);
        }

        return current;
      });
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
                onClick={() => {
                  onChange((previous) => {
                    const next = [...previous, createEmptyRole()];

                    queueMicrotask(() => {
                      setExpandedRole(next.length - 1);
                    });

                    return next;
                  });
                }}
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
            const validation = validateRecruitmentRole(role, defaultQuestions);

            const derivedStatus: RecruitmentRole["status"] = validation.valid ? "Ready" : "Draft";

            const isExpanded = expandedRole === index;

            const activeSection = getActiveSection(role.role_id);

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
                          derivedStatus === "Ready"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {derivedStatus}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      {role.employment_type} • {role.work_mode}
                    </div>

                    {validation.issues.length > 0 && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                          Validation
                        </div>

                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                          {validation.issues.slice(0, 5).map((issue, issueIndex) => (
                            <li key={`${issue.section}-${issueIndex}`}>{issue.message}</li>
                          ))}
                        </ul>

                        {validation.issues.length > 5 && (
                          <div className="mt-2 text-xs text-amber-700">
                            + {validation.issues.length - 5} more issue(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRole(index)}
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
                      >
                        {isExpanded ? "Collapse" : "Edit"}
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateRole(index)}
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteRole(index)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 p-6">
                    <div className="mb-6 rounded-xl border border-border bg-background p-2">
                      <div className="grid grid-cols-7 gap-2">
                        {ROLE_SECTIONS.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSection(role.role_id, section.id)}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                              activeSection === section.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            {section.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeSection === "basic" && (
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
                            <label className="mb-2 block text-sm font-medium">
                              Role Description
                            </label>

                            <textarea
                              disabled={readOnly}
                              rows={5}
                              className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                              placeholder="Describe responsibilities, expectations and technologies."
                              value={role.role_description}
                              onChange={(e) =>
                                updateRole(index, "role_description", e.target.value)
                              }
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
                    )}

                    {activeSection === "compensation" && (
                      <div className="mt-5 rounded-xl border border-border bg-background">
                        <div className="border-b border-border px-5 py-4">
                          <div className="font-medium">Compensation</div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            Configure the exact package offered for this role.
                          </div>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Fixed CTC (LPA)
                            </label>

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
                                      fixed_ctc:
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
                    )}

                    {activeSection === "hiring" && (
                      <div className="mt-5 rounded-xl border border-border bg-background">
                        <div className="border-b border-border px-5 py-4">
                          <div className="font-medium">Hiring Details</div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            Configure hiring logistics for this role.
                          </div>
                        </div>

                        <div className="space-y-5 p-5">
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Hiring Locations
                            </label>

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
                    )}
                    {activeSection === "eligibility" && (
                      <>
                        <div className="mb-5 flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 p-4">
                          <div>
                            <div className="font-medium">Eligibility</div>

                            <div className="text-sm text-muted-foreground">
                              Inherit Recruitment Eligibility or override it for this role.
                            </div>
                          </div>

                          {!readOnly && (
                            <div className="flex gap-2">
                              {role.inheritDefaultEligibility ? (
                                <button
                                  type="button"
                                  onClick={() => setEligibilityInheritance(index, false)}
                                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                                >
                                  Override
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEligibilityInheritance(index, true)}
                                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                                >
                                  Revert to Default
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <RecruitmentEligibilityBuilder
                          value={
                            role.inheritDefaultEligibility ? defaultEligibility : role.eligibility
                          }
                          inheritFromRecruitmentDefaults={role.inheritDefaultEligibility}
                          onInheritanceChange={(inherit) =>
                            setEligibilityInheritance(index, inherit)
                          }
                          onChange={(nextEligibility) => {
                            if (role.inheritDefaultEligibility) {
                              setEligibilityInheritance(index, false);

                              queueMicrotask(() => {
                                updateRole(index, "eligibility", nextEligibility);
                              });

                              return;
                            }

                            updateRole(index, "eligibility", nextEligibility);
                          }}
                          readOnly={readOnly}
                        />
                      </>
                    )}

                    {activeSection === "questions" && (
                      <div className="mt-5">
                        <div className="mb-5 flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 p-4">
                          <div>
                            <div className="font-medium">Questions</div>

                            <div className="text-sm text-muted-foreground">
                              {role.inheritDefaultQuestions
                                ? "This role will use Recruitment Default Questions and any additional questions configured below."
                                : "This role will use only the role-specific questions configured below."}
                            </div>
                          </div>

                          {!readOnly && (
                            <div className="flex gap-2">
                              <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-2">
                                <input
                                  type="checkbox"
                                  disabled={readOnly}
                                  checked={role.inheritDefaultQuestions}
                                  onChange={(e) =>
                                    updateRole(index, "inheritDefaultQuestions", e.target.checked)
                                  }
                                />

                                <div>
                                  <div className="text-sm font-medium">
                                    Inherit Recruitment Default Questions
                                  </div>

                                  <div className="text-xs text-muted-foreground">
                                    When enabled, students will answer the recruitment default
                                    questions plus the additional role-specific questions below.
                                  </div>
                                </div>
                              </label>
                            </div>
                          )}
                        </div>

                        {role.inheritDefaultQuestions && (
                          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <div className="font-medium text-blue-900">
                              Recruitment Default Questions
                            </div>

                            <div className="mt-1 text-sm text-blue-700">
                              These questions are inherited automatically. Add only the additional
                              questions required specifically for this role below.
                            </div>

                            <div className="mt-4 space-y-2">
                              {defaultQuestions.map((question) => (
                                <div
                                  key={question.question_id}
                                  className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm"
                                >
                                  {question.question_title}
                                </div>
                              ))}

                              {defaultQuestions.length === 0 && (
                                <div className="text-sm italic text-blue-700">
                                  No recruitment default questions have been configured.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {!role.inheritDefaultQuestions && (
                          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <div className="font-medium text-amber-900">
                              Recruitment Default Questions Disabled
                            </div>

                            <div className="mt-1 text-sm text-amber-700">
                              Students applying for this role will answer <strong>only</strong> the
                              questions configured below. Recruitment default questions will not be
                              included.
                            </div>
                          </div>
                        )}

                        {role.inheritDefaultQuestions &&
                          role.questions.some((roleQuestion) =>
                            defaultQuestions.some(
                              (defaultQuestion) =>
                                defaultQuestion.question_title.trim().toLowerCase() ===
                                roleQuestion.question_title.trim().toLowerCase(),
                            ),
                          ) && (
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                              <div className="font-medium text-amber-800">
                                Duplicate Question Detected
                              </div>

                              <div className="mt-1 text-sm text-amber-700">
                                One or more additional role questions already exist in the
                                Recruitment Default Questions. Students will answer duplicate
                                questions unless you remove or rename them.
                              </div>
                            </div>
                          )}

                        <RecruitmentQuestionBuilder
                          title="Additional Role Questions"
                          subtitle={
                            role.inheritDefaultQuestions
                              ? "Configure only additional questions for this role. Recruitment default questions are inherited automatically."
                              : "Configure all questions required for this role. Recruitment defaults will not be included."
                          }

                          questions={role.questions}

                          onChange={(updater) => {
                            updateQuestions(index, updater);
                          }}
                          readOnly={readOnly}
                        />
                      </div>
                    )}

                    {activeSection === "documents" && (
                      <div className="mt-5">
                        <RecruitmentDocumentsBuilder
                          documents={role.documents}
                          onChange={(updater) => updateDocuments(index, updater)}
                          readOnly={readOnly}
                        />
                      </div>
                    )}

                    {activeSection === "timeline" && (
                      <div className="mt-5">
                        <RecruitmentTimelineBuilder
                          timeline={role.timeline}
                          onChange={(updater) => updateTimeline(index, updater)}
                          readOnly={readOnly}
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 mb-3 p-5 flex items-center justify-between border-t border-border pt-5">
                  <button
                    type="button"
                    disabled={activeSection === ROLE_SECTIONS[0].id}
                    onClick={() => goToPreviousSection(role.role_id)}
                    className="rounded-xl border border-border px-5 py-2 transition hover:bg-gray-200"
                  >
                    ← Previous Section
                  </button>

                  <div className="text-sm text-muted-foreground">
                    {ROLE_SECTIONS.findIndex((s) => s.id === activeSection) + 1}
                    {" / "}
                    {ROLE_SECTIONS.length}
                  </div>

                  <button
                    type="button"
                    disabled={activeSection === ROLE_SECTIONS[ROLE_SECTIONS.length - 1].id}
                    onClick={() => goToNextSection(role.role_id)}
                    className="rounded-xl border border-border px-5 py-2 disabled:opacity-40 transition hover:bg-green-200"
                  >
                    Next Section →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
