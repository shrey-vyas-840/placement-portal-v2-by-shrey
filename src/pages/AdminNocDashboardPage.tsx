import { ReactNode, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { adminNocService } from "@/services/adminNocService";

import * as ExcelJS from "exceljs";

function NocLetterBlock({
  snapshot,
  approvedAt,
  editable,
  customFields,
  setCustomFields,
}: {
  snapshot: any;
  approvedAt?: string | null;
  editable?: boolean;
  customFields?: any;
  setCustomFields?: any;
}) {
  const data = {
    ...snapshot,
    ...(customFields ?? {}),
  };

  return (
    <div
      className="mx-auto max-w-4xl bg-white px-12 py-65 text-sm leading-6"
      style={{
        fontFamily: "Arial",
      }}
    >
      <div className="flex justify-between">
        <div className="font-bold">
          Ref.: T&amp;P/INTERNSHIPS/
          {data.institute_name}/{data.branch}
          /2025-26
        </div>

        <div className="font-bold">
          Date: {approvedAt ? new Date(approvedAt).toLocaleDateString("en-GB") : "-"}
        </div>
      </div>

      <br />

      <div>
        {editable ? (
          <>
            <select
              value={data.hr_prefix ?? "Mr."}
              onChange={(e) =>
                setCustomFields((prev: any) => ({
                  ...prev,
                  hr_prefix: e.target.value,
                }))
              }
              className="border-b outline-none bg-transparent"
            >
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
            </select>{" "}
            <input
              value={data.hr_name ?? ""}
              onChange={(e) =>
                setCustomFields((prev: any) => ({
                  ...prev,
                  hr_name: e.target.value,
                }))
              }
              className="border-b outline-none bg-transparent"
            />
            ,
          </>
        ) : (
          <>
            {data.hr_prefix} {data.hr_name},
          </>
        )}
      </div>

      <div>
        {editable ? (
          <input
            value={data.hr_position ?? ""}
            onChange={(e) =>
              setCustomFields((prev: any) => ({
                ...prev,
                hr_position: e.target.value,
              }))
            }
            className="border-b outline-none bg-transparent w-full"
          />
        ) : (
          data.hr_position
        )}
      </div>

      <div>
        {editable ? (
          <input
            value={data.company_name ?? ""}
            onChange={(e) =>
              setCustomFields((prev: any) => ({
                ...prev,
                company_name: e.target.value,
              }))
            }
            className="border-b outline-none bg-transparent w-full"
          />
        ) : (
          data.company_name
        )}
      </div>

      <div>
        {editable ? (
          <input
            value={data.company_address_1 ?? ""}
            onChange={(e) =>
              setCustomFields((prev: any) => ({
                ...prev,
                company_address_1: e.target.value,
              }))
            }
            className="border-b outline-none bg-transparent w-full"
          />
        ) : (
          data.company_address_1
        )}
      </div>

      <div>
        {editable ? (
          <input
            value={data.company_address_2 ?? ""}
            onChange={(e) =>
              setCustomFields((prev: any) => ({
                ...prev,
                company_address_2: e.target.value,
              }))
            }
            className="border-b outline-none bg-transparent w-full"
          />
        ) : (
          data.company_address_2
        )}
      </div>

      <br />

      <div className="text-center font-bold">Sub.: NOC for {data.noc_type}</div>

      <br />

      <div>Dear Sir/Ma&apos;am,</div>

      <br />

      <div>Greetings!!!</div>

      <br />

      <div>
        <strong>
          {data.student_prefix ?? "Mr./Ms."} {data.student_name}
        </strong>
        , currently pursuing <strong>{data.branch}</strong>, Semester{" "}
        <strong>{data.semester}</strong>, with Enrollment No. <strong>{data.enrollment_no}</strong>{" "}
        in our constituent Institute - <strong>{data.institute_name}</strong>, has been selected for{" "}
        <strong>
          {Math.max(
            1,
            (new Date(data.end_date).getFullYear() - new Date(data.start_date).getFullYear()) * 12 +
              (new Date(data.end_date).getMonth() - new Date(data.start_date).getMonth()),
          )}
        </strong>{" "}
        month/s internship in your organization from <strong>{data.start_date}</strong> to{" "}
        <strong>{data.end_date}</strong>. As per our University (NAAC Accredited, UGC & AICTE
        approved) academic policy, students must do the internship. The Internship project is
        monitored by the HOD and a Faculty Member regularly. Students are required to attend all
        Practical, Mid-Semester, and End-Semester examinations conducted by the university during
        the internship period.
      </div>

      <br />

      <div>
        <strong>
          The Institute/Indus University will have NO OBJECTION for the student doing his/her
          Internship.
        </strong>
        Your organization is requested to give him/her a project (which he/she can submit it to the
        University authorities) as a part fulfillment of his/her course curriculum. Kindly note that
        the Student must be issued a Certificate confirming the successful completion of the project
        duly signed and sealed, by the competent authorities on your organization&apos;s letterhead.
      </div>

      <br />

      <div>
        He/She has been instructed to strictly
        <strong>
          {" "}
          adhere to the rules, regulations, policies and guidelines of your organization during the
          internship period.
        </strong>
      </div>

      <br />

      <div>We solicit your kind support in this regard.</div>

      <br />

      <div>Best regards</div>

      <br />
      <br />

      <div className="text-right">
        <div className="font-bold">Training &amp; Placement Officer</div>
        <div className="font-bold">Indus University, Ahmedabad</div>
      </div>
    </div>
  );
}

type TableEmptyStateProps = {
  colSpan: number;
  title: string;
  description: string;
  icon?: ReactNode;
};

function TableEmptyState({ colSpan, title, description, icon }: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <div className="flex min-h-[340px] flex-col items-center justify-center border-t border-dashed bg-gradient-to-b from-muted/20 to-background px-8 py-12">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed bg-background text-3xl shadow-sm">
            <div className="text-4xl opacity-80">{icon ?? "📄"}</div>
          </div>

          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>

          <p className="mt-3 max-w-xl text-center text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </td>
    </tr>
  );
}

type WorkflowTableCardProps = {
  children: React.ReactNode;
};

function WorkflowTableCard({ children }: WorkflowTableCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <div className="max-h-[560px] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING_HOD_APPROVAL: "bg-amber-100 text-amber-800 border-amber-200",

    PENDING_PRINT: "bg-blue-100 text-blue-800 border-blue-200",

    PRINTED: "bg-indigo-100 text-indigo-800 border-indigo-200",

    ISSUED: "bg-green-100 text-green-800 border-green-200",

    COMPLETED_TENURE_PENDING_VERIFICATION: "bg-violet-100 text-violet-800 border-violet-200",

    TENURE_COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",

    ADMIN_REJECTED: "bg-red-100 text-red-700 border-red-200",

    HOD_REJECTED: "bg-red-100 text-red-700 border-red-200",

    TENURE_REJECTED: "bg-red-100 text-red-700 border-red-200",

    CANCELLED: "bg-slate-200 text-slate-700 border-slate-300",
  };

  const labels: Record<string, string> = {
    PENDING_HOD_APPROVAL: "Pending HOD",
    PENDING_PRINT: "Pending Print",
    PRINTED: "Printed",
    ISSUED: "Issued",
    COMPLETED_TENURE_PENDING_VERIFICATION: "Pending Verification",
    TENURE_COMPLETED: "Completed",
    ADMIN_REJECTED: "Rejected",
    HOD_REJECTED: "Rejected",
    TENURE_REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

type ActionButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "view" | "primary" | "success" | "warning" | "secondary" | "purple" | "danger";
};

