import { Download, ExternalLink, FileText } from "lucide-react";

import type {
  RecruitmentQuestionAnswer,
  RecruitmentDocument,
} from "@/services/recruitmentAnalyticsService";

interface Props {
  answers: RecruitmentQuestionAnswer[];
  documents: RecruitmentDocument[];
}
function formatAnswer(value: any): string {
  if (value == null) return "-";

  if (typeof value === "string") return value;

  if (typeof value === "number") return value.toString();

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    if ("value" in value) {
      return formatAnswer(value.value);
    }

    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function ApplicantAnswersCard({ answers, documents }: Props) {
  return (
    <div className="rounded-2xl border p-5">
      <h3 className="mb-4 text-lg font-semibold">Application Answers</h3>

      {answers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No application answers found.
        </div>
      ) : (
        <div className="space-y-5">
          {answers.map((item) => (
            <div key={item.questionId} className="rounded-xl bg-muted p-4">
              <div className="text-sm font-semibold">{item.questionTitle}</div>

              {(() => {
                const value = item.answer?.value;

                if (value?.type === "document") {
                  const document = documents.find(
                    (doc) => doc.documentMetadataId === value.document_metadata_id,
                  );

                  if (!document) {
                    return (
                      <div className="mt-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                        Document not found.
                      </div>
                    );
                  }

                  return (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-background p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />

                        <div>
                          <div className="font-medium">{document.documentName}</div>

                          <div className="text-xs text-muted-foreground">
                            {document.documentType}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={document.viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border p-2 hover:bg-muted"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>

                        <a
                          href={document.downloadUrl}
                          download
                          className="rounded-lg border p-2 hover:bg-muted"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {formatAnswer(item.answer)}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
