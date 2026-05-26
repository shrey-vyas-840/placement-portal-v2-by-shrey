import { useState } from "react";
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

      onSaved();
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
          className="rounded border p-2"
          placeholder="Paste resume URL"
          value={resumeUrl}
          onChange={(e) =>
            setResumeUrl(
              e.target.value,
            )
          }
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-black px-4 py-2 text-white"
          >
            {saving
              ? "Saving..."
              : existingUrl
              ? "Replace Resume"
              : "Save Resume"}
          </button>

          {existingUrl && (
            <a
              href={existingUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded border px-4 py-2"
            >
              View Resume
            </a>
          )}
        </div>
      </div>
    </div>
  );
}