function ActionButton({ children, onClick, variant = "view" }: ActionButtonProps) {
  const styles = {
    view: `
    border-slate-300
    bg-white
    text-slate-700
    hover:bg-slate-100
    hover:border-slate-400
  `,

    primary: `
    bg-blue-600
    border-blue-600
    text-white
    hover:bg-blue-700
    hover:border-blue-700
    shadow-sm
  `,

    success: `
    bg-emerald-600
    border-emerald-600
    text-white
    hover:bg-emerald-700
    hover:border-emerald-700
    shadow-sm
  `,

    warning: `
    bg-amber-500
    border-amber-500
    text-white
    hover:bg-amber-600
    hover:border-amber-600
    shadow-sm
  `,

    secondary: `
    bg-slate-100
    border-slate-300
    text-slate-700
    hover:bg-slate-200
  `,

    purple: `
    bg-violet-600
    border-violet-600
    text-white
    hover:bg-violet-700
  `,

    danger: `
    bg-red-50
    border-red-200
    text-red-700
    hover:bg-red-100
    hover:border-red-300
  `,
  };

  return (
    <button
      onClick={onClick}
      className={`
inline-flex
items-center
justify-center
h-9
min-w-[90px]
rounded-lg
border
px-4
text-sm
font-medium
transition-all
duration-200
${styles[variant]}
`}
    >
      {children}
    </button>
  );
}

