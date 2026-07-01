import { Link } from "@tanstack/react-router";

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
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Recruitment Management
          </p>
          <h1 className="mt-2 text-3xl font-bold">Recruitment Hub</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            This hub is the entry point for opening a campus recruitment. It reuses the existing
            company, drive, eligibility, question builder, and opportunity layers without changing
            the current backend structure.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {WORKFLOW_STEPS.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Step {index + 1}
                </div>
                <div className="mt-2 text-sm font-medium">{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            to="/admin/companies"
            className="rounded-2xl border border-primary/20 bg-primary/5 p-5 transition hover:border-primary/40 hover:bg-primary/10 md:col-span-2 xl:col-span-1"
          >
            <div className="text-sm font-semibold">Start from Companies</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Search, edit, or create the company record first.
            </div>
          </Link>

          <Link
            to="/admin/drives"
            className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="text-sm font-semibold">Open Drives</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Review drive lifecycle, eligibility, and archived drives.
            </div>
          </Link>

          <Link
            to="/admin/opportunities"
            className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="text-sm font-semibold">Open Opportunities</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Manage roles, questions, applicants, and publishing.
            </div>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
            <h2 className="text-lg font-semibold">Recommended creation flow</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                "Company search and selection",
                "Create or update company information",
                "Create drive and default eligibility",
                "Reuse existing question builder for defaults",
                "Create one or more job roles",
                "Review all records before publish",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-background p-4 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Quick access</h2>
            <div className="mt-4 space-y-3">
              {HUB_CARDS.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="block rounded-xl border border-border bg-background p-4 transition hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="text-sm font-semibold">{card.title}</div>
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