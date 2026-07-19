import { useEffect, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { ExportCenter } from "@/components/export/ExportCenter";

import type { ExportDataset, ExportColumn } from "@/services/export/exportTypes";

import { buildCompanyExportConfiguration } from "@/services/company/companyExportConfig";

import { companyExportService, type CompanyExportRow } from "@/services/companyExportService";

interface CompanyExportDialogProps {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  totalCompanies: number;
}

export default function CompanyExportDialog({
  open,

  onOpenChange,

  totalCompanies,
}: CompanyExportDialogProps) {
  const [loading, setLoading] = useState(false);

  const [rows, setRows] = useState<CompanyExportRow[]>([]);

  const [additionalRecruiters, setAdditionalRecruiters] = useState(0);

  async function loadExportData() {
    try {
      setLoading(true);

      const data = await companyExportService.getCompanyExportData();

      setRows(data.rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    void loadExportData();
  }, [open, additionalRecruiters]);

  const dataset = useMemo<ExportDataset<CompanyExportRow>>(() => {
    const columns: ExportColumn[] = [
     {
    key: "Company Name",
    label: "Company Name",
    required: true,
    defaultEnabled: true,
    width: 35,
    excelType: "text",
},

      {
        key: "Primary HR Name",
        label: "Primary HR Name",
        required: true,
        defaultEnabled: true,
      },

{
    key: "Primary HR Contact",
    label: "Primary HR Contact",
    required: true,
    defaultEnabled: true,
    width: 18,
    excelType: "phone",
},

   {
    key: "Primary HR Email",
    label: "Primary HR Email",
    width: 32,
    excelType: "email",
},

      {
        key: "Primary HR Position",
        label: "Primary HR Position",
      },

     {
    key: "Website",
    label: "Website",
    width: 40,
    excelType: "url",
},
      {
        key: "Industry",
        label: "Industry",
      },

      {
        key: "Hiring Location",
        label: "Hiring Location",
      },

      {
        key: "Company Size",
        label: "Company Size",
      },

      {
        key: "Description",
        label: "Description",
      },

      {
        key: "Past Recruitment Count",
        label: "Past Recruitment Count",
      },
    ];

    for (let i = 1; i <= additionalRecruiters; i++) {
      columns.push(
        {
          key: `Recruiter ${i} Name`,

          label: `Recruiter ${i} Name`,
        },

        {
          key: `Recruiter ${i} Email`,

          label: `Recruiter ${i} Email`,
        },

        {
          key: `Recruiter ${i} Contact`,

          label: `Recruiter ${i} Contact`,
        },

        {
          key: `Recruiter ${i} Position`,

          label: `Recruiter ${i} Position`,
        },
      );
    }

    return {
      title: "Companies",

      subtitle: "Company Master Export",

      sheetName: "Companies",

      filename: "Companies.xlsx",

      summary: [
        {
          label: "Companies",

          value: totalCompanies,
        },

        {
          label: "Additional Recruiters",

          value: additionalRecruiters,
        },
      ],

      columns,

      rows,
    };
  }, [rows, totalCompanies, additionalRecruiters]);

  const configuration = buildCompanyExportConfiguration(dataset);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle>Company Export Center</DialogTitle>
          </DialogHeader>

          <div className="flex h-96 items-center justify-center">
            <div className="text-muted-foreground">Loading export data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Company Export Center</DialogTitle>
        </DialogHeader>

        <ExportCenter configuration={configuration}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Recruiters</label>

            <Input
              type="number"
              min={0}
              value={additionalRecruiters}
              onChange={(event) =>
                setAdditionalRecruiters(Math.max(0, Number(event.target.value) || 0))
              }
            />

            <p className="text-xs text-muted-foreground">
              Export up to this many additional recruiters (excluding the Primary HR).
            </p>
          </div>
        </ExportCenter>
      </DialogContent>
    </Dialog>
  );
}
