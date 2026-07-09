import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getDraftsForUser,
  getArchivedDraftsForUser,
  duplicateDraft,
  archiveDraftById,
  deleteDraftById,
} from "@/services/recruitmentDraftService";
import { RecruitmentDraftCard } from "@/components/RecruitmentDraftCard";
import { toast } from "sonner";

const HUB_CARDS = [
  {
    to: "/admin/companies",
    title: "Companies",
    description: "Create, edit, archive, and review company master records.",
  },
  {
    to: "/admin/drives",
    title: "Drives",
    description: "Manage drive records, eligibility, and archive history.",
  },
  {
    to: "/admin/opportunities",
    title: "Opportunities",
    description: "Manage roles, questions, applicants, publish state, and mail workspace.",
  },
];

const WORKFLOW_STEPS = [
  "Select or create company",
  "Create drive",
  "Add default eligibility",
  "Add default questions",
  "Create roles",
  "Review and publish",
];

export function AdminRecruitmentHubPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [archivedDrafts, setArchivedDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDrafts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [draftData, archivedData] = await Promise.all([
        getDraftsForUser(user.id),
        getArchivedDraftsForUser(user.id),
      ]);

      setDrafts(draftData);
      setArchivedDrafts(archivedData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshDrafts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const [draftData, archivedData] = await Promise.all([
      getDraftsForUser(user.id),
      getArchivedDraftsForUser(user.id),
    ]);

    setDrafts(draftData);
    setArchivedDrafts(archivedData);
  }

  async function handleDuplicate(draftId: string) {
    try {
      await duplicateDraft(draftId);

      await refreshDrafts();

      toast.success("Draft duplicated successfully.");
    } catch (error) {
      console.error(error);

      toast.error("Failed to duplicate draft.");
    }
  }
  async function handleArchive(draftId: string) {
    try {
      await archiveDraftById(draftId);

      await refreshDrafts();

      toast.success("Draft archived successfully.");
    } catch (error) {
      console.error(error);

      toast.error("Failed to archive draft.");
    }
  }

  async function handleDelete(draftId: string) {
    if (!window.confirm("Delete this draft?")) {
      return;
    }

    try {
      await deleteDraftById(draftId);

      await refreshDrafts();

      toast.success("Draft deleted successfully.");
    } catch (error) {
      console.error(error);

      toast.error("Failed to delete draft.");
    }
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Recruitment Management
              </div>

              <h1 className="mt-2 text-4xl font-bold">Recruitment Hub</h1>

              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                Create, manage and monitor complete campus recruitment cycles from one place.
              </p>
            </div>

            <Link
              to="/admin/recruitment-new"
              className="rounded-2xl bg-primary px-8 py-5 text-center text-primary-foreground shadow transition hover:opacity-90"
            >
              <div className="text-lg font-semibold">+ New Recruitment</div>

              <div className="mt-1 text-xs opacity-80">Guided recruitment wizard</div>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Continue Draft</h2>

                <div className="mt-1 text-sm text-muted-foreground">
                  Resume an unfinished recruitment.
                </div>
              </div>

              <span className="rounded-full bg-muted px-3 py-1 text-xs">Coming Soon</span>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  Loading...
                </div>
              ) : drafts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <div className="text-sm text-muted-foreground">
                    No recruitment draft available.
                  </div>
                </div>
              ) : (
                <RecruitmentDraftCard draft={drafts[0]} compact />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Active Recruitments</h2>

                <div className="mt-1 text-sm text-muted-foreground">
                  Running campus recruitments.
                </div>
              </div>

              <span className="rounded-full bg-muted px-3 py-1 text-xs">Placeholder</span>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
              <div className="text-sm text-muted-foreground">No active recruitment.</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Draft Recruitments</h2>

              <span className="rounded-full bg-muted px-3 py-1 text-xs">{drafts.length}</span>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  Loading drafts...
                </div>
              ) : drafts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  No drafts available.
                </div>
              ) : (
                drafts.map((draft) => (
                  <RecruitmentDraftCard
                    key={draft.draft_id}
                    draft={draft}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Archived Recruitments</h2>

              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                {archivedDrafts.length}
              </span>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
              {loading
                ? "Loading archived recruitments..."
                : archivedDrafts.length === 0
                  ? "No archived recruitment."
                  : `${archivedDrafts.length} archived recruitment${archivedDrafts.length === 1 ? "" : "s"}.`}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Management</h2>

            <div className="mt-5 space-y-3">
              {HUB_CARDS.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="block rounded-2xl border border-border bg-background p-4 transition hover:border-primary hover:bg-muted/50"
                >
                  <div className="font-medium">{card.title}</div>

                  <div className="mt-1 text-xs text-muted-foreground">{card.description}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
