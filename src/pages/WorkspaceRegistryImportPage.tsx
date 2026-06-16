import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasWorkspaceAccess } from "@/services/workspaceAccessService";
import {
    importRegistryRows,
    validateRegistryWorkbook,
    type RegistryValidationReport,
} from "@/services/studentRegistryImportService";

function StatCard({
    label,
    value,
    tone = "",
}: {
    label: string;
    value: string | number;
    tone?: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                {label}
            </div>
            <div className={`mt-2 text-2xl font-bold ${tone}`}>{value}</div>
        </div>
    );
}

function Badge({
    children,
    tone = "bg-muted text-foreground",
}: {
    children: React.ReactNode;
    tone?: string;
}) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
            {children}
        </span>
    );
}

export function WorkspaceRegistryImportPage() {
    const { user } = useAuth();

    const [instituteName, setInstituteName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [report, setReport] = useState<RegistryValidationReport | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);

    const canAccess = hasWorkspaceAccess(user?.email);

    const importableRows = useMemo(
        () => report?.rows.filter((row) => row.action === "import") ?? [],
        [report],
    );

    if (!canAccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold">Workspace Unavailable</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        You do not have permission to access this workspace.
                    </p>
                </div>
            </div>
        );
    }

    const processSelectedFile = (selectedFile: File | null) => {
        if (!selectedFile) return;

        const allowedExtensions = [".xlsx", ".xls"];
        const lowerName = selectedFile.name.toLowerCase();

        const validExtension = allowedExtensions.some(ext =>
            lowerName.endsWith(ext)
        );

        if (!validExtension) {
            setStatusError("Only .xlsx or .xls files are allowed.");
            return;
        }

        const maxSizeMB = 15;

        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
            setStatusError(`File exceeds ${maxSizeMB} MB limit.`);
            return;
        }

        setFile(selectedFile);
        setReport(null);
        setStatusMessage(null);
        setStatusError(null);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);

        const droppedFile = event.dataTransfer.files?.[0] ?? null;
        processSelectedFile(droppedFile);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDragEnter = () => {
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleValidate = async () => {
        setStatusMessage(null);
        setStatusError(null);

        if (!file) {
            setStatusError("Choose an Excel file first.");
            return;
        }

        if (!instituteName.trim()) {
            setStatusError("Institute name is required.");
            return;
        }

        try {
            setLoading(true);
            const result = await validateRegistryWorkbook(file, instituteName);
            setReport(result);

            if (result.readyToImport) {
                setStatusMessage("Validation passed. Data is ready to push.");
            } else if (result.errorCount > 0) {
                setStatusError("Validation failed. Fix the blocking issues and re-upload.");
            } else {
                setStatusMessage("Validation completed.");
            }
        } catch (error) {
            console.error(error);
            setStatusError(error instanceof Error ? error.message : "Validation failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        setStatusMessage(null);
        setStatusError(null);

        if (!report) {
            setStatusError("Validate the file first.");
            return;
        }

        if (!report.readyToImport) {
            setStatusError("Fix the blocking issues before importing.");
            return;
        }

        const confirmed = window.confirm(
            `Import ${importableRows.length} validated row(s) into the registry table?`,
        );

        if (!confirmed) return;

        try {
            setImporting(true);

            const result = await importRegistryRows(report, user!.id);

            setStatusMessage(
                `Imported ${result.insertedOrUpdated} row(s). ${result.skipped} row(s) were skipped.`,
            );
        } catch (error) {
            console.error(error);
            setStatusError(error instanceof Error ? error.message : "Import failed.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Phase 1
                            </div>
                            <h1 className="mt-2 text-2xl font-bold">Master Student Registry Import</h1>
                            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                                Upload the institute Excel sheet, validate the exact header order, dedupe by latest timestamp,
                                scan conflicts against the registry table, and import only clean rows.
                            </p>
                        </div>

                        <Link
                            to="/workspace/catalog"
                            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-muted/30"
                        >
                            Back to Workspace Catalog
                        </Link>
                    </div>
                </header>

                <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Upload & Validate</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Use the same Excel format. The validator blocks bad rows before anything reaches the database.
                        </p>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Institute Name / Code</label>
                                <input
                                    value={instituteName}
                                    onChange={(e) => setInstituteName(e.target.value)}
                                    placeholder="IIMS"
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Excel File (.xlsx)
                                </label>

                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${isDragging
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-background"
                                        }`}
                                >
                                    <input
                                        id="registry-file-upload"
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        onChange={(e) =>
                                            processSelectedFile(
                                                e.target.files?.[0] ?? null
                                            )
                                        }
                                    />

                                    <label
                                        htmlFor="registry-file-upload"
                                        className="cursor-pointer"
                                    >
                                        <div className="space-y-2">
                                            <div className="text-lg font-semibold">
                                                Drag & Drop Excel File
                                            </div>

                                            <div className="text-sm text-muted-foreground">
                                                or click here to browse
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                Supports .xlsx and .xls
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleValidate}
                                    disabled={loading}
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                                >
                                    {loading ? "Validating..." : "Validate Excel"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleImport}
                                    disabled={importing || !report?.readyToImport}
                                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium disabled:opacity-60"
                                >
                                    {importing ? "Importing..." : "Confirm Import"}
                                </button>
                            </div>

                            {file ? (
                                <div className="rounded-xl border border-border bg-background p-3 text-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-medium">
                                                Selected file
                                            </div>

                                            <div className="mt-1 text-muted-foreground">
                                                {file.name}
                                            </div>

                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFile(null);
                                                setReport(null);
                                            }}
                                            className="rounded-lg border border-border px-3 py-1 text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {statusMessage ? (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                                    {statusMessage}
                                </div>
                            ) : null}

                            {statusError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {statusError}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard label="Sheet Rows" value={report?.totalRows ?? 0} />
                            <StatCard label="Rows Ready" value={report?.importedRowsCount ?? 0} tone="text-emerald-700" />
                            <StatCard label="Warnings" value={report?.warningCount ?? 0} tone="text-amber-700" />
                            <StatCard label="Errors" value={report?.errorCount ?? 0} tone="text-red-700" />
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <h2 className="text-lg font-semibold">Checks</h2>

                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {(report?.tests ?? []).map((test) => (
                                    <div key={test.label} className="rounded-xl border border-border bg-background p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-sm font-medium">{test.label}</div>
                                            <Badge tone={test.passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                                                {test.passed ? "Passed" : "Failed"}
                                            </Badge>
                                        </div>
                                        {test.note ? (
                                            <p className="mt-2 text-xs text-muted-foreground">{test.note}</p>
                                        ) : null}
                                    </div>
                                ))}
                            </div>

                            {!report ? (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Validate a file to see the test results.
                                </p>
                            ) : null}
                        </div>

                        {report ? (
                            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <h2 className="text-lg font-semibold">Validation Summary</h2>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    <div className="rounded-xl border border-border bg-background p-4 text-sm">
                                        <div className="text-muted-foreground">Headers</div>
                                        <div className="mt-1 font-medium">
                                            {report.tests[0]?.passed ? "Exact match" : "Mismatch"}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border bg-background p-4 text-sm">
                                        <div className="text-muted-foreground">Duplicate rows merged</div>
                                        <div className="mt-1 font-medium">{report.duplicateRowsMerged}</div>
                                    </div>

                                    <div className="rounded-xl border border-border bg-background p-4 text-sm">
                                        <div className="text-muted-foreground">Database conflicts skipped</div>
                                        <div className="mt-1 font-medium">{report.skippedOlderRowsCount}</div>
                                    </div>

                                    <div className="rounded-xl border border-border bg-background p-4 text-sm">
                                        <div className="text-muted-foreground">Ready to push</div>
                                        <div className="mt-1 font-medium">
                                            {report.readyToImport ? "Yes" : "No"}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border bg-background p-4 text-sm">
                                        <div className="text-muted-foreground">Institute Key</div>
                                        <div className="mt-1 font-medium">{report.instituteKey}</div>
                                    </div>

                                    <div className="rounded-xl border border-border bg-background p-4 text-sm">
                                        <div className="text-muted-foreground">Validated rows</div>
                                        <div className="mt-1 font-medium">{report.importedRowsCount}</div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>

                {report ? (
                    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">Preview</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Green rows will be imported. Yellow rows are warnings. Red rows block import.
                                </p>
                            </div>

                            <Badge tone={report.readyToImport ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                                {report.readyToImport ? "Ready" : "Needs Fixes"}
                            </Badge>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-[1200px] w-full text-sm">
                                <thead className="border-b border-border text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-3">Row</th>
                                        <th className="px-3 py-3">Enrollment</th>
                                        <th className="px-3 py-3">Institute Email</th>
                                        <th className="px-3 py-3">Preference</th>
                                        <th className="px-3 py-3">Action</th>
                                        <th className="px-3 py-3">Issues</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.rows.map((row) => (
                                        <tr key={`${row.rowNumber}-${row.enrollmentNo}`} className="border-b border-border last:border-b-0">
                                            <td className="px-3 py-3 font-medium">{row.rowNumber}</td>
                                            <td className="px-3 py-3">{row.enrollmentNo}</td>
                                            <td className="px-3 py-3">{row.instituteEmailId}</td>
                                            <td className="px-3 py-3">{row.placementPreferenceText}</td>
                                            <td className="px-3 py-3">
                                                <Badge
                                                    tone={
                                                        row.action === "import"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : row.action === "skip"
                                                                ? "bg-amber-100 text-amber-800"
                                                                : "bg-red-100 text-red-800"
                                                    }
                                                >
                                                    {row.action}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.issues.length ? (
                                                    <ul className="space-y-1">
                                                        {row.issues.map((issue, index) => (
                                                            <li
                                                                key={`${row.rowNumber}-${index}`}
                                                                className={
                                                                    issue.severity === "error"
                                                                        ? "text-red-700"
                                                                        : "text-amber-700"
                                                                }
                                                            >
                                                                • {issue.message}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-emerald-700">No issues</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : null}

                {report ? (
                    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">All issues</h2>
                        <div className="mt-4 space-y-2">
                            {report.issues.length ? (
                                report.issues.map((issue, index) => (
                                    <div
                                        key={`${issue.rowNumber ?? "global"}-${index}`}
                                        className={`rounded-xl border p-3 text-sm ${issue.severity === "error"
                                            ? "border-red-200 bg-red-50 text-red-700"
                                            : "border-amber-200 bg-amber-50 text-amber-800"
                                            }`}
                                    >
                                        {issue.rowNumber ? `Row ${issue.rowNumber}: ` : ""}
                                        {issue.message}
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                                    No blocking issues found.
                                </div>
                            )}
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    );
}