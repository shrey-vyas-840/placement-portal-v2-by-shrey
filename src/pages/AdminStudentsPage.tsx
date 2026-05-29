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

    useEffect(() => {
        async function loadStudents() {
            try {
                const data =
                    await adminStudentService.searchStudents(
                        searchTerm,
                    );

                setStudents(
                    interestFilter === "All"
                        ? data
                        : data.filter(
                            (student: any) =>
                                student.placement_preference ===
                                interestFilter,
                        ),
                );

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

                <div className="mt-4">
                    <select
                        value={interestFilter}
                        onChange={(e) =>
                            setInterestFilter(
                                e.target.value,
                            )
                        }
                        className="rounded-lg border border-border px-4 py-2"
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