export function AdminNocDashboardPage() {
  const [pendingApproval, setPendingApproval] = useState<any[]>([]);

  const [pendingPrint, setPendingPrint] = useState<any[]>([]);

  const [printed, setPrinted] = useState<any[]>([]);

  const [issued, setIssued] = useState<any[]>([]);

  const [cancelled, setCancelled] = useState<any[]>([]);

  const [rejected, setRejected] = useState<any[]>([]);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const [reviewMode, setReviewMode] = useState<"VIEW" | "PRINT" | null>(null);

  const [editableSnapshot, setEditableSnapshot] = useState<any>(null);

  const [customFields, setCustomFields] = useState<any>({});

  const [referenceNumbers, setReferenceNumbers] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");

  const [printing, setPrinting] = useState(false);

  const [pendingTenureVerification, setPendingTenureVerification] = useState<any[]>([]);

  const [completedTenure, setCompletedTenure] = useState<any[]>([]);

  const [history, setHistory] = useState<any[]>([]);

  const [printHistory, setPrintHistory] = useState<any[]>([]);

  const [completionPending, setCompletionPending] = useState<any[]>([]);

  const [showOnlyReprints, setShowOnlyReprints] = useState(false);

  const [showAudit, setShowAudit] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [activeWorkflowView, setActiveWorkflowView] = useState<
    "approval" | "print" | "printed" | "completion" | "verification" | "issued"
  >("approval");

  const [closedWorkflowView, setClosedWorkflowView] = useState<
    "completed" | "rejected" | "cancelled"
  >("completed");

  async function load() {
    const [
      approval,
      printQueue,
      printedData,
      issuedData,
      cancelledData,
      rejectedData,
      tenureVerification,
      completedTenureData,
    ] = await Promise.all([
      adminNocService.getByStatus("PENDING_HOD_APPROVAL"),

      adminNocService.getByStatus("PENDING_PRINT"),

      adminNocService.getByStatus("PRINTED"),

      adminNocService.getByStatus("ISSUED"),

      adminNocService.getByStatus("CANCELLED"),

      Promise.all([
        adminNocService.getByStatus("ADMIN_REJECTED"),
        adminNocService.getByStatus("HOD_REJECTED"),
        adminNocService.getByStatus("TENURE_REJECTED"),
      ]).then(([adminRejected, hodRejected, tenureRejected]) => [
        ...adminRejected,
        ...hodRejected,
        ...tenureRejected,
      ]),

      adminNocService.getByStatus("COMPLETED_TENURE_PENDING_VERIFICATION"),

      adminNocService.getByStatus("TENURE_COMPLETED"),
    ]);

    setPendingApproval(approval);

    setPendingPrint(printQueue);

    setPrinted(printedData);

    setIssued(issuedData);

    setCancelled(cancelledData);

    setRejected(rejectedData);

    setPendingTenureVerification(tenureVerification);

    const printHistoryData = await adminNocService.getPrintHistory();

    setPrintHistory(printHistoryData);

    const completionPendingRecords = issuedData.filter((request: any) => {
      const endDate = new Date(request.snapshot?.end_date);

      return endDate <= new Date() && !request.completion_submitted_at;
    });

    setCompletionPending(completionPendingRecords);

    setCompletedTenure(completedTenureData);

    setHistory([
      ...approval,
      ...printQueue,
      ...printedData,
      ...issuedData,
      ...tenureVerification,
      ...completedTenureData,
      ...rejectedData,
      ...cancelledData,
    ]);
  }

  useEffect(() => {
    load();
  }, []);

  function getDurationMonths(startDate: string, endDate: string) {
    const start = new Date(startDate);

    const end = new Date(endDate);

    const months =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    return Math.max(1, months || 1);
  }

  const currentSnapshot = {
    ...editableSnapshot,
    ...customFields,
  };

  const editableKeys = [
    "hr_prefix",
    "hr_name",
    "hr_position",
    "company_name",
    "company_address_1",
    "company_address_2",
  ];

  const hasChanges = editableKeys.some(
    (key) => String(currentSnapshot?.[key] ?? "") !== String(editableSnapshot?.[key] ?? ""),
  );

  const matchesSearch = (request: any) => {
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase();

    return [
      request.snapshot?.student_name,

      request.snapshot?.enrollment_no,

      request.snapshot?.company_name,

      request.reference_number,
    ]
      .join(" ")

      .toLowerCase()

      .includes(search);
  };

  const lifecycleRequests = [
    ...pendingApproval,
    ...pendingPrint,
    ...printed,
    ...issued,
    ...cancelled,
    ...rejected,
    ...pendingTenureVerification,
    ...completedTenure,
  ];

  const analyticsNocTypes = [
    "On Campus Internship + PPO",

    "On Campus Internship",

    "On Campus Placement",

    "Off Campus Internship + PPO",

    "Off Campus Internship",

    "Off Campus Placement",
  ];

  const nocTypeChartData = analyticsNocTypes
    .map((type) => ({
      name: type,
      value: lifecycleRequests.filter(
        (request: any) => (request.noc_type ?? request.snapshot?.noc_type) === type,
      ).length,
    }))
    .filter((item) => item.value > 0);

  const nocTypeColors = [
    "#2563EB", // Blue
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#8B5CF6", // Violet
    "#EF4444", // Red
    "#06B6D4", // Cyan
  ];

  const nocTypePieOption = {
    color: nocTypeColors,

    tooltip: {
      trigger: "item",
      formatter: "{b}<br/><b>{c}</b> Records",
    },

    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 12,
      },
    },

    series: [
      {
        type: "pie",

        radius: ["42%", "72%"],

        center: ["50%", "42%"],

        avoidLabelOverlap: true,

        minAngle: 5,

        label: {
          show: true,
          formatter: "{b}\n{c}",
          fontSize: 11,
          fontWeight: 600,
        },

        labelLine: {
          length: 10,
          length2: 12,
        },

        emphasis: {
          scale: true,
          scaleSize: 8,
        },

        data: nocTypeChartData,
      },
    ],
  };

  function getAverageApprovalHours(records: any[]) {
    const values = records
      .map((request) => {
        if (!request.submitted_at || !request.approved_at) return null;

        const diff =
          new Date(request.approved_at).getTime() - new Date(request.submitted_at).getTime();

        return diff > 0 ? diff / (1000 * 60 * 60) : null;
      })
      .filter((value): value is number => typeof value === "number");

    if (!values.length) return 0;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  const totalLifecycleRequests = lifecycleRequests.length;

  const openWorkflowCount =
    pendingApproval.length +
    pendingPrint.length +
    printed.length +
    issued.length +
    completionPending.length +
    pendingTenureVerification.length;

  const issuedAndCompletedCount = issued.length + completedTenure.length;

  const cancellationRate = totalLifecycleRequests
    ? Math.round((cancelled.length / totalLifecycleRequests) * 100)
    : 0;

  const averageApprovalHours = getAverageApprovalHours(lifecycleRequests);

  const mostCommonType = analyticsNocTypes
    .map((type) => ({
      type,
      count: lifecycleRequests.filter(
        (request: any) => (request.noc_type ?? request.snapshot?.noc_type) === type,
      ).length,
    }))
    .sort((a, b) => b.count - a.count)[0];

  const approvalSourceBuckets = Object.entries(
    lifecycleRequests.reduce((acc: Record<string, number>, request: any) => {
      const key = request.approval_source ?? "UNSET";

      acc[key] = (acc[key] ?? 0) + 1;

      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  function getBranchShortCode(branch?: string) {
    if (!branch) return "-";

    const exactMap: Record<string, string> = {
      "Computer Science Engineering": "CSE",

      "Computer Engineering": "CE",

      "Civil Engineering": "CE",

      "Mechanical Engineering": "ME",

      "Electrical Engineering": "EE",

      "Electronics and Communication Engineering": "ECE",

      "Electronics & Communication Engineering": "ECE",

      "Information Technology": "IT",

      "Artificial Intelligence and Machine Learning": "AIML",

      "Data Science": "DS",
    };

    const exact = exactMap[branch.trim()];

    if (exact) return exact;

    const code = branch
      .split(/\s+/)
      .filter((word) => !["and", "&", "of", "the"].includes(word.toLowerCase()))
      .map((word) => word.trim().charAt(0))
      .join("")
      .toUpperCase();

    return code || branch;
  }

  async function handleExportNocExcel() {
    if (exporting) return;

    setExporting(true);

    try {
      const [allRequests, printHistoryRows] = await Promise.all([
        adminNocService.getRequests(),

        adminNocService.getPrintHistory(),
      ]);

      const reprintedRequestIds = new Set(
        printHistoryRows
          .filter((row: any) => row.action_type === "REPRINT")
          .map((row: any) => row.noc_request_id),
      );

      const exportRows = allRequests
        .filter(
          (request: any) =>
            request.issued_at ||
            request.completion_verified_at ||
            request.tenure_completed_at ||
            request.cancelled_at,
        )
        .slice()
        .sort((a: any, b: any) => {
          const aTime = new Date(
            a.issued_at ??
              a.completion_verified_at ??
              a.tenure_completed_at ??
              a.cancelled_at ??
              a.created_at,
          ).getTime();

          const bTime = new Date(
            b.issued_at ??
              b.completion_verified_at ??
              b.tenure_completed_at ??
              b.cancelled_at ??
              b.created_at,
          ).getTime();

          return aTime - bTime;
        });

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "Indus Placement Nexus";

      workbook.created = new Date();

      const sheet = workbook.addWorksheet("NOC Export");

      sheet.pageSetup.orientation = "landscape";

      sheet.pageSetup.paperSize = 9;

      sheet.pageSetup.fitToPage = true;

      sheet.pageSetup.fitToWidth = 1;

      sheet.pageSetup.fitToHeight = 0;

      sheet.views = [
        {
          state: "frozen",
          ySplit: 1,
        },
      ];

      sheet.columns = [
        { width: 8 },
        { width: 12 },
        { width: 24 },
        { width: 16 },
        { width: 12 },
        { width: 12 },
        { width: 10 },
        { width: 14 },
        { width: 14 },
        { width: 16 },
        { width: 34 },
        { width: 12 },
        { width: 24 },
        { width: 28 },
        { width: 30 },
        { width: 42 },
        { width: 42 },
        { width: 14 },
        { width: 16 },
      ];

      const headers = [
        "Sr. No.",
        "Student Prefix",
        "Student Name",
        "Enrollment No",
        "Institute",
        "Course",
        "Semester",
        "Start Date",
        "End Date",
        "Duration (Months)",
        "Institute Full Name",
        "HR Prefix",
        "HR Name",
        "HR Position",
        "Company Name",
        "Company Address 1",
        "Company Address 2",
        "Ref. No.",
        "NOC_Issued_On",
      ];

      const headerRow = sheet.addRow(headers);

      headerRow.height = 22;

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFFFFF00",
          },
        };

        cell.font = {
          bold: true,
          color: {
            argb: "FF000000",
          },
        };

        cell.border = {
          top: {
            style: "thin",
          },
          left: {
            style: "thin",
          },
          bottom: {
            style: "thin",
          },
          right: {
            style: "thin",
          },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      });

      const centerColumns = new Set([1, 7, 8, 9, 10, 18, 19]);

      exportRows.forEach((request: any, index: number) => {
        const snapshot = request.snapshot ?? {};

        const startDate = snapshot.start_date ? new Date(snapshot.start_date) : null;

        const endDate = snapshot.end_date ? new Date(snapshot.end_date) : null;

        const issuedOn =
          request.issued_at ??
          request.completion_verified_at ??
          request.tenure_completed_at ??
          request.cancelled_at ??
          null;

        const issuedDate = issuedOn ? new Date(issuedOn) : null;

        const row = sheet.addRow([
          index + 1,
          snapshot.student_prefix ?? "Mr./Ms.",
          snapshot.student_name ?? "-",
          snapshot.enrollment_no ?? "-",
          snapshot.institute_name ?? "-",
          getBranchShortCode(snapshot.branch ?? request.noc_type),
          snapshot.semester ?? "-",
          startDate,
          endDate,
          getDurationMonths(snapshot.start_date, snapshot.end_date),
          snapshot.institute_full_name ?? "Indus Institute of Technology and Engineering",
          snapshot.hr_prefix ?? "-",
          snapshot.hr_name ?? "-",
          snapshot.hr_position ?? "-",
          snapshot.company_name ?? "-",
          snapshot.company_address_1 ?? "-",
          snapshot.company_address_2 ?? "-",
          request.reference_number ?? "-",
          issuedDate,
        ]);

        row.height = 20;

        const isRedRow =
          request.status === "CANCELLED" ||
          Number(request.print_count ?? 0) > 1 ||
          reprintedRequestIds.has(request.noc_request_id);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: {
              style: "thin",
            },
            left: {
              style: "thin",
            },
            bottom: {
              style: "thin",
            },
            right: {
              style: "thin",
            },
          };

          cell.alignment = {
            horizontal: centerColumns.has(colNumber) ? "center" : "left",
            vertical: "middle",
            wrapText: true,
          };

          cell.font = {
            color: {
              argb: "FF000000",
            },
          };

          if (isRedRow) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: "FFFF0000",
              },
            };
          }
        });

        row.getCell(8).numFmt = "dd/mm/yyyy";
        row.getCell(9).numFmt = "dd/mm/yyyy";
        row.getCell(19).numFmt = "dd/mm/yyyy";
      });

      sheet.autoFilter = "A1:S1";

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `NOC_Export_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-8 px-8 py-8">
      <div className="relative overflow-hidden rounded-[32px] border border-blue-200 bg-gradient-to-r from-sky-700 via-blue-700 to-cyan-600 p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100">
              Administration Workspace
            </div>

            <h1 className="mt-3 text-5xl font-bold tracking-tight">NOC Workflow</h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100">
              Review, approve, print, verify and manage the complete No Objection Certificate
              lifecycle from one centralized workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur">
                Pending Approval : <strong>{pendingApproval.length}</strong>
              </div>

              <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur">
                Open Workflow : <strong>{openWorkflowCount}</strong>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
              <div className="text-sm uppercase tracking-wide text-cyan-100">Total Records</div>

              <div className="mt-2 text-5xl font-bold">{lifecycleRequests.length}</div>

              <div className="mt-2 text-sm text-cyan-100">Across every workflow stage</div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
              <div className="text-sm uppercase tracking-wide text-cyan-100">Avg Approval</div>

              <div className="mt-2 text-5xl font-bold">
                {averageApprovalHours ? averageApprovalHours.toFixed(1) : "-"}
              </div>

              <div className="mt-2 text-sm text-cyan-100">Hours</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <div
          className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              Total NOCs
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">{lifecycleRequests.length}</div>

          <div className="mt-3 text-sm text-muted-foreground">Live workflow count</div>
        </div>

        <div
          className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Pending Approval
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">{pendingApproval.length}</div>

          <div className="mt-3 text-sm text-muted-foreground">Awaiting HOD approval</div>
        </div>

        <div
          className="
    group
    relative
    overflow-hidden
    rounded-3xl
    border
    border-slate-200
    bg-white
    p-6
    shadow-md
    transition-all
    duration-300
    hover:-translate-y-2
    hover:shadow-xl
  "
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Pending Print
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">{pendingPrint.length}</div>

          <div className="mt-3 text-sm text-muted-foreground">Ready for printing</div>
        </div>

        <div
          className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              Printed
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">{printed.length}</div>

          <div className="mt-3 text-sm text-muted-foreground">Waiting to be issued</div>
        </div>

        <div
          className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Issued
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">{issued.length}</div>

          <div className="mt-3 text-sm text-muted-foreground">Successfully issued</div>
        </div>

        <div
          className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Cancelled
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">{cancelled.length}</div>

          <div className="mt-3 text-sm text-muted-foreground">Cancelled requests</div>
        </div>

        <div
          className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Tenure Completion
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">{completionPending.length}</div>

          <div className="mt-3 text-sm text-muted-foreground">Awaiting completion</div>
        </div>

        <div
          className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              Verification
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">
            {pendingTenureVerification.length}
          </div>

          <div className="mt-3 text-sm text-muted-foreground">Verification required</div>
        </div>

        <div
          className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Completed Tenure
            </span>
          </div>

          <div className="mt-4 text-5xl font-bold tracking-tight">{completedTenure.length}</div>

          <div className="mt-3 text-sm text-muted-foreground">Successfully verified</div>
        </div>
      </div>

      <div
        className="
mt-2
rounded-[32px]
border
border-slate-200
bg-white
p-8
shadow-md
"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">NOC Analytics Dashboard</h2>

            <p className="text-sm text-muted-foreground">
              Live snapshot from the current NOC queues and lifecycle timestamps.
            </p>
          </div>

          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Last refreshed: Client Time
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div
            className="
group
rounded-2xl
border
border-slate-200
bg-white
p-5
shadow-sm
transition-all
duration-300
hover:-translate-y-1
hover:shadow-lg
"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Open workflow items
            </div>

            <div className="mt-4 text-5xl font-bold tracking-tight">{openWorkflowCount}</div>
          </div>

          <div
            className="
group
rounded-2xl
border
border-slate-200
bg-white
p-5
shadow-sm
transition-all
duration-300
hover:-translate-y-1
hover:shadow-lg
"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Issued / completed
            </div>

            <div className="mt-4 text-5xl font-bold tracking-tight">{issuedAndCompletedCount}</div>
          </div>

          <div
            className="
group
rounded-2xl
border
border-slate-200
bg-white
p-5
shadow-sm
transition-all
duration-300
hover:-translate-y-1
hover:shadow-lg
"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Cancelled rate
            </div>

            <div className="mt-4 text-5xl font-bold tracking-tight">{cancellationRate}%</div>
          </div>

          <div
            className="
group
rounded-2xl
border
border-slate-200
bg-white
p-5
shadow-sm
transition-all
duration-300
hover:-translate-y-1
hover:shadow-lg
"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Avg. approval time
            </div>
            <div className="mt-4 text-5xl font-bold tracking-tight">
              {averageApprovalHours ? `${averageApprovalHours.toFixed(1)} hrs` : "-"}
            </div>
          </div>
        </div>

        <div
          className="
    mt-6
    grid
    gap-6
    grid-cols-1
    xl:grid-cols-2
"
        >
          <div
            className="
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
"
          >
            <h3 className="text-base font-semibold">NOC Type Mix</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Distribution of NOC request categories.
            </p>

            <div className="mt-4 h-[300px] w-full">
              <ReactECharts
                option={nocTypePieOption}
                style={{
                  height: "100%",
                  width: "100%",
                }}
                opts={{
                  renderer: "svg",
                }}
              />
            </div>

            {mostCommonType && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Most Common</span>

                <span className="ml-2 font-semibold">{mostCommonType.type}</span>

                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  {mostCommonType.count}
                </span>
              </div>
            )}
          </div>

          <div
            className="
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-md
"
          >
            <h3 className="mb-4 text-base font-semibold">Approval Source Mix</h3>

            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {approvalSourceBuckets.length ? (
                approvalSourceBuckets.map(([label, count]) => {
                  const percent = totalLifecycleRequests
                    ? Math.round((count / totalLifecycleRequests) * 100)
                    : 0;

                  return (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{label === "UNSET" ? "Not set yet" : label}</span>

                        <span>{count}</span>
                      </div>

                      <div className="h-2 rounded bg-slate-200">
                        <div
                          className="h-2 rounded bg-slate-900"
                          style={{
                            width: `${percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  No approval source data yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="
rounded-[30px]
border
border-slate-200
bg-white
p-6
shadow-md
"
      >
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="
Search Name / Enrollment / Company / Ref No
"
          className="
w-full
rounded-xl
border
bg-background
px-4
py-3
text-sm
shadow-sm
focus:ring-2
focus:ring-primary/20
"
        />

        <div
          className="
        mt-2
        flex
        flex-wrap
        items-center
        justify-between
        gap-2
    "
        >
          <button
            onClick={() => {
              setSearchTerm("");
            }}
            className="
            rounded
            border
            px-3
            py-1
            text-sm
        "
          >
            Clear Search
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="secondary" onClick={() => setShowAudit(!showAudit)}>
              {showAudit ? "Hide Audit" : "Show Audit"}
            </ActionButton>

            <button
              onClick={handleExportNocExcel}
              disabled={exporting}
              className="
         rounded-xl
border
border-slate-200
bg-white
px-4
py-2
text-sm
font-medium
transition-all
hover:-translate-y-0.5
hover:border-blue-300
hover:bg-blue-50
hover:shadow-md
            "
            >
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          Search Result: <strong>{searchTerm ? searchTerm : "All Records"}</strong>
        </div>
      </div>

      <div
        className="
sticky
top-4
z-20
overflow-hidden
rounded-[30px]
border
border-emerald-200
bg-gradient-to-r
from-emerald-50
via-white
to-sky-50
p-8
shadow-lg
"
      >
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-40 w-40 rounded-full bg-sky-200/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 mb-10 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  🟢
                </div>

                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-emerald-900">
                    Active Workflow
                  </h2>

                  <p className="mt-1 mb-8 text-sm text-emerald-700">
                    NOC Requests currently moving through the approval, printing and verification
                    pipeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveWorkflowView("approval")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  activeWorkflowView === "approval"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Pending Approval ({pendingApproval.length})
              </button>

              <button
                onClick={() => setActiveWorkflowView("print")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  activeWorkflowView === "print"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Pending Print ({pendingPrint.length})
              </button>

              <button
                onClick={() => setActiveWorkflowView("printed")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  activeWorkflowView === "printed"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Printed ({printed.length})
              </button>

              <button
                onClick={() => setActiveWorkflowView("completion")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  activeWorkflowView === "completion"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Completion Pending ({completionPending.length})
              </button>

              <button
                onClick={() => setActiveWorkflowView("verification")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  activeWorkflowView === "verification"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Verification ({pendingTenureVerification.length})
              </button>

              <button
                onClick={() => setActiveWorkflowView("issued")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  activeWorkflowView === "issued"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Issued ({issued.length})
              </button>
            </div>
          </div>
        </div>

        {activeWorkflowView === "approval" && (
          <>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70 
backdrop-blur
"
                >
                  <tr
                    className="
    border-b
    odd:bg-white
    even:bg-slate-50/60
    hover:bg-blue-50
    transition-colors
  "
                  >
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Branch
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Type
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Status
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Approval Source
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {pendingApproval.filter(matchesSearch).length === 0 ? (
                    <TableEmptyState
                      colSpan={8}
                      icon="📋"
                      title="No Pending Approval Requests"
                      description="New requests awaiting HOD approval will automatically appear here."
                    />
                  ) : (
                    pendingApproval
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                      )
                      .filter(matchesSearch)
                      .slice(0, 100)
                      .map((request: any) => (
                        <tr
                          key={request.noc_request_id}
                          className="
        border-b
        odd:bg-white
        even:bg-slate-50/60
        hover:bg-blue-50
        transition-colors
    "
                        >
                          <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                          <td
                            className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                          >
                            {request.snapshot?.enrollment_no}
                          </td>

                          <td className="px-4 py-5">{request.snapshot?.branch}</td>

                          <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                          <td className="px-4 py-5">{request.noc_type}</td>

                          <td className="px-4 py-5">
                            <StatusBadge status={request.status} />
                          </td>

                          <td className="px-4 py-5">{request.approval_source || "-"}</td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <ActionButton
                                variant="view"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewMode("VIEW");
                                  setEditableSnapshot(structuredClone(request.snapshot));
                                  setCustomFields(request.noc_customization ?? {});
                                }}
                              >
                                View
                              </ActionButton>

                              <ActionButton
                                variant="primary"
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    "Override HOD approval and move directly to Pending Print?",
                                  );

                                  if (!confirmed) return;

                                  await adminNocService.moveToPendingPrint(request.noc_request_id);

                                  await load();
                                }}
                              >
                                Override
                              </ActionButton>

                              <ActionButton
                                variant="danger"
                                onClick={async () => {
                                  const reason = prompt("Enter rejection reason");

                                  if (!reason?.trim()) {
                                    alert("Reason is required");
                                    return;
                                  }

                                  await adminNocService.rejectRequest(
                                    request.noc_request_id,
                                    reason,
                                  );

                                  load();
                                }}
                              >
                                Reject
                              </ActionButton>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </WorkflowTableCard>
          </>
        )}

        {activeWorkflowView === "print" && (
          <>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                >
                  <tr
                    className="
    border-b
    odd:bg-white
    even:bg-slate-50/60
    hover:bg-blue-50
    transition-colors
  "
                  >
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
    sticky
    left-0
    bg-white
   z-10
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Branch
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Type
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Approval Source
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {pendingPrint.filter(matchesSearch).length === 0 ? (
                    <TableEmptyState
                      colSpan={7}
                      icon="🖨️"
                      title="Nothing Waiting For Print"
                      description="Approved NOCs waiting for printing will appear here."
                    />
                  ) : (
                    pendingPrint
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                      )

                      .filter(matchesSearch)
                      .slice(0, 100)
                      .map((request: any) => (
                        <tr
                          key={request.noc_request_id}
                          className="
        border-b
        odd:bg-white
        even:bg-slate-50/60
        hover:bg-blue-50
        transition-colors
    "
                        >
                          <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                          <td
                            className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                          >
                            {request.snapshot?.enrollment_no}
                          </td>

                          <td className="px-4 py-5">{request.snapshot?.branch}</td>

                          <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                          <td className="px-4 py-5">{request.noc_type}</td>

                          <td className="px-4 py-5">{request.approval_source || "-"}</td>

                          <td className="px-4 py-5">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);

                                setReviewMode("PRINT");

                                setEditableSnapshot(structuredClone(request.snapshot));

                                setCustomFields(request.noc_customization ?? {});
                              }}
                              className="rounded-xl
border
border-slate-200
bg-white
px-4
py-2
text-sm
font-medium
transition-all
hover:-translate-y-0.5
hover:border-blue-300
hover:bg-blue-50
hover:shadow-md"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </WorkflowTableCard>
          </>
        )}

        {activeWorkflowView === "printed" && (
          <>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                >
                  <tr
                    className="
    border-b
    odd:bg-white
    even:bg-slate-50/60
    hover:bg-blue-50
    transition-colors
  "
                  >
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Branch
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Type
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Ref No
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Printed At
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Prints
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {printed.filter(matchesSearch).length === 0 ? (
                    <TableEmptyState
                      colSpan={9}
                      icon="🖨️"
                      title="No Printed NOCs"
                      description="Printed NOCs awaiting issue will appear here."
                    />
                  ) : (
                    printed
                      .slice()

                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                      )

                      .filter(matchesSearch)
                      .slice(0, 100)
                      .map((request: any) => (
                        <tr
                          key={request.noc_request_id}
                          className="border-b odd:bg-background even:bg-muted/20 hover:bg-primary/5 transition-colors"
                        >
                          <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                          <td
                            className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                          >
                            {request.snapshot?.enrollment_no}
                          </td>

                          <td className="px-4 py-5">{request.snapshot?.branch}</td>

                          <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                          <td className="px-4 py-5">{request.noc_type}</td>

                          <td className="px-4 py-5">
                            <input
                              type="number"
                              min="1"
                              value={
                                referenceNumbers[request.noc_request_id] ??
                                request.reference_number ??
                                ""
                              }
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");

                                setReferenceNumbers((prev) => ({
                                  ...prev,

                                  [request.noc_request_id]: value,
                                }));
                              }}
                              className="rounded border p-2"
                            />
                          </td>

                          <td className="px-4 py-5">
                            {request.printed_at
                              ? new Date(request.printed_at).toLocaleString()
                              : "-"}
                          </td>

                          <td className="px-4 py-5">{request.print_count ?? 0}</td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <ActionButton
                                variant="view"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewMode("VIEW");
                                  setEditableSnapshot(structuredClone(request.snapshot));
                                  setCustomFields(request.noc_customization ?? {});
                                }}
                              >
                                View
                              </ActionButton>

                              <ActionButton
                                variant="warning"
                                onClick={async () => {
                                  const refNumber = (
                                    referenceNumbers[request.noc_request_id] ??
                                    request.reference_number ??
                                    ""
                                  ).trim();

                                  if (!refNumber) {
                                    alert("Save Reference Number before reprint.");

                                    return;
                                  }

                                  if (refNumber !== request.reference_number) {
                                    await adminNocService.saveReferenceNumber(
                                      request.noc_request_id,
                                      refNumber,
                                    );
                                  }

                                  const reason = window.prompt("Enter reason for reprint");

                                  if (!reason || !reason.trim()) {
                                    return;
                                  }

                                  await adminNocService.reprintNoc(request.noc_request_id, reason);

                                  setReferenceNumbers((prev) => {
                                    const next = {
                                      ...prev,
                                    };

                                    delete next[request.noc_request_id];

                                    return next;
                                  });

                                  await load();

                                  alert("Moved back to Pending Print");
                                }}
                              >
                                Reprint
                              </ActionButton>

                              <ActionButton
                                variant="success"
                                onClick={async () => {
                                  const refNumber =
                                    referenceNumbers[request.noc_request_id]?.trim();

                                  if (!refNumber || !refNumber.trim()) {
                                    alert("Reference Number is required.");
                                    return;
                                  }

                                  if (request.reference_number) {
                                    alert("Reference Number already saved and cannot be modified.");

                                    return;
                                  }

                                  await adminNocService.saveReferenceNumber(
                                    request.noc_request_id,

                                    refNumber,
                                  );

                                  await load();

                                  alert("Reference Number Saved");
                                }}
                              >
                                Save Ref
                              </ActionButton>

                              <ActionButton
                                variant="success"
                                onClick={async () => {
                                  const refNumber = (
                                    referenceNumbers[request.noc_request_id] ??
                                    request.reference_number ??
                                    ""
                                  ).trim();

                                  if (!refNumber) {
                                    alert("Save Reference Number First");

                                    return;
                                  }

                                  if (refNumber !== request.reference_number) {
                                    await adminNocService.saveReferenceNumber(
                                      request.noc_request_id,
                                      refNumber,
                                    );
                                  }

                                  await adminNocService.issueRequest(request.noc_request_id);

                                  await load();
                                }}
                              >
                                Issue
                              </ActionButton>

                              <ActionButton
                                variant="danger"
                                onClick={async () => {
                                  const refNumber = (
                                    referenceNumbers[request.noc_request_id] ??
                                    request.reference_number ??
                                    ""
                                  ).trim();

                                  if (!refNumber) {
                                    alert("Save Reference Number First");

                                    return;
                                  }

                                  if (refNumber !== request.reference_number) {
                                    await adminNocService.saveReferenceNumber(
                                      request.noc_request_id,
                                      refNumber,
                                    );
                                  }

                                  const reason = prompt("Enter cancellation reason");

                                  if (!reason?.trim()) {
                                    alert("Reason is required");
                                    return;
                                  }

                                  await adminNocService.cancelRequest(
                                    request.noc_request_id,
                                    reason,
                                  );

                                  await load();
                                }}
                              >
                                Cancel
                              </ActionButton>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </WorkflowTableCard>
          </>
        )}

        {activeWorkflowView === "completion" && (
          <>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                >
                  <tr
                    className="
    border-b
    odd:bg-white
    even:bg-slate-50/60
    hover:bg-blue-50
    transition-colors
  "
                  >
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
    sticky
    left-0
    bg-white
   z-10
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      End Date
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {completionPending.filter(matchesSearch).length === 0 ? (
                    <TableEmptyState
                      colSpan={5}
                      icon="⏳"
                      title="No Completion Pending"
                      description="Students awaiting completion verification will appear here."
                    />
                  ) : (
                    completionPending.slice(0, 100).map((request: any) => (
                      <tr
                        key={request.noc_request_id}
                        className="
        border-b
        odd:bg-white
        even:bg-slate-50/60
        hover:bg-blue-50
        transition-colors
    "
                      >
                        <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                        <td
                          className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                        >
                          {request.snapshot?.enrollment_no}
                        </td>

                        <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                        <td className="px-4 py-5">{request.snapshot?.end_date}</td>

                        <td className="p-3 text-red-600 font-medium">
                          Waiting For Student Completion Submission
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </WorkflowTableCard>
          </>
        )}

        {activeWorkflowView === "verification" && (
          <>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                >
                  <tr
                    className="
    border-b
    odd:bg-white
    even:bg-slate-50/60
    hover:bg-blue-50
    transition-colors
  "
                  >
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      End Date
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Completion Details
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {pendingTenureVerification.filter(matchesSearch).length === 0 ? (
                    <TableEmptyState
                      colSpan={5}
                      icon="✅"
                      title="No Verification Pending"
                      description="Tenure verification requests will appear here."
                    />
                  ) : (
                    pendingTenureVerification

                      .slice()

                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                      )

                      .filter(matchesSearch)

                      .slice(0, 100)
                      .map((request: any) => (
                        <tr
                          key={request.noc_request_id}
                          className="
        border-b
        odd:bg-white
        even:bg-slate-50/60
        hover:bg-blue-50
        transition-colors
    "
                        >
                          <td className="p-3 align-top">{request.snapshot?.student_name}</td>

                          <td
                            className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
 align-top"
                          >
                            {request.snapshot?.enrollment_no}
                          </td>

                          <td className="p-3 align-top">{request.snapshot?.company_name}</td>

                          <td className="p-3 align-top">{request.snapshot?.end_date}</td>

                          <td className="px-4 py-5">
                            <div className="space-y-2 text-sm">
                              <div>
                                <strong>Email:</strong> {request.completion_hr_email ?? "-"}
                              </div>

                              <div>
                                <strong>Contact:</strong> {request.completion_hr_contact ?? "-"}
                              </div>

                              <div>
                                <strong>HR:</strong>{" "}
                                {request.completion_same_hr
                                  ? (request.snapshot?.hr_name ?? "Same HR")
                                  : (request.completion_hr_name ?? "-")}
                              </div>

                              <div>
                                <strong>Designation:</strong>{" "}
                                {request.completion_same_hr
                                  ? (request.snapshot?.hr_position ?? "-")
                                  : (request.completion_hr_designation ?? "-")}
                              </div>

                              <div>
                                <strong>Certificate:</strong>{" "}
                                {request.completion_certificate_url ? (
                                  <ActionButton
                                    variant="primary"
                                    onClick={async () => {
                                      const url = await adminNocService.getCertificateUrl(
                                        request.completion_certificate_url,
                                      );

                                      window.open(url, "_blank");
                                    }}
                                  >
                                    View Certificate
                                  </ActionButton>
                                ) : (
                                  "-"
                                )}
                              </div>

                              <div className="pt-3 flex flex-wrap gap-2">
                                <ActionButton
                                  variant="view"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setReviewMode("VIEW");
                                    setEditableSnapshot(structuredClone(request.snapshot));
                                    setCustomFields(request.noc_customization ?? {});
                                  }}
                                >
                                  View
                                </ActionButton>

                                <button
                                  onClick={async () => {
                                    if (
                                      !request.completion_submitted_at ||
                                      !request.completion_certificate_url ||
                                      !request.completion_hr_email ||
                                      !request.completion_hr_contact
                                    ) {
                                      alert("Student has not submitted completion details.");

                                      return;
                                    }

                                    await adminNocService.approveTenureCompletion(
                                      request.noc_request_id,
                                    );

                                    await load();
                                  }}
                                  className="rounded-xl
border
border-slate-200
bg-white
px-4
py-2
text-sm
font-medium
transition-all
hover:-translate-y-0.5
hover:border-blue-300
hover:bg-blue-50
hover:shadow-md"
                                >
                                  Approve
                                </button>

                                <ActionButton
                                  variant="danger"
                                  onClick={async () => {
                                    const reason = prompt("Enter rejection reason");

                                    if (!reason?.trim()) {
                                      alert("Reason is required");
                                      return;
                                    }

                                    await adminNocService.rejectRequest(
                                      request.noc_request_id,
                                      reason,
                                    );

                                    load();
                                  }}
                                >
                                  Reject
                                </ActionButton>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </WorkflowTableCard>
          </>
        )}

        {activeWorkflowView === "issued" && (
          <>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70 
backdrop-blur
"
                >
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Duration
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Type
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Ref No
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Issued At
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {issued.filter(matchesSearch).length === 0 ? (
                    <TableEmptyState
                      colSpan={8}
                      icon="📄"
                      title="No Issued NOCs"
                      description="Issued NOC records will appear here."
                    />
                  ) : (
                    issued
                      .slice()

                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                      )

                      .filter(matchesSearch)
                      .slice(0, 100)
                      .map((request: any) => (
                        <tr
                          key={request.noc_request_id}
                          className="border-b odd:bg-background even:bg-muted/20 hover:bg-primary/5 transition-colors"
                        >
                          <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                          <td
                            className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                          >
                            {request.snapshot?.enrollment_no}
                          </td>

                          <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                          <td className="px-4 py-5">
                            {getDurationMonths(
                              request.snapshot?.start_date,
                              request.snapshot?.end_date,
                            )}
                            Month(s)
                          </td>

                          <td className="px-4 py-5">{request.noc_type}</td>

                          <td className="px-4 py-5">{request.reference_number}</td>

                          <td className="px-4 py-5">
                            {request.issued_at ? new Date(request.issued_at).toLocaleString() : "-"}
                          </td>

                          <td className="px-4 py-5">
                            <ActionButton
                              variant="view"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewMode("VIEW");
                                setEditableSnapshot(structuredClone(request.snapshot));
                                setCustomFields(request.noc_customization ?? {});
                              }}
                            >
                              View
                            </ActionButton>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </WorkflowTableCard>
          </>
        )}
      </div>

      <div
        className="
    mt-10
    overflow-hidden
    rounded-[30px]
    border
    border-rose-200
    bg-gradient-to-r
    from-rose-50
    via-white
    to-orange-50
    p-8
    shadow-lg
"
      >
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-rose-200/20 blur-3xl" />
        <div className="absolute left-1/4 bottom-0 h-40 w-40 rounded-full bg-orange-200/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 mb-10 items-center justify-center rounded-2xl bg-rose-100 text-2xl">
                  📦
                </div>

                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-rose-900">
                    Closed Workflow
                  </h2>

                  <p className="mt-1 text-sm mb-8 text-rose-700">
                    Completed, cancelled and rejected NOC requests archived for future reference.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setClosedWorkflowView("completed")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  closedWorkflowView === "completed"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Completed Tenure ({completedTenure.length})
              </button>

              <button
                onClick={() => setClosedWorkflowView("rejected")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  closedWorkflowView === "rejected"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Rejected ({rejected.length})
              </button>

              <button
                onClick={() => setClosedWorkflowView("cancelled")}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  closedWorkflowView === "cancelled"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-background hover:bg-muted hover:border-primary/40"
                }`}
              >
                Cancelled ({cancelled.length})
              </button>
            </div>
          </div>
        </div>

        {closedWorkflowView === "completed" && (
          <>
            <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full">
                  <thead
                    className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                  >
                    <tr
                      className="
    border-b
    odd:bg-white
    even:bg-slate-50/60
    hover:bg-blue-50
    transition-colors
  "
                    >
                      <th
                        className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                      >
                        Student
                      </th>

                      <th
                        className="
    p-3
    text-left
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                      >
                        Enrollment
                      </th>

                      <th
                        className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                      >
                        Company
                      </th>

                      <th
                        className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                      >
                        Verified At
                      </th>

                      <th
                        className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                      >
                        Certificate
                      </th>

                      <th
                        className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                      >
                        HR Email
                      </th>

                      <th
                        className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-background">
                    {completedTenure.filter(matchesSearch).length === 0 ? (
                      <TableEmptyState
                        colSpan={7}
                        icon="🎉"
                        title="No Completed Tenure Records"
                        description="Verified tenure completion records will appear here."
                      />
                    ) : (
                      completedTenure

                        .slice()

                        .sort(
                          (a, b) =>
                            new Date(b.completion_verified_at).getTime() -
                            new Date(a.completion_verified_at).getTime(),
                        )

                        .filter(matchesSearch)
                        .slice(0, 100)
                        .map((request: any) => (
                          <tr
                            key={request.noc_request_id}
                            className="
        border-b
        odd:bg-white
        even:bg-slate-50/60
        hover:bg-blue-50
        transition-colors
    "
                          >
                            <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                            <td
                              className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                            >
                              {request.snapshot?.enrollment_no}
                            </td>

                            <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                            <td className="px-4 py-5">
                              {request.completion_verified_at
                                ? new Date(request.completion_verified_at).toLocaleString()
                                : "-"}
                            </td>

                            <td className="px-4 py-5">
                              {request.completion_certificate_url ? (
                                <ActionButton
                                  variant="primary"
                                  onClick={async () => {
                                    const url = await adminNocService.getCertificateUrl(
                                      request.completion_certificate_url,
                                    );

                                    window.open(url, "_blank");
                                  }}
                                >
                                  View
                                </ActionButton>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td className="px-4 py-5">{request.completion_hr_email ?? "-"}</td>

                            <td className="px-4 py-5">
                              <ActionButton
                                variant="view"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewMode("VIEW");
                                  setEditableSnapshot(structuredClone(request.snapshot));
                                  setCustomFields(request.noc_customization ?? {});
                                }}
                              >
                                View
                              </ActionButton>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {closedWorkflowView === "rejected" && (
          <>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                >
                  <tr
                    className="
    border-b
    odd:bg-white
    even:bg-slate-50/60
    hover:bg-blue-50
    transition-colors
  "
                  >
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Type
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Rejected By
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Reason
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {rejected.filter(matchesSearch).length === 0 ? (
                    <TableEmptyState
                      colSpan={7}
                      icon="❌"
                      title="No Rejected Requests"
                      description="Rejected NOC requests will appear here."
                    />
                  ) : (
                    rejected.map((request: any) => (
                      <tr
                        key={request.noc_request_id}
                        className="
        border-b
        odd:bg-white
        even:bg-slate-50/60
        hover:bg-blue-50
        transition-colors
    "
                      >
                        <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                        <td
                          className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                        >
                          {request.snapshot?.enrollment_no}
                        </td>

                        <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                        <td className="px-4 py-5">{request.noc_type}</td>

                        <td>{request.rejected_by ?? request.tenure_rejected_by ?? "-"}</td>

                        <td>
                          {request.rejection_reason ?? request.tenure_rejection_reason ?? "-"}
                        </td>

                        <td className="px-4 py-5">
                          <ActionButton
                            variant="view"
                            onClick={() => {
                              setSelectedRequest(request);
                              setReviewMode("VIEW");
                              setEditableSnapshot(structuredClone(request.snapshot));
                              setCustomFields(request.noc_customization ?? {});
                            }}
                          >
                            View
                          </ActionButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </WorkflowTableCard>
          </>
        )}

        {closedWorkflowView === "cancelled" && (
          <>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                >
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Type
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Ref No
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Cancelled By
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Print Version
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Reason
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Cancelled At
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {cancelled.filter(matchesSearch).length === 0 ? (
                    <TableEmptyState
                      colSpan={9}
                      icon="🚫"
                      title="No Cancelled Requests"
                      description="Cancelled NOC requests will appear here."
                    />
                  ) : (
                    cancelled

                      .slice()

                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                      )

                      .filter(matchesSearch)
                      .slice(0, 100)
                      .map((request: any) => (
                        <tr
                          key={request.noc_request_id}
                          className="border-b odd:bg-background even:bg-muted/20 hover:bg-primary/5 transition-colors"
                        >
                          <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                          <td
                            className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                          >
                            {request.snapshot?.enrollment_no}
                          </td>

                          <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                          <td className="px-4 py-5">{request.noc_type}</td>

                          <td className="px-4 py-5">{request.reference_number ?? "-"}</td>

                          <td className="px-4 py-5">{request.cancelled_by ?? "ADMIN"}</td>

                          <td className="px-4 py-5">{request.print_count ?? 1}</td>

                          <td
                            className="
        p-3
        max-w-[300px]
        truncate
    "
                            title={request.cancellation_reason ?? ""}
                          >
                            {request.cancellation_reason ?? "-"}
                          </td>

                          <td className="px-4 py-5">
                            {request.cancelled_at
                              ? new Date(request.cancelled_at).toLocaleString()
                              : "-"}
                          </td>

                          <td className="px-4 py-5">
                            <ActionButton
                              variant="view"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewMode("VIEW");
                                setEditableSnapshot(structuredClone(request.snapshot));
                                setCustomFields(request.noc_customization ?? {});
                              }}
                            >
                              View
                            </ActionButton>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </WorkflowTableCard>
          </>
        )}
      </div>

      {showAudit && (
        <div
          className="
    mt-8
    rounded-[30px]
    border
    border-slate-200
    bg-white
    p-8
    shadow-md
    animate-in
    fade-in
    duration-300
  "
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Audit Workspace
              </div>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">Audit & Reports</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Review workflow history, print logs and reprint activities from a single audit
                workspace.
              </p>
            </div>

            <ActionButton variant="secondary" onClick={() => setShowAudit(false)}>
              Hide Audit
            </ActionButton>
          </div>

          <div className="mt-8 space-y-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-semibold">📋 Workflow History</h3>

                <p className="text-sm text-muted-foreground">
                  Complete lifecycle history of every NOC request.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium">
                {history.length} Records
              </div>
            </div>
            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                >
                  <tr
                    className="
    border-b
    odd:bg-white
    even:bg-slate-50/60
    hover:bg-blue-50
    transition-colors
  "
                  >
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="
    p-3
    text-left
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                    >
                      Enrollment
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Status
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {history.slice(0, 100).map((request: any) => (
                    <tr
                      key={request.noc_request_id}
                      className="
        border-b
        odd:bg-white
        even:bg-slate-50/60
        hover:bg-blue-50
        transition-colors
    "
                    >
                      <td className="px-4 py-5">{request.snapshot?.student_name}</td>

                      <td
                        className="
    p-3
sticky
left-0
z-20
bg-inherit
backdrop-blur
shadow-[8px_0_10px_-10px_rgba(0,0,0,0.18)]
"
                      >
                        {request.snapshot?.enrollment_no}
                      </td>

                      <td className="px-4 py-5">{request.snapshot?.company_name}</td>

                      <td className="px-4 py-5">{request.status}</td>

                      <td className="px-4 py-5">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </WorkflowTableCard>

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-semibold">🖨 Print & Reprint History</h3>

                <p className="text-sm text-muted-foreground">
                  Every print and reprint action is recorded here.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium">
                {printHistory.length} Records
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between">
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={showOnlyReprints}
                  onChange={(e) => setShowOnlyReprints(e.target.checked)}
                />
                Show Reprints Only
              </label>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm">
                Total Logs : {printHistory.length}
              </div>
            </div>

            <WorkflowTableCard>
              <table className="min-w-[1200px] w-full">
                <thead
                  className="
sticky
top-0
z-30
border-b
bg-muted/70  
backdrop-blur
"
                >
                  <tr className="border-b bg-muted/30">
                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Student
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Company
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Version
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Action
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Ref No
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Reason
                    </th>

                    <th
                      className="px-4 py-3 text-left text-[11px]
font-bold
uppercase
tracking-[0.22em]
text-muted-foreground"
                    >
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-background">
                  {printHistory

                    .slice(0, 100)

                    .filter((row: any) => !showOnlyReprints || row.action_type === "REPRINT")

                    .map((row: any) => (
                      <tr key={row.history_id} className="border-b">
                        <td className="px-4 py-5">{row.snapshot?.student_name ?? "-"}</td>

                        <td className="px-4 py-5">{row.snapshot?.company_name ?? "-"}</td>

                        <td className="px-4 py-5">{row.print_version}</td>

                        <td className="px-4 py-5">
                          <span
                            className={
                              row.action_type === "REPRINT" ? "font-semibold text-amber-600" : ""
                            }
                          >
                            {row.action_type}
                          </span>
                        </td>

                        <td className="px-4 py-5">{row.reference_number ?? "-"}</td>

                        <td
                          className="
        p-3
        max-w-[300px]
        truncate
    "
                          title={row.reason ?? ""}
                        >
                          {row.reason ?? "-"}
                        </td>

                        <td className="px-4 py-5">
                          {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </WorkflowTableCard>
          </div>
        </div>
      )}

      {selectedRequest && (
        <>
          <style>{`
                        @media print {
                            body * { visibility: hidden !important; }
                            .print-area, .print-area * { visibility: visible !important; }
                            .print-area {
                                display: block !important;
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                            }
                            .no-print { display: none !important; }
                        }
                    `}</style>

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 no-print">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-6">
              <h2 className="mb-4 text-2xl font-semibold no-print">NOC Review</h2>

              <div className="no-print">
                <NocLetterBlock
                  snapshot={editableSnapshot}
                  approvedAt={selectedRequest?.approved_at}
                  editable={reviewMode === "PRINT"}
                  customFields={customFields}
                  setCustomFields={setCustomFields}
                />
              </div>

              {selectedRequest?.completion_submitted_at && (
                <div className="mb-4 rounded border p-4">
                  <div>
                    <strong>Completion HR Email:</strong>{" "}
                    {selectedRequest.completion_hr_email ?? "-"}
                  </div>

                  <div>
                    <strong>Completion HR Contact:</strong>{" "}
                    {selectedRequest.completion_hr_contact ?? "-"}
                  </div>

                  <div>
                    <strong>Completion Certificate:</strong>{" "}
                    {selectedRequest?.completion_certificate_url ? (
                      <ActionButton
                        variant="purple"
                        onClick={async () => {
                          const url = await adminNocService.getCertificateUrl(
                            selectedRequest.completion_certificate_url,
                          );

                          window.open(url, "_blank");
                        }}
                      >
                        Download Certificate
                      </ActionButton>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3 whitespace-nowrap no-print">
                {reviewMode === "PRINT" && (
                  <button
                    disabled={!hasChanges}
                    onClick={async () => {
                      const diff: Record<string, any> = {};

                      editableKeys.forEach((key) => {
                        const currentValue = currentSnapshot?.[key] ?? "";
                        const baseValue = editableSnapshot?.[key] ?? "";

                        if (String(currentValue) !== String(baseValue)) {
                          diff[key] = currentValue;
                        }
                      });

                      if (Object.keys(diff).length > 0) {
                        await adminNocService.saveCustomization(
                          selectedRequest.noc_request_id,
                          diff,
                        );
                      }

                      setEditableSnapshot(structuredClone(currentSnapshot));

                      await load();
                      alert("Changes Saved");
                    }}
                    className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                )}
                {reviewMode === "PRINT" && (
                  <button
                    disabled={printing}
                    onClick={async () => {
                      if (printing) return;

                      setPrinting(true);

                      const diff: Record<string, any> = {};

                      editableKeys.forEach((key) => {
                        const currentValue = currentSnapshot?.[key] ?? "";
                        const baseValue = editableSnapshot?.[key] ?? "";

                        if (String(currentValue) !== String(baseValue)) {
                          diff[key] = currentValue;
                        }
                      });

                      if (Object.keys(diff).length > 0) {
                        await adminNocService.saveCustomization(
                          selectedRequest.noc_request_id,
                          diff,
                        );
                      }

                      try {
                        window.print();

                        const confirmed = window.confirm("Did you successfully print this NOC?");

                        if (!confirmed) {
                          return;
                        }

                        await adminNocService.markPrinted(selectedRequest.noc_request_id);

                        await load();
                        setCustomFields({});
                        setEditableSnapshot(null);
                        setSelectedRequest(null);
                      } finally {
                        setPrinting(false);
                      }
                    }}
                    className="rounded-xl
border
border-slate-200
bg-white
px-4
py-2
text-sm
font-medium
transition-all
hover:-translate-y-0.5
hover:border-blue-300
hover:bg-blue-50
hover:shadow-md"
                  >
                    Print &amp; Move To Printed
                  </button>
                )}

                <ActionButton
                  variant="danger"
                  onClick={() => {
                    setCustomFields({});
                    setEditableSnapshot(null);
                    setSelectedRequest(null);
                  }}
                >
                  Close
                </ActionButton>
              </div>
            </div>
          </div>

          {reviewMode === "PRINT" && (
            <div className="print-area">
              <NocLetterBlock
                snapshot={editableSnapshot}
                approvedAt={selectedRequest?.approved_at}
                editable={false}
                customFields={customFields}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
