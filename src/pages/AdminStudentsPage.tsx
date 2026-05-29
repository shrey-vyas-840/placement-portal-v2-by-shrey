import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminStudentService } from "@/services/adminStudentService";

export function AdminStudentsPage() {
    const [students, setStudents] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        async function loadStudents() {
            try {
                const data =
                    await adminStudentService.getAllStudents();

                setStudents(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadStudents();
    }, []);

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
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((student) => (
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}