import { useEffect, useState } from "react";
import { adminStudentService } from "@/services/adminStudentService";

export function AdminStudentDetailPage({
    studentId,
}: {
    studentId: string;
}) {
    const [data, setData] =
        useState<any>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        async function load() {
            try {
                const result =
                    await adminStudentService.getStudentById(
                        studentId,
                    );

                setData(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [studentId]);

    if (loading) {
        return (
            <div className="p-8">
                Loading Student...
            </div>
        );
    }

    if (!data?.profile) {
        return (
            <div className="p-8">
                Student not found.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Student Details
                </h1>

                <div className="mt-8 space-y-6">

                    <div className="rounded-lg border p-5">
                        <h2 className="font-semibold">
                            Profile
                        </h2>

                        <p>
                            Name:
                            {" "}
                            {data.profile.first_name}
                            {" "}
                            {data.profile.last_name}
                        </p>

                        <p>
                            Enrollment:
                            {" "}
                            {data.profile.enrollment_no}
                        </p>

                        <p>
                            Institute Email:
                            {" "}
                            {data.profile.institute_email}
                        </p>

                        <p>
                            Contact:
                            {" "}
                            {data.profile.contact_number}
                        </p>
                    </div>

                    <div className="rounded-lg border p-5">
                        <h2 className="font-semibold">
                            Academics
                        </h2>

                        <p>
                            CGPA:
                            {" "}
                            {data.academics?.current_cgpa}
                        </p>

                        <p>
                            Semester:
                            {" "}
                            {data.academics?.current_semester}
                        </p>

                        <p>
                            Branch:
                            {" "}
                            {data.academics?.current_branch_name}
                        </p>

                        <p>
                            Graduation:
                            {" "}
                            {data.academics?.graduation_year}
                        </p>
                    </div>

                    <div className="rounded-lg border p-5">
                        <h2 className="font-semibold">
                            Skills
                        </h2>

                        <p>
                            Programming:
                            {" "}
                            {data.skills?.programming_languages}
                        </p>

                        <p>
                            Technical:
                            {" "}
                            {data.skills?.technical_skills}
                        </p>

                        <p>
                            Tools:
                            {" "}
                            {data.skills?.tools_and_technologies}
                        </p>
                    </div>

                    <div className="rounded-lg border p-5">
                        <h2 className="font-semibold">
                            Documents
                        </h2>

                        <p className="mb-4">
                            Total Documents:
                            {" "}
                            {data.documents?.length ?? 0}
                        </p>

                        <div className="space-y-3">
                            {data.documents?.map(
                                (doc: any) => (
                                    <div
                                        key={
                                            doc.student_document_id
                                        }
                                        className="rounded border p-3"
                                    >
                                        <p>
                                            <strong>
                                                Document:
                                            </strong>
                                            {" "}
                                            {
                                                doc
                                                    .document_metadata
                                                    ?.document_name
                                            }
                                        </p>

                                        <p>
                                            <strong>
                                                Type:
                                            </strong>
                                            {" "}
                                            {
                                                doc
                                                    .document_metadata
                                                    ?.document_type
                                            }
                                        </p>

                                        <p>
                                            <strong>
                                                Status:
                                            </strong>
                                            {" "}
                                            {
                                                doc
                                                    .verification_status
                                            }
                                        </p>

                                        {doc
                                            .document_metadata
                                            ?.storage_url && (
                                                <a
                                                    href={
                                                        doc
                                                            .document_metadata
                                                            .storage_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary underline"
                                                >
                                                    Open Document
                                                </a>
                                            )}
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}