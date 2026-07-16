import { ExternalLink, Download, FileText } from "lucide-react";
import type { RecruitmentDocument } from "@/services/recruitmentAnalyticsService";

interface Props {
  documents: RecruitmentDocument[];
}

export function ApplicantDocumentsCard({
  documents,
}: Props) {
  return (
    <div className="rounded-2xl border p-5">

      <h3 className="mb-4 text-lg font-semibold">
        Uploaded Documents
      </h3>

      {documents.length === 0 ? (

        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No uploaded documents.
        </div>

      ) : (

        <div className="space-y-4">

          {documents.map((document) => (

            <div
              key={document.documentMetadataId}
              className="flex items-center justify-between rounded-xl bg-muted p-4"
            >

              <div className="flex items-center gap-3">

                <FileText className="h-5 w-5 text-primary" />

                <div>

                  <div className="font-medium">
                    {document.documentName}
                  </div>

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
                  className="rounded-lg border px-3 py-2 hover:bg-background"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>

                <a
                  href={document.downloadUrl}
                  download
                  className="rounded-lg border px-3 py-2 hover:bg-background"
                >
                  <Download className="h-4 w-4" />
                </a>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}