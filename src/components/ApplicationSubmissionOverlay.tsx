import { Loader2, CheckCircle2 } from "lucide-react";

interface ApplicationSubmissionOverlayProps {
  visible: boolean;
  stage: string;
  progress: number;
  completed?: boolean;
}

export default function ApplicationSubmissionOverlay({
  visible,
  stage,
  progress,
  completed = false,
}: ApplicationSubmissionOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="
        absolute
        inset-0
        z-999
        flex
        items-center
        justify-center
        rounded-3xl
        bg-white/90
        backdrop-blur-md
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-border
          bg-background
          p-8
          shadow-2xl
        "
      >
        <div className="flex flex-col items-center text-center">
          {completed ? (
            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
          ) : (
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          )}

          <h2 className="mt-6 text-2xl font-bold">
            {completed
              ? "Application Submitted"
              : "Submitting Application"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {completed
              ? "Your application has been submitted successfully."
              : "Please don't close this window while we complete the submission."}
          </p>

          <div className="mt-8 w-full">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                Current Progress
              </span>

              <span className="font-medium text-primary">
                {completed ? "Completed" : `${progress}%`}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div
            className="
              mt-8
              w-full
              rounded-2xl
              border
              border-primary/20
              bg-primary/5
              p-4
            "
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Current Step
            </div>

            <div className="mt-2 text-base font-semibold text-primary">
              {stage}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}