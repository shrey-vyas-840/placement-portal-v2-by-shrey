import { useEffect, useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { SummaryTab } from "@/components/recruitment-workspace/SummaryTab";
import {
  getDraftById,
  type RecruitmentDraftRow,
} from "@/services/recruitmentDraftService";

import {
  getRecruitmentWorkspaceSummary,
  type RecruitmentWorkspaceSummary,
} from "@/services/recruitmentAnalyticsService";
import { ApplicantsTab } from "@/components/recruitment-workspace/ApplicantsTab";
import { ExportsTab } from "@/components/recruitment-workspace/ExportsTab";


export function AdminRecruitmentWorkspacePage() {
  const { draftId } = useParams({
  from: "/admin/recruitment/$draftId",
});

const [draft, setDraft] = useState<RecruitmentDraftRow | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [summary, setSummary] =
  useState<RecruitmentWorkspaceSummary | null>(null);
const [activeTab, setActiveTab] = useState<
  "summary" | "applicants" | "exports" | "settings"
>("summary");

const tabs = useMemo(
  () => [
    {
      id: "summary",
      label: "Summary",
    },
    {
      id: "applicants",
      label: "Applicants",
    },
    {
      id: "exports",
      label: "Exports",
    },
    {
      id: "settings",
      label: "Settings",
    },
  ],
  [],
);

useEffect(() => {
  let mounted = true;

  async function loadDraft() {
    try {
      setLoading(true);

      const result = await getDraftById(draftId);

      if (!mounted) return;

      setDraft(result);

      const workspaceSummary =
  await getRecruitmentWorkspaceSummary(result.draft_id);

if (!mounted) return;

setSummary(workspaceSummary);
    } catch (err) {
      if (!mounted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load recruitment.",
      );
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }

  loadDraft();

  return () => {
    mounted = false;
  };
}, [draftId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-6 flex items-center justify-between">

  <div>

    <h1 className="text-3xl font-bold">
      Recruitment Workspace
    </h1>

    <p className="mt-1 text-sm text-muted-foreground">
      Monitor registrations, applicants and recruitment performance.
    </p>

  </div>

</div>

        <div className="overflow-hidden rounded-3xl border bg-card">

  <div className="border-b px-6 py-4">

    <div className="flex flex-wrap gap-3">

      {tabs.map((tab) => {

        const selected = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={
              selected
                ? "rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-xl px-5 py-2 text-sm text-muted-foreground hover:bg-muted"
            }
          >
            {tab.label}
          </button>
        );

      })}

    </div>

  </div>

  <div className="min-h-[600px] p-8">

    {activeTab === "summary" && (
 <SummaryTab
  draft={draft}
  summary={summary}
  loading={loading}
/>
)}

   {activeTab === "applicants" && (
  <ApplicantsTab
  opportunityId={summary?.opportunityId ?? null}
/>
)}

   {activeTab === "exports" && (
  <ExportsTab
    opportunityId={summary?.opportunityId ?? null}
  />
)}

    {activeTab === "settings" && (
      <div className="text-center text-muted-foreground">
        Recruitment settings coming later.
      </div>
    )}

  </div>

</div>

      </div>
    </div>
  );
}