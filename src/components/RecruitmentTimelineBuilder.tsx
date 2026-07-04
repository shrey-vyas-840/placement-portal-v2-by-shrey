import { useMemo } from "react";

export type RecruitmentRoleTimeline = {
  id: string;
  stage: string;
  date: string;
  description: string;
};

interface RecruitmentTimelineBuilderProps {
  timeline: RecruitmentRoleTimeline[];
  onChange: React.Dispatch<React.SetStateAction<RecruitmentRoleTimeline[]>>;
  readOnly?: boolean;
  loading?: boolean;
}

const DEFAULT_STAGES = [
  "Application Opens",
  "Application Deadline",
  "Shortlisting",
  "Online Assessment",
  "Technical Interview",
  "HR Interview",
  "Final Result",
  "Offer Release",
  "Joining",
] as const;

function createTimelineStage(
  overrides?: Partial<RecruitmentRoleTimeline>,
): RecruitmentRoleTimeline {
  return {
    id: crypto.randomUUID(),
    stage: "",
    date: "",
    description: "",
    ...overrides,
  };
}

export function RecruitmentTimelineBuilder({
  timeline,
  onChange,
  readOnly = false,
  loading = false,
}: RecruitmentTimelineBuilderProps) {
  const totalConfigured = useMemo(
    () =>
      timeline.filter(
        (item) =>
          item.stage.trim() !== "" ||
          item.date.trim() !== "" ||
          item.description.trim() !== "",
      ).length,
    [timeline],
  );

  function updateStage(
    id: string,
    field: keyof RecruitmentRoleTimeline,
    value: RecruitmentRoleTimeline[keyof RecruitmentRoleTimeline],
  ) {
    onChange((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addStage() {
    onChange((previous) => [...previous, createTimelineStage()]);
  }

  function duplicateStage(id: string) {
    onChange((previous) => {
      const stage = previous.find((item) => item.id === id);

      if (!stage) return previous;

      const duplicate = createTimelineStage({
        stage: `${stage.stage} Copy`,
        date: stage.date,
        description: stage.description,
      });

      const index = previous.findIndex((item) => item.id === id);

      return [
        ...previous.slice(0, index + 1),
        duplicate,
        ...previous.slice(index + 1),
      ];
    });
  }

  function deleteStage(id: string) {
    onChange((previous) => previous.filter((item) => item.id !== id));
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="text-sm text-muted-foreground">
          Loading recruitment timeline...
        </div>
      </div>
    );
  }
    return (
    <div className="rounded-xl border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Recruitment Timeline</div>

            <div className="mt-1 text-xs text-muted-foreground">
              Configure the recruitment stages that students will see after this
              recruitment is published.
            </div>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={addStage}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              + Add Stage
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        {!timeline.length ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <div className="text-4xl">🗓️</div>

            <div className="mt-3 text-base font-medium">
              No recruitment stages added
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              Build the complete recruitment process that applicants will
              follow.
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={addStage}
                className="mt-5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Add First Stage
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card"
              >
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {item.stage.trim() || "Untitled Stage"}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        Timeline stage visible after publishing.
                      </div>
                    </div>

                    {!readOnly && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateStage(item.id)}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteStage(item.id)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Stage Name
                    </label>

                    <input
                      disabled={readOnly}
                      list="recruitment-stage-suggestions"
                      value={item.stage}
                      onChange={(e) =>
                        updateStage(item.id, "stage", e.target.value)
                      }
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                      placeholder="Technical Interview"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Scheduled Date
                      </label>

                      <input
                        disabled={readOnly}
                        type="date"
                        value={item.date}
                        onChange={(e) =>
                          updateStage(item.id, "date", e.target.value)
                        }
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Description
                      </label>

                      <input
                        disabled={readOnly}
                        value={item.description}
                        onChange={(e) =>
                          updateStage(item.id, "description", e.target.value)
                        }
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                        placeholder="Round details"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
                <datalist id="recruitment-stage-suggestions">
          {DEFAULT_STAGES.map((stage) => (
            <option key={stage} value={stage} />
          ))}
        </datalist>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">Timeline Summary</div>

              <div className="mt-1 text-xs text-muted-foreground">
                This timeline is stored only in the recruitment draft. During
                Publish it will become the opportunity timeline shown to
                students.
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {totalConfigured} Configured Stage
              {totalConfigured === 1 ? "" : "s"}
            </div>
          </div>

          {timeline.length > 0 && (
            <div className="mt-4 space-y-2">
              {timeline.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {index + 1}
                    </div>

                    <div>
                      <div className="text-sm font-medium">
                        {item.stage.trim() || "Untitled Stage"}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {item.date || "Date not scheduled"}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {item.description.trim() || "No description"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}