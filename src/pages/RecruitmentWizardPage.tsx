import { useState } from "react";
import { Link } from "@tanstack/react-router";

const STEPS = [
  "Company",
  "Drive",
  "Eligibility",
  "Questions",
  "Job Roles",
  "Review",
];

export function RecruitmentWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Recruitment Wizard
              </div>

              <h1 className="mt-2 text-3xl font-bold">
                New Recruitment
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Guided campus recruitment creation.
              </p>

            </div>

            <Link
              to="/admin/recruitment"
              className="rounded-xl border border-border px-4 py-2 hover:bg-muted"
            >
              Exit Wizard
            </Link>

          </div>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">

            <div className="mb-6 text-lg font-semibold">
              Progress
            </div>

            <div className="space-y-3">

              {STEPS.map((step, index) => (

                <button
                  key={step}
                  onClick={() => setCurrentStep(index)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    index === currentStep
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >

                  <div className="text-xs uppercase text-muted-foreground">
                    Step {index + 1}
                  </div>

                  <div className="mt-1 font-medium">
                    {step}
                  </div>

                </button>

              ))}

            </div>

          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">

            <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Current Step
            </div>

            <h2 className="mt-2 text-3xl font-bold">
              {STEPS[currentStep]}
            </h2>

            <div className="mt-8 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border">

              <div className="text-center">

                <div className="text-2xl font-semibold">
                  {STEPS[currentStep]}
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  UI for this step will be implemented in the next phases.
                </div>

              </div>

            </div>

            <div className="mt-8 flex items-center justify-between">

              <button
                onClick={() =>
                  setCurrentStep((s) => Math.max(0, s - 1))
                }
                disabled={currentStep === 0}
                className="rounded-xl border border-border px-5 py-2 disabled:opacity-40"
              >
                Back
              </button>

              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </div>

              <button
                onClick={() =>
                  setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))
                }
                disabled={currentStep === STEPS.length - 1}
                className="rounded-xl bg-primary px-5 py-2 text-primary-foreground disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}