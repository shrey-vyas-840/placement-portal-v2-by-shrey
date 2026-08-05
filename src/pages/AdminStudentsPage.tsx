import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminStudentService } from "@/services/adminStudentService";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
export function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [interestFilter, setInterestFilter] = useState("All");
  const [placementFilter, setPlacementFilter] = useState("All");
  const [instituteFilter, setInstituteFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [graduationFilter, setGraduationFilter] = useState("All");
  const [cgpaFilter, setCgpaFilter] = useState("All");
  const [sortColumn, setSortColumn] = useState<string>("enrollment_no");

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterOptions, setFilterOptions] = useState({
    institutes: [] as string[],
    branches: [] as string[],
    graduationYears: [] as number[],
  });

  useEffect(() => {
    async function loadStudents() {
      try {
        const options = await adminStudentService.getFilterOptions();

        setFilterOptions(options);

        let data;

        if (searchTerm.trim()) {
          data = await adminStudentService.searchStudents(searchTerm);
        } else {
          data = await adminStudentService.getAllStudents();
        }

        const academics = await adminStudentService.getAcademicMap();

        let filtered = data.map((student: any) => {
          const academic = academics.find((a: any) => a.student_id === student.student_id);

          return {
            ...student,
            academic,
          };
        });

        if (interestFilter !== "All") {
          filtered = filtered.filter(
            (student: any) => student.placement_preference === interestFilter,
          );
        }

        if (placementFilter !== "All") {
          filtered = filtered.filter(
            (student: any) => student.placement_status === placementFilter,
          );
        }
        if (instituteFilter !== "All") {
          filtered = filtered.filter(
            (student: any) => student.academic?.current_institute_name === instituteFilter,
          );
        }
        if (branchFilter !== "All") {
          filtered = filtered.filter(
            (student: any) => student.academic?.current_branch_name === branchFilter,
          );
        }

        if (graduationFilter !== "All") {
          filtered = filtered.filter(
            (student: any) => String(student.academic?.graduation_year) === graduationFilter,
          );
        }

        if (cgpaFilter !== "All") {
          filtered = filtered.filter((student: any) => {
            const cgpa = Number(student.academic?.current_cgpa ?? 0);

            switch (cgpaFilter) {
              case "9+":
                return cgpa >= 9;

              case "8+":
                return cgpa >= 8;

              case "7+":
                return cgpa >= 7;

              default:
                return true;
            }
          });
        }

        const sorted = [...filtered].sort((a: any, b: any) => {
          const direction = sortDirection === "asc" ? 1 : -1;

          switch (sortColumn) {
            case "enrollment_no":
              return (
                (Number(String(a.enrollment_no).replace(/\D/g, "")) -
                  Number(String(b.enrollment_no).replace(/\D/g, ""))) *
                direction
              );

            case "first_name":
              return (
                `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`) *
                direction
              );

            case "institute_email":
              return String(a.institute_email).localeCompare(String(b.institute_email)) * direction;

            case "institute":
              return (
                String(a.academic?.current_institute_name ?? "").localeCompare(
                  String(b.academic?.current_institute_name ?? ""),
                ) * direction
              );

            case "branch":
              return (
                String(a.academic?.current_branch_name ?? "").localeCompare(
                  String(b.academic?.current_branch_name ?? ""),
                ) * direction
              );

            case "cgpa":
              return (
                (Number(a.academic?.current_cgpa ?? 0) - Number(b.academic?.current_cgpa ?? 0)) *
                direction
              );

            case "graduation_year":
              return (
                (Number(a.academic?.graduation_year ?? 0) -
                  Number(b.academic?.graduation_year ?? 0)) *
                direction
              );

            case "placement_preference":
              return (
                String(a.placement_preference).localeCompare(String(b.placement_preference)) *
                direction
              );

            case "placement_status":
              return (
                String(a.placement_status).localeCompare(String(b.placement_status)) * direction
              );

            default:
              return 0;
          }
        });

        setStudents(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, [
    searchTerm,
    interestFilter,
    placementFilter,
    instituteFilter,
    branchFilter,
    graduationFilter,
    cgpaFilter,
    sortColumn,
    sortDirection,
  ]);
  if (loading) {
    return <div className="p-8">Loading Students...</div>;
  }
  const handleSort = (column: string, label: string, type: "text" | "number") => {
    const nextDirection = sortColumn === column && sortDirection === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortDirection(nextDirection);

    if (type === "text") {
      toast.success(`${label} sorted ${nextDirection === "asc" ? "A → Z" : "Z → A"}`);
    } else {
      toast.success(`${label} sorted ${nextDirection === "asc" ? "1 → 10" : "10 → 1"}`);
    }
  };

  const getArrow = (column: string) => {
    if (sortColumn !== column) {
      return "↕";
    }

    return sortDirection === "asc" ? "▲" : "▼";
  };
  return (
    <AdminLayout
      title="Students"
      description="Browse, search and manage every student registered in the placement portal."
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 12l-4-4m4 4l4-4M5 20h14"
              />
            </svg>
            Export Students
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-[1850px]">
        <div className="mt-5 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[320px] flex-1 items-center">
              <div className="flex h-11 items-center rounded-l-xl border border-r-0 border-border bg-muted px-4 font-semibold">
                IU
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 13);
                  setSearchTerm(value);
                }}
                placeholder="Search Enrollment Number"
                className="h-11 w-full rounded-r-xl border border-border bg-background px-4 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={interestFilter}
              onChange={(e) => setInterestFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Students</option>

              <option value="Interested">Interested</option>

              <option value="Not Interested">Not Interested</option>
            </select>

            <select
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Status</option>

              <option value="Placed">Placed</option>

              <option value="Unplaced">Unplaced</option>
            </select>

            <select
              value={instituteFilter}
              onChange={(e) => setInstituteFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Institutes</option>

              {filterOptions.institutes.map((institute) => (
                <option key={institute} value={institute}>
                  {institute}
                </option>
              ))}
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Branches</option>

              {filterOptions.branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <select
              value={graduationFilter}
              onChange={(e) => setGraduationFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">Graduation Year</option>

              {filterOptions.graduationYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={cgpaFilter}
              onChange={(e) => setCgpaFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All CGPA</option>

              <option value="9+">9+</option>

              <option value="8+">8+</option>

              <option value="7+">7+</option>
            </select>

            {/* <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 12l-4-4m4 4l4-4M5 20h14"
                />
              </svg>
              Export Students
            </button>

            <button
              onClick={() => {
                setSearchTerm("");
                setInterestFilter("All");
                setPlacementFilter("All");
                setInstituteFilter("All");
                setBranchFilter("All");
                setGraduationFilter("All");
                setCgpaFilter("All");
              }}
              className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              Reset
            </button> */}
          </div>
        </div>

        <div className="mt-6 max-h-[72vh] overflow-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-muted shadow-sm">
              <tr className="border border-border bg-muted">
                <th
                  onClick={() => handleSort("enrollment_no", "Enrollment", "number")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-left font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>Enrollment</span>

                    <span className="text-xs opacity-60">{getArrow("enrollment_no")}</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("first_name", "Name", "text")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-left font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>Name</span>

                    <span className="text-xs opacity-60">{getArrow("first_name")}</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("institute_email", "Email", "text")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-left font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>Email</span>

                    <span className="text-xs opacity-60">{getArrow("institute_email")}</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("institute", "Institute", "text")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-left font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>Institute</span>

                    <span className="text-xs opacity-60">{getArrow("institute")}</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("branch", "Branch", "text")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-left font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>Branch</span>

                    <span className="text-xs opacity-60">{getArrow("branch")}</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("cgpa", "CGPA", "number")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-center font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>CGPA</span>

                    <span className="text-xs opacity-60">{getArrow("cgpa")}</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("graduation_year", "Graduation Year", "number")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-center font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>Graduation Year</span>

                    <span className="text-xs opacity-60">{getArrow("graduation_year")}</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("placement_preference", "Placement Preference", "text")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-center font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>Preference</span>

                    <span className="text-xs opacity-60">{getArrow("placement_preference")}</span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort("placement_status", "Placement Status", "text")}
                  className="cursor-pointer select-none border border-border whitespace-nowrap p-3 text-center font-semibold transition-colors hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span>Placement Status</span>

                    <span className="text-xs opacity-60">{getArrow("placement_status")}</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    {searchTerm.length > 0 && searchTerm.length < 8
                      ? "Enrollment number must contain at least 8 digits."
                      : "Student data not found in database."}
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.student_id}
                    className="odd:bg-background even:bg-muted/20 hover:bg-primary/5 transition-colors"
                  >
                    <td className="p-3">
                      <Link
                        to="/admin/$studentId"
                        params={{
                          studentId: student.student_id,
                        }}
                        className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
                      >
                        {student.enrollment_no}
                      </Link>
                    </td>

                    <td className="border border-border whitespace-nowrap p-3 align-middle">
                      {student.first_name} {student.last_name}
                    </td>

                    <td className="border border-border whitespace-nowrap p-3 align-middle">
                      {student.institute_email}
                    </td>

                    <td className="border border-border whitespace-nowrap p-3 align-middle">
                      {student.academic?.current_institute_name ?? "-"}
                    </td>

                    <td className="border border-border whitespace-nowrap p-3 align-middle">
                      {student.academic?.current_branch_name ?? "-"}
                    </td>

                    <td className="border border-border whitespace-nowrap p-3 align-middle">
                      {student.academic?.current_cgpa ?? "-"}
                    </td>

                    <td className="border border-border whitespace-nowrap p-3 align-middle">
                      {student.academic?.graduation_year ?? "-"}
                    </td>

                    <td className="border border-border whitespace-nowrap p-3 align-middle">
                      <span
                        className={`inline-flex min-w-[135px] justify-center rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-all ${
                          student.placement_preference === "Interested"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : "border-orange-300 bg-orange-50 text-orange-700"
                        }`}
                      >
                        {student.placement_preference}
                      </span>
                    </td>

                    <td className="border border-border whitespace-nowrap p-3 align-middle">
                      <span
                        className={`inline-flex min-w-[135px] justify-center rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-all ${
                          student.placement_status === "Placed"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-blue-300 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {student.placement_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
