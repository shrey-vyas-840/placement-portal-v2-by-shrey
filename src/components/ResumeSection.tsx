import { useEffect, useState } from "react";
import { documentService } from "@/services/documentService";
import { isValidResumeUrl } from "@/lib/resumeValidation";

type Props = {
  studentId: string;
  authUserId: string;
  existingUrl?: string | null;
  onSaved: () => void;
};

export function ResumeSection({ studentId, authUserId, existingUrl, onSaved }: Props) {
  const [resumeUrl, setResumeUrl] = useState(existingUrl ?? "");

  useEffect(() => {
    setResumeUrl(existingUrl ?? "");
  }, [existingUrl]);

  const [editingResume, setEditingResume] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  async function handleSave() {
    setError("");

    if (!resumeUrl.trim()) {
      setError("Resume URL is required.");
      return;
    }

    if (!isValidResumeUrl(resumeUrl.trim())) {
      setError("Only Google Drive, OneDrive and Dropbox links are allowed.");
      return;
    }

    try {
      setSaving(true);

      await documentService.saveResumeUrl(studentId, authUserId, resumeUrl.trim());

      setEditingResume(false);

      await onSaved();
    } catch (err) {
      console.error(err);

      setError("Failed to save resume.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="
      rounded-3xl
      border
      border-border/50
      bg-white
      p-8
      shadow-sm
    "
    >
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Resume Management</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            To maintain your latest professional resume for placement activities.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            1️⃣ Upload your resume to Google Drive, OneDrive or Dropbox 
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            2️⃣ Go to Manage Access & Make it public. 
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            3️⃣ Paste the shareable Link.
          </p>
        </div>

        <div
          className="
      rounded-2xl
      bg-primary/10
      px-4
      py-2
      text-sm
      font-medium
      text-primary
    "
        >
          Resume Profile
        </div>
      </div>

      {error && <p className="mt-3 text-red-500">{error}</p>}

      <div className="space-y-5">
        {/* VIEW MODE */}
        {existingUrl && !editingResume ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div
              className="
          rounded-2xl
          border
          border-slate-200
          bg-slate-50/60
          p-5
          transition-all
          hover:border-primary/30
          hover:shadow-md
        "
            >
              <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Resume Status
              </div>

              <div className="mt-3 text-lg font-semibold text-green-600">✓ Resume Uploaded</div>

              <p className="mt-2 text-sm text-muted-foreground">
                Your latest resume is available for recruiters and placement activities.
              </p>
            </div>

            <div
              className="
          rounded-2xl
          border
          border-slate-200
          bg-slate-50/60
          p-5
          transition-all
          hover:border-primary/30
          hover:shadow-md
        "
            >
              <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Resume Actions
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="
              rounded-xl
              border
              border-slate-300
              bg-white
              px-5
              py-2.5
              font-medium
              transition-all
              hover:bg-slate-50
            "
                >
                  View Resume →
                </a>

                <button
                  onClick={() => {
                    setEditingResume(true);
                  }}
                  className="
              rounded-xl
              bg-primary
              px-5
              py-2.5
              font-medium
              text-white
              transition-all
              hover:shadow-lg
            "
                >
                  Replace Resume
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* EDIT MODE */}

            <div
              className="
          rounded-2xl
          border
          border-slate-200
          bg-slate-50/50
          p-5
        "
            >
              <div className="mb-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Resume URL
              </div>

              <input
                className="
            w-full
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-4
            py-3
            outline-none
            transition-all
            focus:border-primary
            focus:ring-4
            focus:ring-primary/10
          "
                placeholder="Paste Google Drive, OneDrive or Dropbox URL"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="
            rounded-xl
            bg-primary
            px-6
            py-3
            font-medium
            text-white
            transition-all
            hover:shadow-lg
            disabled:opacity-50
          "
              >
                {saving ? "Saving..." : editingResume ? "Save New Resume" : "Save Resume"}
              </button>

              {editingResume && existingUrl && (
                <button
                  onClick={() => {
                    setResumeUrl(existingUrl);
                    setEditingResume(false);
                  }}
                  className="
              rounded-xl
              border
              border-slate-300
              bg-white
              px-6
              py-3
              font-medium
              transition-all
              hover:bg-slate-50
            "
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
