import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

interface ExportSummaryItem {
  label: string;

  value: string | number;
}

interface ExportSummaryCardProps {
  title: string;

  summary: ExportSummaryItem[];

  exporting: boolean;

  exportButtonLabel?: string;

  children?: React.ReactNode;

  onExport: () => void;
}

export function ExportSummaryCard({
  title,

  summary,

  exporting,

  exportButtonLabel = "Export Excel",

  children,

  onExport,
}: ExportSummaryCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>

      <div className="mt-6 space-y-4">
        {summary.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{item.label}</span>

            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      {children && <div className="mt-6">{children}</div>}

      <div className="mt-8">
        <Button className="w-full gap-2" disabled={exporting} onClick={onExport}>
          <FileSpreadsheet className="h-5 w-5" />

          {exporting ? "Generating..." : exportButtonLabel}
        </Button>
      </div>
    </div>
  );
}
