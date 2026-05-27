import { useEffect, useState } from "react";
import { documentService } from "@/services/documentService";
import { isValidResumeUrl } from "@/lib/resumeValidation";

type Props = {
  studentId: string;
  authUserId: string;
  existingUrl?: string | null;
  onSaved: () => void;
};

export function ResumeSection({
  studentId,
  authUserId,
  existingUrl,
  onSaved,
}: Props) {
  const [resumeUrl, setResumeUrl] =
    useState(existingUrl ?? "");

  useEffect(() => {
    setResumeUrl(existingUrl ?? "");
  }, [existingUrl]);

  const [editingResume, setEditingResume] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSave() {
    setError("");

    if (!resumeUrl.trim()) {
      setError(
        "Resume URL is required.",
      );
      return;
    }

    if (
      !isValidResumeUrl(
        resumeUrl.trim(),
      )
    ) {
      setError(
        "Only Google Drive, OneDrive and Dropbox links are allowed.",
      );
      return;
    }

    try {
      setSaving(true);

      await documentService.saveResumeUrl(
        studentId,
        authUserId,
        resumeUrl.trim(),
      );

      setEditingResume(false);

      await onSaved();
    } catch (err) {
      console.error(err);

      setError(
        "Failed to save resume.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded border p-6">
      <h2 className="text-lg font-semibold">
        Resume
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Upload your resume to Google Drive,
        OneDrive or Dropbox and paste the
        shareable URL below.
      </p>

      {error && (
        <p className="mt-3 text-red-500">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <input
          className="rounded border p-2 disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Paste resume URL"
          value={resumeUrl}
          disabled={
            !!existingUrl &&
            !editingResume
          }
          onChange={(e) =>
            setResumeUrl(
              e.target.value,
            )
          }
        />

        <div className="flex gap-2">
          {(!existingUrl || editingResume) && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-black px-4 py-2 text-white"
            >
              {saving
                ? "Saving..."
                : editingResume
                  ? "Save New Resume"
                  : "Save Resume"}
            </button>
          )}

          {existingUrl && !editingResume && (
            <>
              <button
                onClick={() => {
                  setResumeUrl("");
                  setEditingResume(true);
                }}
                className="rounded bg-black px-4 py-2 text-white"
              >
                Replace Resume
              </button>

              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded border px-4 py-2"
              >
                View Resume
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}