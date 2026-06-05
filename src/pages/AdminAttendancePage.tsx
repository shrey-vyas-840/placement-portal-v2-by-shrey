import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import { adminAttendanceExportService } from "@/services/adminAttendanceExportService";
import { adminAttendanceService } from "@/services/adminAttendanceService";
import type { AttendanceDraftRow, AttendanceFilterStatus } from "@/types/attendance";

const DEFAULT_FILTER = "All";

function getFullName(row: AttendanceDraftRow) {
  return [
    row.student_master?.first_name,
    row.student_master?.middle_name,
    row.student_master?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDistinct(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function AdminAttendancePage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [rows, setRows] = useState<AttendanceDraftRow[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [roundName, setRoundName] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [roundType, setRoundType] = useState("");

  const [search, setSearch] = useState("");
  const [instituteFilter, setInstituteFilter] = useState(DEFAULT_FILTER);
  const [degreeFilter, setDegreeFilter] = useState(DEFAULT_FILTER);
  const [branchFilter, setBranchFilter] = useState(DEFAULT_FILTER);
  const [yearFilter, setYearFilter] = useState(DEFAULT_FILTER);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState(DEFAULT_FILTER);
  const [attendanceStatusFilter, setAttendanceStatusFilter] =
    useState<AttendanceFilterStatus>(DEFAULT_FILTER);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [rowsPerView, setRowsPerView] = useState(10);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    void loadDrives();
  }, []);

  useEffect(() => {
    if (!selectedDriveId) {
      setOpportunities([]);
      setSelectedOpportunityId("");
      setRounds([]);
      setSelectedRoundId("");
      setRows([]);
      return;
    }

    void loadOpportunities(selectedDriveId);
  }, [selectedDriveId]);

  useEffect(() => {
    if (!selectedOpportunityId) {
      setRounds([]);
      setSelectedRoundId("");
      setRows([]);
      return;
    }

    void loadRounds(selectedOpportunityId);
    setRows([]);
    setSelectedRoundId("");
    setNotice("");
  }, [selectedOpportunityId]);

  useEffect(() => {
    if (!selectedOpportunityId || !selectedRoundId) {
      setRows([]);
      return;
    }

    void loadRows(selectedOpportunityId, selectedRoundId);
  }, [selectedOpportunityId, selectedRoundId]);

  async function loadDrives() {
    const data = await adminAttendanceService.getDrives();
    setDrives(data);
  }

  async function loadOpportunities(driveId: string) {
    setLoading(true);
    try {
      const data = await adminAttendanceService.getOpportunitiesByDrive(driveId);
      setOpportunities(data);
      setSelectedOpportunityId("");
      setRoundName("");
      setRoundNumber("");
      setRoundType("");
    } finally {
      setLoading(false);
    }
  }

  async function loadRounds(opportunityId: string) {
    setLoading(true);
    try {
      const data = await adminAttendanceService.getRoundsByOpportunity(opportunityId);
      setRounds(data);
      setSelectedRoundId(data[0]?.round_id ?? "");
      setRoundName("");
      setRoundNumber(data.length > 0 ? String(data.length + 1) : "1");
      setRoundType("");
      setNotice(data.length > 0 ? "" : "Create a round to start marking attendance.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRows(opportunityId: string, roundId: string) {
    setLoading(true);
    try {
      const data = await adminAttendanceService.getAttendanceRows(opportunityId, roundId);
      setRows(data);
      setNotice("");
    } finally {
      setLoading(false);
    }
  }
  const selectedRound = useMemo(
    () => rounds.find((item) => item.round_id === selectedRoundId) || null,
    [rounds, selectedRoundId],
  );

  const filteredRows = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return rows.filter((row) => {
      const enrollment = (row.student_master?.enrollment_no ?? "").toLowerCase();
      const name = getFullName(row).toLowerCase();
      const institute = row.academic?.current_institute_name ?? "";
      const degree = row.academic?.current_degree_level ?? "";
      const branch = row.academic?.current_branch_name ?? "";
      const year = row.academic?.graduation_year ? String(row.academic.graduation_year) : "";
      const applicationStatus = row.application_status ?? "";
      const attendanceStatus = row.attendance_status ?? "NOT_MARKED";

      const searchMatch =
        searchText === "" || enrollment.includes(searchText) || name.includes(searchText);

      const instituteMatch =
        instituteFilter === DEFAULT_FILTER || institute === instituteFilter;
      const degreeMatch = degreeFilter === DEFAULT_FILTER || degree === degreeFilter;
      const branchMatch = branchFilter === DEFAULT_FILTER || branch === branchFilter;
      const yearMatch = yearFilter === DEFAULT_FILTER || year === yearFilter;
      const applicationStatusMatch =
        applicationStatusFilter === DEFAULT_FILTER ||
        applicationStatus === applicationStatusFilter;
      const attendanceStatusMatch =
        attendanceStatusFilter === DEFAULT_FILTER ||
        attendanceStatus === attendanceStatusFilter;

      return (
        searchMatch &&
        instituteMatch &&
        degreeMatch &&
        branchMatch &&
        yearMatch &&
        applicationStatusMatch &&
        attendanceStatusMatch
      );
    });
  }, [
    rows,
    search,
    instituteFilter,
    degreeFilter,
    branchFilter,
    yearFilter,
    applicationStatusFilter,
    attendanceStatusFilter,
  ]);

  const visibleRows = useMemo(() => {
    return filteredRows.slice(0, rowsPerView);
  }, [filteredRows, rowsPerView]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        if (row.attendance_status === "PRESENT") acc.present += 1;
        else if (row.attendance_status === "ABSENT") acc.absent += 1;
        else acc.notMarked += 1;
        return acc;
      },
      { present: 0, absent: 0, notMarked: 0 },
    );
  }, [rows]);

  const institutes = useMemo(
    () => getDistinct(rows.map((row) => row.academic?.current_institute_name)),
    [rows],
  );
  const degrees = useMemo(
    () => getDistinct(rows.map((row) => row.academic?.current_degree_level)),
    [rows],
  );
  const branches = useMemo(
    () => getDistinct(rows.map((row) => row.academic?.current_branch_name)),
    [rows],
  );
  const years = useMemo(
    () =>
      getDistinct(rows.map((row) => row.academic?.graduation_year ? String(row.academic.graduation_year) : null)),
    [rows],
  );
  const applicationStatuses = useMemo(
    () => getDistinct(rows.map((row) => row.application_status ?? null)),
    [rows],
  );

  function toggleStudentSelection(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleRows.map((row) => row.student_id);

    const allSelected = visibleIds.every((id) =>
      selectedStudentIds.includes(id),
    );

    if (allSelected) {
      setSelectedStudentIds((current) =>
        current.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedStudentIds((current) => [
        ...new Set([...current, ...visibleIds]),
      ]);
    }
  }

  function updateRow(studentId: string, patch: Partial<AttendanceDraftRow>) {
    setRows((current) =>
      current.map((row) =>
        row.student_id === studentId ? { ...row, ...patch } : row,
      ),
    );
  }

  function applyBulkStatus(
    status: AttendanceDraftRow["attendance_status"],
  ) {
    const selected = new Set(selectedStudentIds);

    setRows((current) =>
      current.map((row) =>
        selected.has(row.student_id)
          ? {
            ...row,
            attendance_status: status,
          }
          : row,
      ),
    );
  }

  async function handleCreateRound(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedOpportunityId) {
      alert("Select an opportunity first.");
      return;
    }

    if (!roundName.trim()) {
      alert("Round name is required.");
      return;
    }

    const roundNumberValue = Number(roundNumber);
    if (!Number.isFinite(roundNumberValue) || roundNumberValue < 1) {
      alert("Round number must be 1 or greater.");
      return;
    }

    setSaving(true);
    try {
      const created = await adminAttendanceService.createRound({
        opportunity_id: selectedOpportunityId,
        round_number: roundNumberValue,
        round_name: roundName.trim(),
        round_type: roundType.trim() || null,
      });

      const refreshed = await adminAttendanceService.getRoundsByOpportunity(selectedOpportunityId);
      setRounds(refreshed);
      setSelectedRoundId(created.round_id);
      setRoundName("");
      setRoundNumber(String(roundNumberValue + 1));
      setRoundType("");
      setNotice("Round created successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to create round.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAttendance() {
    if (!selectedRoundId) {
      alert("Select a round first.");
      return;
    }

    setSaving(true);
    try {
      await adminAttendanceService.saveAttendanceRows(
        selectedRoundId,
        rows.map((row) => ({
          student_id: row.student_id,
          attendance_status: row.attendance_status,
          attendance_remarks: row.attendance_remarks ?? null,
        })),
      );

      await loadRows(selectedOpportunityId, selectedRoundId);
      setNotice("Attendance saved successfully.");
      setSelectedStudentIds([]);
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadIndividual() {
    if (!selectedOpportunityId || !selectedRoundId) {
      alert("Select an opportunity and round first.");
      return;
    }
    await adminAttendanceExportService.downloadIndividualAttendanceSheet(
      selectedOpportunityId,
      selectedRoundId,
    );
  }

  async function handleDownloadConsolidated() {
    if (!selectedDriveId) {
      alert("Select a drive first.");
      return;
    }
    await adminAttendanceExportService.downloadConsolidatedAttendanceSheet(selectedDriveId);
  }

  const roundLabel = selectedRound
    ? `${selectedRound.round_number}. ${selectedRound.round_name}`
    : "No round selected";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Attendance</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              One row per student per round. Attendance is built from registered applicants only.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadIndividual}
              disabled={!selectedOpportunityId || !selectedRoundId}
              className="rounded border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download Individual Sheet
            </button>
            <button
              type="button"
              onClick={handleDownloadConsolidated}
              disabled={!selectedDriveId}
              className="rounded border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download Consolidated Sheet
            </button>
            <Link
              to="/admin"
              className="rounded border px-4 py-2 text-sm font-medium"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {notice ? (
          <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm">
            {notice}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Marked Present</div>
            <div className="mt-2 text-3xl font-bold">{summary.present}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Marked Absent</div>
            <div className="mt-2 text-3xl font-bold">{summary.absent}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Not Marked</div>
            <div className="mt-2 text-3xl font-bold">{summary.notMarked}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Rows Loaded</div>
            <div className="mt-2 text-3xl font-bold">{rows.length}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 rounded-lg border p-5 lg:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Drive</span>
            <select
              className="rounded border bg-background px-3 py-2"
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
            >
              <option value="">Select drive</option>
              {drives.map((drive) => (
                <option key={drive.drive_id} value={drive.drive_id}>
                  {drive.drive_name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Opportunity</span>
            <select
              className="rounded border bg-background px-3 py-2"
              value={selectedOpportunityId}
              onChange={(e) => setSelectedOpportunityId(e.target.value)}
              disabled={!selectedDriveId}
            >
              <option value="">Select opportunity</option>
              {opportunities.map((opportunity) => (
                <option
                  key={opportunity.opportunity_id}
                  value={opportunity.opportunity_id}
                >
                  {opportunity.opportunity_title}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Round</span>
            <select
              className="rounded border bg-background px-3 py-2"
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              disabled={!selectedOpportunityId}
            >
              <option value="">Select round</option>
              {rounds.map((round) => (
                <option key={round.round_id} value={round.round_id}>
                  {round.round_number}. {round.round_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-lg border p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Rounds</h2>
              <p className="text-sm text-muted-foreground">
                Create rounds inside the selected opportunity.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">{roundLabel}</div>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={handleCreateRound}>
            <input
              className="rounded border bg-background px-3 py-2"
              placeholder="Round name"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              disabled={!selectedOpportunityId}
            />
            <input
              className="rounded border bg-background px-3 py-2"
              placeholder="Round number"
              value={roundNumber}
              onChange={(e) => setRoundNumber(e.target.value)}
              disabled={!selectedOpportunityId}
            />
            <input
              className="rounded border bg-background px-3 py-2"
              placeholder="Round type"
              value={roundType}
              onChange={(e) => setRoundType(e.target.value)}
              disabled={!selectedOpportunityId}
            />
            <button
              type="submit"
              className="rounded border px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedOpportunityId || saving}
            >
              Add Round
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {rounds.map((round) => (
              <button
                key={round.round_id}
                type="button"
                onClick={() => setSelectedRoundId(round.round_id)}
                className={`rounded-full border px-4 py-2 text-sm ${selectedRoundId === round.round_id
                  ? "bg-foreground text-background"
                  : ""
                  }`}
              >
                {round.round_number}. {round.round_name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-lg border p-5">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              className="rounded border bg-background px-3 py-2"
              placeholder="Search enrollment or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded border bg-background px-3 py-2"
              value={instituteFilter}
              onChange={(e) => setInstituteFilter(e.target.value)}
            >
              <option value={DEFAULT_FILTER}>All Institutes</option>
              {institutes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="rounded border bg-background px-3 py-2"
              value={degreeFilter}
              onChange={(e) => setDegreeFilter(e.target.value)}
            >
              <option value={DEFAULT_FILTER}>All Degrees</option>
              {degrees.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="rounded border bg-background px-3 py-2"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value={DEFAULT_FILTER}>All Branches</option>
              {branches.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="rounded border bg-background px-3 py-2"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value={DEFAULT_FILTER}>All Batches</option>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="rounded border bg-background px-3 py-2"
              value={applicationStatusFilter}
              onChange={(e) => setApplicationStatusFilter(e.target.value)}
            >
              <option value={DEFAULT_FILTER}>All Application Status</option>
              {applicationStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="rounded border bg-background px-3 py-2"
              value={attendanceStatusFilter}
              onChange={(e) => setAttendanceStatusFilter(e.target.value as AttendanceFilterStatus)}
            >
              <option value={DEFAULT_FILTER}>All Attendance Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="NOT_MARKED">Not Marked</option>
            </select>

            <div className="flex items-center gap-3 lg:col-span-4">
              <span className="text-sm font-medium">
                Show Rows
              </span>

              <select
                className="rounded border bg-background px-3 py-2"
                value={rowsPerView}
                onChange={(e) => setRowsPerView(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={150}>150</option>
                <option value={200}>200</option>
                <option value={999999}>All</option>
              </select>

              <span className="text-sm text-muted-foreground">
                Showing {Math.min(filteredRows.length, rowsPerView)} of {filteredRows.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <button
                type="button"
                onClick={() => applyBulkStatus("PRESENT")}
                className="rounded border px-4 py-2 text-sm font-medium"
              >
                Mark Selected Present
              </button>
              <button
                type="button"
                onClick={() => applyBulkStatus("ABSENT")}
                className="rounded border px-4 py-2 text-sm font-medium"
              >
                Mark Selected Absent
              </button>
              <button
                type="button"
                onClick={() => applyBulkStatus("NOT_MARKED")}
                className="rounded border px-4 py-2 text-sm font-medium"
              >
                Clear Selected
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border">
          <div className="border-b px-5 py-4">
            <h2 className="text-xl font-semibold">Registered Students</h2>
            <p className="text-sm text-muted-foreground">
              Only students registered for the selected opportunity appear here.
            </p>
          </div>

          <div
            className="overflow-auto"
            style={{
              maxHeight:
                rowsPerView <= 10
                  ? "500px"
                  : rowsPerView <= 50
                    ? "700px"
                    : "900px",
            }}
          >
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        visibleRows.length > 0 &&
                        visibleRows.every((row) =>
                          selectedStudentIds.includes(row.student_id),
                        )
                      }
                      onChange={toggleSelectAllVisible}
                    />
                  </th>
                  <th className="px-4 py-3">Enrollment</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Institute</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Degree</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Application Status</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.student_id} className="border-t">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(row.student_id)}
                        onChange={() =>
                          toggleStudentSelection(row.student_id)
                        }
                      />
                    </td>
                    <td className="px-4 py-3">{row.student_master?.enrollment_no ?? "-"}</td>
                    <td className="px-4 py-3">{getFullName(row)}</td>
                    <td className="px-4 py-3">{row.academic?.current_institute_name ?? "-"}</td>
                    <td className="px-4 py-3">{row.academic?.current_branch_name ?? "-"}</td>
                    <td className="px-4 py-3">{row.academic?.current_degree_level ?? "-"}</td>
                    <td className="px-4 py-3">{row.academic?.graduation_year ?? "-"}</td>
                    <td className="px-4 py-3">{row.application_status ?? "-"}</td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded border bg-background px-2 py-1"
                        value={row.attendance_status}
                        onChange={(e) =>
                          updateRow(row.student_id, {
                            attendance_status: e.target
                              .value as AttendanceDraftRow["attendance_status"],
                          })
                        }
                      >
                        <option value="NOT_MARKED">Not Marked</option>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full rounded border bg-background px-2 py-1"
                        value={row.attendance_remarks ?? ""}
                        onChange={(e) =>
                          updateRow(row.student_id, {
                            attendance_remarks: e.target.value,
                          })
                        }
                        placeholder="Optional note"
                      />
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={9}>
                      {loading ? "Loading..." : "No students found for the current filters."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t px-5 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={!selectedRoundId || saving}
              className="rounded border px-6 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
