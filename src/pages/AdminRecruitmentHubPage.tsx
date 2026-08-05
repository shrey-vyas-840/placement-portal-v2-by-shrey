import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getDraftsForUser,
  getArchivedDraftsForUser,
  getPublishedRecruitmentsForUser,
  createDraftFromPublishedRecruitment,
  archiveDraftById,
  deleteDraftById,
  restoreDraftById,
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
  const [publishedRecruitments, setPublishedRecruitments] = useState<any[]>([]);
  const [archivedDrafts, setArchivedDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");

  async function loadDrafts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [draftData, publishedData, archivedData] = await Promise.all([
        getDraftsForUser(user.id),
        getPublishedRecruitmentsForUser(user.id),
        getArchivedDraftsForUser(user.id),
      ]);

      setDrafts(draftData);
      setPublishedRecruitments(publishedData);
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

    const [draftData, publishedData, archivedData] = await Promise.all([
      getDraftsForUser(user.id),
      getPublishedRecruitmentsForUser(user.id),
      getArchivedDraftsForUser(user.id),
    ]);

    setDrafts(draftData);
    setPublishedRecruitments(publishedData);
    setArchivedDrafts(archivedData);
  }

  async function handleUseAsTemplate(publishedRecruitment: any) {
    try {
      const draft = await createDraftFromPublishedRecruitment(publishedRecruitment);

      await refreshDrafts();

      navigate({
        to: "/admin/recruitment-new",
        search: {
          draft: draft.draft_id,
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to create recruitment template.");
    }
  }

  async function handleArchive(draftId: string) {
    try {
      await archiveDraftById(draftId);

      await refreshDrafts();

      toast.success("Recruitment freezed successfully.");
    } catch (error) {
      console.error(error);

      toast.error("Failed to archive draft.");
    }
  }
  async function handleRestore(draftId: string) {
    try {
      await restoreDraftById(draftId);

      await refreshDrafts();

      toast.success("Draft restored successfully.");
    } catch (error) {
      console.error(error);

      toast.error("Failed to restore draft.");
    }
  }

  async function handlePermanentDelete(draftId: string) {
    if (!window.confirm("Delete this recruitment permanently?\n\nThis action cannot be undone.")) {
      return;
    }

    try {
      await deleteDraftById(draftId);

      await refreshDrafts();

      toast.success("Recruitment deleted successfully.");
    } catch (error) {
      console.error(error);

      toast.error("Failed to delete draft.");
    }
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  const filteredRecruitments = publishedRecruitments.filter((item) => {
    const recruitmentName = item.drive_name ?? item.recruitment_name ?? item.company_name ?? "";

    const matchesSearch = recruitmentName.toLowerCase().includes(search.toLowerCase());

    const status = (item.application_status ?? item.status ?? "").toString().toLowerCase();

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "open"
          ? status === "open"
          : status === "closed";

    return matchesSearch && matchesStatus;
  });

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

        <div className="mt-8">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Active Recruitments</h2>

                <div className="mt-1 text-sm text-muted-foreground">
                  Running campus recruitments.
                </div>
              </div>

              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                {publishedRecruitments.length}
              </span>
            </div>

            <div className="mt-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Recruitment..."
                  className="h-11 w-full rounded-xl border px-4 lg:max-w-md"
                />

                <div className="flex gap-2">
                  {(["all", "open", "closed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-full px-5 py-2 text-sm transition ${
                        statusFilter === status
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/70"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-dashed p-8 text-center">Loading...</div>
              ) : filteredRecruitments.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                  No published recruitment found.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left">Recruitment</th>

                          <th className="px-4 py-3 text-left">Company</th>

                          <th className="px-4 py-3 text-center">Roles</th>

                          <th className="px-4 py-3 text-center">Applications</th>

                          <th className="px-4 py-3 text-center">Status</th>

                          <th className="px-4 py-3 text-center">Published</th>

                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRecruitments.map((item) => (
                          <tr key={item.draft_id} className="border-t">
                            <td className="px-4 py-4 font-medium">
                              {item.drive_name ?? item.recruitment_name ?? "-"}
                            </td>

                            <td className="px-4 py-4">{item.company_name ?? "-"}</td>

                            <td className="px-4 py-4 text-center">
                              {item.roles_count ?? item.total_roles ?? "-"}
                            </td>

                            <td className="px-4 py-4 text-center">{item.application_count ?? 0}</td>

                            <td className="px-4 py-4 text-center">
                              <span
                                className={`rounded-full px-3 py-1 text-xs ${
                                  (item.application_status ?? "").toLowerCase() === "open"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {item.application_status ?? "Closed"}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-center text-xs text-muted-foreground">
                              {item.published_at
                                ? new Date(item.published_at).toLocaleDateString()
                                : "-"}
                            </td>

                            <td className="px-4 py-4 text-center">
                              <div className="flex flex-wrap items-center justify-center gap-3">
                                <Link
                                  to="/admin/recruitment/$draftId"
                                  params={{
                                    draftId: item.draft_id,
                                  }}
                                  className="text-primary hover:underline"
                                >
                                  View →
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleUseAsTemplate(item)}
                                  className="rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted"
                                >
                                  Use As Template
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                  <div
                    key={draft.draft_id}
                    className="rounded-2xl border border-border bg-background p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Draft
                        </div>
                        <div className="mt-1 text-base font-semibold">
                          {draft.draft_name ?? draft.recruitment_name ?? "Untitled Recruitment"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {draft.company_name ?? draft.company_data?.company_name ?? "-"}
                        </div>
                      </div>

                      <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        Step {typeof draft.current_step === "number" ? draft.current_step + 1 : 1}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      {draft.last_saved_at
                        ? `Last saved ${new Date(draft.last_saved_at).toLocaleString()}`
                        : "Not saved yet"}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: "/admin/recruitment-new",
                            search: {
                              draft: draft.draft_id,
                            },
                          })
                        }
                        className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={() => handleArchive(draft.draft_id)}
                        className="rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted"
                      >
                        Archive
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(draft.draft_id)}
                        className="rounded-full border border-border px-4 py-2 text-xs font-medium text-destructive transition hover:bg-muted"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Freezed Recruitments</h2>

              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                {archivedDrafts.length}
              </span>
            </div>

            <div className="mt-6 max-h-[520px] overflow-y-auto space-y-4 pr-2">
              {archivedDrafts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <div className="text-sm text-muted-foreground">No freezed recruitments.</div>
                </div>
              ) : (
                archivedDrafts.map((draft) => (
                  <RecruitmentDraftCard
                    key={draft.draft_id}
                    draft={draft}
                    archived
                    onRestore={handleRestore}
                    onDelete={handlePermanentDelete}
                  />
                ))
              )}
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
