import type {
  RecruitmentRole,
  RecruitmentRoleDocument,
  RecruitmentRoleTimeline,
} from "./RecruitmentRoleBuilder";
import type { RecruitmentQuestion } from "./RecruitmentQuestionBuilder";

interface RecruitmentRolePreviewProps {
  role: RecruitmentRole;
  defaultEligibility?: RecruitmentRole["eligibility"];
  defaultQuestions?: RecruitmentQuestion[];
  variant?: "summary" | "full";
  status?: RecruitmentRole["status"];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <div className="font-medium">{title}</div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

function DocumentBadge({ document }: { document: RecruitmentRoleDocument }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <div>
        <div className="font-medium">{document.document_name || "Untitled"}</div>

        {document.description && (
          <div className="mt-1 text-xs text-muted-foreground">{document.description}</div>
        )}
      </div>

      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          document.required ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
        }`}
      >
        {document.required ? "Required" : "Optional"}
      </span>
    </div>
  );
}

function TimelineCard({ stage, index }: { stage: RecruitmentRoleTimeline; index: number }) {
  return (
    <div className="flex gap-4 rounded-lg border border-border p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {index + 1}
      </div>

      <div className="flex-1">
        <div className="font-medium">{stage.stage || "Untitled Stage"}</div>

        <div className="mt-1 text-xs text-muted-foreground">{stage.date || "No date selected"}</div>

        {stage.description && <div className="mt-2 text-sm">{stage.description}</div>}
      </div>
    </div>
  );
}

export function RecruitmentRolePreview({
  role,
  defaultEligibility,
  defaultQuestions = [],
  variant = "full",
  status,
}: RecruitmentRolePreviewProps) {
  const requiredDocuments = role.documents.filter((document) => document.required);

  const optionalDocuments = role.documents.filter((document) => !document.required);

  const effectiveEligibility =
    role.inheritDefaultEligibility && defaultEligibility ? defaultEligibility : role.eligibility;

  const effectiveQuestions = role.inheritDefaultQuestions ? defaultQuestions : role.questions;

  const requiredQuestions = effectiveQuestions.filter((question) => question.is_required);

  const displayStatus = status ?? role.status;

  if (variant === "summary") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{role.role_name || "Untitled Role"}</div>

            <div className="mt-1 flex flex-wrap gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                {role.employment_type}
              </span>

              <span className="rounded-full bg-muted px-3 py-1 text-xs">{role.work_mode}</span>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              displayStatus === "Ready"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {displayStatus}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Questions</div>

            <div className="mt-2 text-xl font-semibold">{effectiveQuestions.length}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Documents</div>

            <div className="mt-2 text-xl font-semibold">{role.documents.length}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Timeline</div>

            <div className="mt-2 text-xl font-semibold">{role.timeline.length}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Openings</div>

            <div className="mt-2 text-xl font-semibold">{role.openings || 0}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Eligibility</div>

            <div className="mt-2 text-sm font-semibold">
              {role.inheritDefaultEligibility ? "Recruitment Default" : "Role Override"}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Questions Source</div>

            <div className="mt-2 text-sm font-semibold">
              {role.inheritDefaultQuestions ? "Recruitment Default" : "Role Override"}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Required Questions</div>

            <div className="mt-2 text-xl font-semibold">{requiredQuestions.length}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Required Documents</div>

            <div className="mt-2 text-xl font-semibold">{requiredDocuments.length}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-semibold">{role.role_name || "Untitled Role"}</h2>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-background px-3 py-1 text-xs font-medium">
                {role.employment_type}
              </span>

              <span className="rounded-full bg-background px-3 py-1 text-xs font-medium">
                {role.work_mode}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  displayStatus === "Ready"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {displayStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-xl font-semibold">{effectiveQuestions.length}</div>

              <div className="text-xs text-muted-foreground">Questions</div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-xl font-semibold">{requiredDocuments.length}</div>

              <div className="text-xs text-muted-foreground">Required Docs</div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-xl font-semibold">{role.timeline.length}</div>

              <div className="text-xs text-muted-foreground">Timeline Stages</div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-xl font-semibold">{role.openings || 0}</div>

              <div className="text-xs text-muted-foreground">Openings</div>
            </div>
          </div>
        </div>

        {role.role_description && (
          <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {role.role_description}
          </p>
        )}
      </div>

      <Section title="Compensation">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Fixed CTC</div>

            <div className="mt-1 font-medium">{role.compensation.fixed_ctc || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Variable CTC</div>

            <div className="mt-1 font-medium">{role.compensation.variable_ctc || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Joining Bonus</div>

            <div className="mt-1 font-medium">{role.compensation.joining_bonus || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Retention Bonus</div>

            <div className="mt-1 font-medium">{role.compensation.retention_bonus || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Internship Stipend</div>

            <div className="mt-1 font-medium">{role.compensation.internship_stipend || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">PPO Package</div>

            <div className="mt-1 font-medium">{role.compensation.ppo_package || "—"}</div>
          </div>
        </div>
      </Section>

      <Section title="Hiring Details">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Department</div>

            <div className="mt-1 font-medium">{role.hiring.department || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Joining Date</div>

            <div className="mt-1 font-medium">{role.hiring.expected_joining_date || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Locations</div>

            <div className="mt-1 font-medium">
              {role.hiring.locations.length ? role.hiring.locations.join(", ") : "—"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Travel Required</div>

            <div className="mt-1 font-medium">{role.hiring.travel_required ? "Yes" : "No"}</div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground">Shift Details</div>

            <div className="mt-1 font-medium">{role.hiring.shift_details || "—"}</div>
          </div>
        </div>
      </Section>
      <Section title="Eligibility Summary">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Eligibility Mode</div>

            <div className="mt-1 font-medium">
              {role.inheritDefaultEligibility
                ? "Inherited from Recruitment Defaults"
                : "Role-specific Override"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Minimum CGPA</div>

            <div className="mt-1 font-medium">
              {effectiveEligibility.minimum_cgpa === "" ? "—" : effectiveEligibility.minimum_cgpa}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Maximum Backlogs</div>

            <div className="mt-1 font-medium">
              {effectiveEligibility.maximum_active_backlogs === ""
                ? "—"
                : effectiveEligibility.maximum_active_backlogs}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Relocation Required</div>

            <div className="mt-1 font-medium">
              {effectiveEligibility.willing_to_relocate_required ? "Yes" : "No"}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground">Additional Requirements</div>

            <div className="mt-1 whitespace-pre-wrap font-medium">
              {effectiveEligibility.additional_requirements || "—"}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Questions">
        <div className="mb-4 flex gap-6 text-sm">
          <span>
            <strong>{effectiveQuestions.length}</strong> Total
          </span>

          <span>
            <strong>{requiredQuestions.length}</strong> Required
          </span>
        </div>

        {effectiveQuestions.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No role specific questions configured.
          </div>
        ) : (
          <div className="space-y-2">
            {effectiveQuestions.map((question, index) => (
              <div
                key={question.question_id ?? `${question.question_title}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <div className="font-medium">
                    {question.question_title || "Untitled Question"}
                  </div>

                  <div className="text-xs text-muted-foreground">{question.question_type}</div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    question.is_required ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {question.is_required ? "Required" : "Optional"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Required Documents">
        {role.documents.length === 0 ? (
          <div className="text-sm text-muted-foreground">No documents configured.</div>
        ) : (
          <div className="space-y-3">
            {requiredDocuments.map((document) => (
              <DocumentBadge key={document.id} document={document} />
            ))}

            {optionalDocuments.length > 0 && (
              <>
                <div className="pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Optional Documents
                </div>

                {optionalDocuments.map((document) => (
                  <DocumentBadge key={document.id} document={document} />
                ))}
              </>
            )}
          </div>
        )}
      </Section>

      <Section title="Recruitment Timeline">
        {role.timeline.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recruitment timeline configured.</div>
        ) : (
          <div className="space-y-3">
            {role.timeline.map((stage, index) => (
              <TimelineCard key={stage.id} stage={stage} index={index} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
