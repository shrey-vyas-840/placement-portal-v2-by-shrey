import { useEffect, useState } from "react";

import { companyExportService, type CompanyExportRow } from "@/services/companyExportService";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

interface CompanyExportDialogProps {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  totalCompanies: number;
}

export function CompanyExportDialog({
  open,

  onOpenChange,

  totalCompanies,
}: CompanyExportDialogProps) {
  const [additionalRecruiters, setAdditionalRecruiters] = useState(0);

  const [rows, setRows] = useState<CompanyExportRow[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const exportData = await companyExportService.getCompanyExportData();

        if (mounted) {
          setRows(exportData.rows);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Company Export Center</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-xl font-semibold">Export Summary</h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Companies</span>

                <span className="font-medium">{totalCompanies}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional Recruiters</span>

                <input
                  type="number"
                  min={0}
                  value={additionalRecruiters}
                  onChange={(e) => setAdditionalRecruiters(Number(e.target.value))}
                  className="w-20 rounded-lg border px-2 py-1 text-right"
                />
              </div>
            </div>

            <div className="mt-8">
              <Button disabled className="w-full">
                Export Excel
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold">Export Preview</h2>
            </div>

            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr>
                    <th className="border-b px-4 py-3 text-left">Company</th>

                    <th className="border-b px-4 py-3 text-left">Primary HR</th>

                    <th className="border-b px-4 py-3 text-left">Contact</th>

                    <th className="border-b px-4 py-3 text-left">Recruiters</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        Loading companies...
                      </td>
                    </tr>
                  ) : (
                    rows.map((company) => {
                      const primary = company.recruiters.find((r) => r.primary_contact);

                      return (
                        <tr key={company.companyId}>
                          <td className="border-b px-4 py-3">{company.companyName}</td>

                          <td className="border-b px-4 py-3">{primary?.contact_name ?? "—"}</td>

                          <td className="border-b px-4 py-3">{primary?.contact_number ?? "—"}</td>

                          <td className="border-b px-4 py-3">
                            {Math.max(company.recruiters.length - 1, 0)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
