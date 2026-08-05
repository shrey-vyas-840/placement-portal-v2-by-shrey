import { useEffect, useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { SummaryTab } from "@/components/recruitment-workspace/SummaryTab";
import { getDraftById, type RecruitmentDraftRow } from "@/services/recruitmentDraftService";
import {
  getRecruitmentWorkspaceSummary,
  type RecruitmentWorkspaceSummary,
} from "@/services/recruitmentAnalyticsService";
import { ApplicantsTab } from "@/components/recruitment-workspace/ApplicantsTab";
import { RecruitmentProcessTab } from "@/components/recruitment-workspace/RecruitmentProcessTab";
import { ExportsTab } from "@/components/recruitment-workspace/ExportsTab";
import { SettingsTab } from "@/components/recruitment-workspace/SettingsTab";
import { useNavigate } from "@tanstack/react-router";
import { recruitmentExecutionService } from "@/services/recruitmentExecutionService";
import { getExecutionBootstrapContext } from "@/services/recruitmentExecutionBootstrapService";

export function AdminRecruitmentWorkspacePage() {
  const { draftId } = useParams({
    from: "/admin/recruitment/$draftId",
  });

  const navigate = useNavigate();

  const [draft, setDraft] = useState<RecruitmentDraftRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RecruitmentWorkspaceSummary | null>(null);
  const [activeTab, setActiveTab] = useState<
    "summary" | "applicants" | "recruitment-process" | "exports" | "settings"
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
        id: "recruitment-process",
        label: "Recruitment Process",
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

        const workspaceSummary = await getRecruitmentWorkspaceSummary(result.draft_id);

        if (!mounted) return;

        setSummary(workspaceSummary);
      } catch (err) {
        if (!mounted) return;

        setError(err instanceof Error ? err.message : "Failed to load recruitment.");
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

  const handleStartProcess = async () => {
    if (!draft) {
      return;
    }

    const bootstrap = await getExecutionBootstrapContext(draft.draft_id);

    const execution = await recruitmentExecutionService.startExecutionWorkflow({
      ...bootstrap,
    });

    await navigate({
      to: "/admin/recruitment-execution",
      search: {
        executionId: execution.execution_id,
      },
    });
  };

  const handleResumeProcess = () => {
    const executionId = summary?.execution.latestExecutionId;

    if (!executionId) {
      return;
    }

    navigate({
      to: "/admin/recruitment-execution",
      search: {
        executionId,
      },
    });
  };

  const handleViewProcess = () => {
    const executionId = summary?.execution.latestExecutionId;

    if (!executionId) {
      return;
    }

    navigate({
      to: "/admin/recruitment-execution",
      search: {
        executionId,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recruitment Workspace</h1>

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
              <SummaryTab draft={draft} summary={summary} loading={loading} />
            )}

            {activeTab === "applicants" && (
              <ApplicantsTab opportunityId={summary?.opportunityId ?? null} />
            )}

            {activeTab === "recruitment-process" && (
              <RecruitmentProcessTab
                summary={summary}
                loading={loading}
                onStartProcess={handleStartProcess}
                onResumeProcess={handleResumeProcess}
                onViewProcess={handleViewProcess}
              />
            )}

            {activeTab === "exports" && (
              <ExportsTab opportunityId={summary?.opportunityId ?? null} />
            )}

            {activeTab === "settings" && (
              <SettingsTab draft={draft} summary={summary} loading={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
