import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminStudentService } from "@/services/adminStudentService";

export function AdminStudentsPage() {
    const [students, setStudents] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [interestFilter, setInterestFilter] =
        useState("All");

    const [placementFilter, setPlacementFilter] =
        useState("All");

    const [instituteFilter, setInstituteFilter] =
        useState("All");

    const [branchFilter, setBranchFilter] =
        useState("All");

    const [graduationFilter, setGraduationFilter] =
        useState("All");

    const [cgpaFilter, setCgpaFilter] =
        useState("All");

    const [filterOptions, setFilterOptions] =
        useState({
            institutes: [] as string[],
            branches: [] as string[],
            graduationYears: [] as number[],
        });

    useEffect(() => {
        async function loadStudents() {
            try {
                const options =
                    await adminStudentService.getFilterOptions();

                setFilterOptions(options);

                let data;

                if (searchTerm.trim()) {
                    data =
                        await adminStudentService.searchStudents(
                            searchTerm,
                        );
                } else {
                    data =
                        await adminStudentService.getAllStudents();
                }

                const academics =
                    await adminStudentService.getAcademicMap();

                let filtered =
                    data.map(
                        (student: any) => {
                            const academic =
                                academics.find(
                                    (a: any) =>
                                        a.student_id ===
                                        student.student_id,
                                );

                            return {
                                ...student,
                                academic,
                            };
                        },
                    );

                if (
                    interestFilter !== "All"
                ) {
                    filtered =
                        filtered.filter(
                            (student: any) =>
                                student.placement_preference ===
                                interestFilter,
                        );
                }

                if (
                    placementFilter !== "All"
                ) {
                    filtered =
                        filtered.filter(
                            (student: any) =>
                                student.placement_status ===
                                placementFilter,
                        );
                }
                if (
                    instituteFilter !== "All"
                ) {
                    filtered =
                        filtered.filter(
                            (student: any) =>
                                student.academic
                                    ?.current_institute_name ===
                                instituteFilter,
                        );
                }
                if (
                    branchFilter !== "All"
                ) {
                    filtered =
                        filtered.filter(
                            (student: any) =>
                                student.academic
                                    ?.current_branch_name ===
                                branchFilter,
                        );
                }

                if (
                    graduationFilter !== "All"
                ) {
                    filtered =
                        filtered.filter(
                            (student: any) =>
                                String(
                                    student.academic
                                        ?.graduation_year,
                                ) ===
                                graduationFilter,
                        );
                }

                if (
                    cgpaFilter !== "All"
                ) {
                    filtered =
                        filtered.filter(
                            (student: any) => {
                                const cgpa =
                                    Number(
                                        student.academic
                                            ?.current_cgpa ??
                                        0,
                                    );

                                switch (
                                cgpaFilter
                                ) {
                                    case "9+":
                                        return cgpa >= 9;

                                    case "8+":
                                        return cgpa >= 8;

                                    case "7+":
                                        return cgpa >= 7;

                                    default:
                                        return true;
                                }
                            },
                        );
                }

                setStudents(filtered);

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
    ]);

    if (loading) {
        return (
            <div className="p-8">
                Loading Students...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Students
                </h1>

                <div className="mt-6">
                    <div className="flex items-center">
                        <div className="rounded-l-lg border border-r-0 border-border bg-muted px-4 py-2 font-medium">
                            IU
                        </div>

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                const value =
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 13);

                                setSearchTerm(value);
                            }}
                            placeholder="Enter 8-13 digit enrollment number"
                            className="w-full rounded-r-lg border border-border bg-background px-4 py-2"
                        />
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">

                    <select
                        value={interestFilter}
                        onChange={(e) =>
                            setInterestFilter(
                                e.target.value,
                            )
                        }
                        className="rounded-lg border px-4 py-2"
                    >
                        <option value="All">
                            All Students
                        </option>

                        <option value="Interested">
                            Interested
                        </option>

                        <option value="Not Interested">
                            Not Interested
                        </option>
                    </select>

                    <select
                        value={placementFilter}
                        onChange={(e) =>
                            setPlacementFilter(
                                e.target.value,
                            )
                        }
                        className="rounded-lg border px-4 py-2"
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="Placed">
                            Placed
                        </option>

                        <option value="Unplaced">
                            Unplaced
                        </option>
                    </select>

                    <select
                        value={instituteFilter}
                        onChange={(e) =>
                            setInstituteFilter(
                                e.target.value,
                            )
                        }
                        className="rounded-lg border px-4 py-2"
                    >
                        <option value="All">
                            All Institutes
                        </option>

                        {filterOptions.institutes.map(
                            (institute) => (
                                <option
                                    key={institute}
                                    value={institute}
                                >
                                    {institute}
                                </option>
                            ),
                        )}
                    </select>

                    <select
                        value={branchFilter}
                        onChange={(e) =>
                            setBranchFilter(
                                e.target.value,
                            )
                        }
                        className="rounded-lg border px-4 py-2"
                    >
                        <option value="All">
                            All Branches
                        </option>

                        {filterOptions.branches.map(
                            (branch) => (
                                <option
                                    key={branch}
                                    value={branch}
                                >
                                    {branch}
                                </option>
                            ),
                        )}
                    </select>

                    <select
                        value={graduationFilter}
                        onChange={(e) =>
                            setGraduationFilter(
                                e.target.value,
                            )
                        }
                        className="rounded-lg border px-4 py-2"
                    >
                        <option value="All">
                            Graduation Year
                        </option>

                        {filterOptions.graduationYears.map(
                            (year) => (
                                <option
                                    key={year}
                                    value={year}
                                >
                                    {year}
                                </option>
                            ),
                        )}
                    </select>

                    <select
                        value={cgpaFilter}
                        onChange={(e) =>
                            setCgpaFilter(
                                e.target.value,
                            )
                        }
                        className="rounded-lg border px-4 py-2"
                    >
                        <option value="All">
                            All CGPA
                        </option>

                        <option value="9+">
                            9+
                        </option>

                        <option value="8+">
                            8+
                        </option>

                        <option value="7+">
                            7+
                        </option>
                    </select>

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
                        className="rounded-lg border px-4 py-2"
                    >
                        Reset
                    </button>

                </div>

                <div className="mt-6 overflow-hidden rounded-lg border">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted">
                                <th className="p-3 text-left">
                                    Enrollment
                                </th>

                                <th className="p-3 text-left">
                                    Name
                                </th>

                                <th className="p-3 text-left">
                                    Email
                                </th>
                                <th className="p-3 text-left">
                                    Interest
                                </th>

                                <th className="p-3 text-left">
                                    Completion
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="p-8 text-center text-muted-foreground"
                                    >
                                        {searchTerm.length > 0 &&
                                            searchTerm.length < 8
                                            ? "Enrollment number must contain at least 8 digits."
                                            : "Student data not found in database."
                                        }
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr
                                        key={student.student_id}
                                        className="border-b"
                                    >
                                        <td className="p-3">
                                            <Link
                                                to="/admin/$studentId"
                                                params={{
                                                    studentId:
                                                        student.student_id,
                                                }}
                                                className="text-primary underline"
                                            >
                                                {student.enrollment_no}
                                            </Link>
                                        </td>

                                        <td className="p-3">
                                            {student.first_name}
                                            {" "}
                                            {student.last_name}
                                        </td>

                                        <td className="p-3">
                                            {student.institute_email}
                                        </td>

                                        <td className="p-3">
                                            {
                                                student.placement_preference
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                student.completion_percentage
                                            }%
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}