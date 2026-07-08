import { useMemo } from "react";

export type RecruitmentRoleDocument = {
  id: string;
  document_name: string;
  description: string;
  required: boolean;
};

interface RecruitmentDocumentsBuilderProps {
  documents: RecruitmentRoleDocument[];
  onChange: React.Dispatch<React.SetStateAction<RecruitmentRoleDocument[]>>;
  readOnly?: boolean;
  loading?: boolean;
}

const DEFAULT_DOCUMENT_SUGGESTIONS = [
  "Resume",
  "Cover Letter",
  "Portfolio",
  "Government ID",
  "Latest Transcript",
  "Passport Size Photograph",
] as const;

function createDocument(
  overrides?: Partial<RecruitmentRoleDocument>,
): RecruitmentRoleDocument {
  return {
    id: crypto.randomUUID(),
    document_name: "",
    description: "",
    required: true,
    ...overrides,
  };
}

export function RecruitmentDocumentsBuilder({
  documents,
  onChange,
  readOnly = false,
  loading = false,
}: RecruitmentDocumentsBuilderProps) {
  const usedNames = useMemo(
    () =>
      new Set(
        documents
          .map((document) => document.document_name.trim().toLowerCase())
          .filter(Boolean),
      ),
    [documents],
  );

  function updateDocument(
    id: string,
    field: keyof RecruitmentRoleDocument,
    value: RecruitmentRoleDocument[keyof RecruitmentRoleDocument],
  ) {
    onChange((previous) =>
      previous.map((document) =>
        document.id === id
          ? {
              ...document,
              [field]: value,
            }
          : document,
      ),
    );
  }

  function addDocument() {
    onChange((previous) => [...previous, createDocument()]);
  }

  function duplicateDocument(id: string) {
    onChange((previous) => {
      const target = previous.find((item) => item.id === id);

      if (!target) return previous;

      const duplicate = createDocument({
        document_name: `${target.document_name} Copy`,
        description: target.description,
        required: target.required,
      });

      const index = previous.findIndex((item) => item.id === id);

      return [
        ...previous.slice(0, index + 1),
        duplicate,
        ...previous.slice(index + 1),
      ];
    });
  }

  function deleteDocument(id: string) {
    onChange((previous) => previous.filter((item) => item.id !== id));
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="text-sm text-muted-foreground">
          Loading document requirements...
        </div>
      </div>
    );
  }
    return (
    <div className="rounded-xl border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Required Documents</div>

            <div className="mt-1 text-xs text-muted-foreground">
              Configure the documents students must provide while applying for
              this role.
            </div>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={addDocument}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              + Add Document
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        {!documents.length ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <div className="text-4xl">📄</div>

            <div className="mt-3 text-base font-medium">
              No document requirements added
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              Add the documents students must upload for this job role.
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={addDocument}
                className="mt-5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Add First Document
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => {
              const normalizedName = document.document_name
                .trim()
                .toLowerCase();

              const duplicateName =
                normalizedName !== "" &&
                documents.filter(
                  (item) =>
                    item.document_name.trim().toLowerCase() === normalizedName,
                ).length > 1;

              return (
                <div
                  key={document.id}
                  className="rounded-xl border border-border bg-card"
                >
                  <div className="border-b border-border px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {document.document_name.trim() || "Untitled Document"}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Students will upload this document during the
                          application process.
                        </div>
                      </div>

                      {!readOnly && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateDocument(document.id)}
                            className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                          >
                            Duplicate
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteDocument(document.id)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Document Name
                      </label>

                      <input
                        disabled={readOnly}
                        list="recruitment-document-suggestions"
                        value={document.document_name}
                        onChange={(e) =>
                          updateDocument(
                            document.id,
                            "document_name",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                        placeholder="Resume"
                      />

                      {duplicateName && (
                        <p className="mt-2 text-xs text-red-600">
                          Another document with the same name already exists.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Description
                      </label>

                      <textarea
                        rows={3}
                        disabled={readOnly}
                        value={document.description}
                        onChange={(e) =>
                          updateDocument(
                            document.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                        placeholder="Explain what students should upload."
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={document.required}
                        onChange={(e) =>
                          updateDocument(
                            document.id,
                            "required",
                            e.target.checked,
                          )
                        }
                      />

                      Required document
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
                <datalist id="recruitment-document-suggestions">
          {DEFAULT_DOCUMENT_SUGGESTIONS.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">Document Summary</div>

              <div className="mt-1 text-xs text-muted-foreground">
                These requirements are stored only in the recruitment draft.
                Students will upload the actual files only after this
                recruitment is published.
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {documents.length} Document{documents.length === 1 ? "" : "s"} •{" "}
              {documents.filter((document) => document.required).length} Required
            </div>
          </div>

          {documents.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {documents.map((document) => (
                <span
                  key={document.id}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    document.required
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {document.document_name.trim() || "Untitled"}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}