import {
    useEffect,
    useMemo,
    useState,
} from "react";

import ExcelJS from "exceljs";

import {
    adminExportService,
} from "@/services/adminExportService";

const FIXED_COLUMNS = [

    {
        key: "name",
        label: "Name",
        locked: true,
    },

    {
        key: "enrollment",
        label: "Enrollment No",
        locked: true,
    },

    {
        key: "institute_email",
        label: "Institute Email",
        locked: true,
    },

];

const OPTIONAL_COLUMNS = [

    {
        key: "personal_email",
        label: "Personal Email",
    },

    {
        key: "contact_number",
        label: "Contact Number",
    },

    {
        key: "alternate_contact_number",
        label: "Alternate Contact Number",
    },

    {
        key: "gender",
        label: "Gender",
    },

    {
        key: "date_of_birth",
        label: "Date Of Birth",
    },

    {
        key: "placement_preference",
        label: "Placement Preference",
    },

    {
        key: "placement_status",
        label: "Placement Status",
    },

    {
        key: "current_institute_name",
        label: "Institute",
    },

    {
        key: "current_degree_level",
        label: "Degree",
    },

    {
        key: "current_branch_name",
        label: "Branch",
    },

    {
        key: "current_semester",
        label: "Current Semester",
    },

    {
        key: "current_cgpa",
        label: "CGPA",
    },

    {
        key: "tenth_percentage",
        label: "10th %",
    },

    {
        key: "education_path",
        label: "Diploma Or HSC",
    },

    {
        key: "normalized_hsc_diploma",
        label: "HSC / Diploma %",
    },

    {
        key: "active_backlogs",
        label: "Active Backlogs",
    },

    {
        key: "year_gap_count",
        label: "Year Gap",
    },

    {
        key: "graduation_year",
        label: "Graduation Year",
    },

    {
        key: "technical_skills",
        label: "Technical Skills",
    },

    {
        key: "programming_languages",
        label: "Programming Languages",
    },

    {
        key: "tools_and_technologies",
        label: "Tools & Technologies",
    },

    {
        key: "github_url",
        label: "Github",
    },

    {
        key: "linkedin_url",
        label: "LinkedIn",
    },

    {
        key: "portfolio_url",
        label: "Portfolio",
    },

    {
        key: "strengths",
        label: "Strengths",
    },

    {
        key: "profile_score",
        label: "Profile Score",
    },

    {
        key: "resume_url",
        label: "Resume URL",
    },

    {
        key: "application_status",
        label: "Application Status",
    },

    {
        key: "applied_at",
        label: "Applied Date",
    },

    {
        key: "remarks",
        label: "Remarks",
    },

];

export function AdminOpportunityExportPage({
    opportunityId,
}: {
    opportunityId: string;
}) {

    const [rows, setRows] =
        useState<any[]>([]);

    const [
        dynamicQuestions,
        setDynamicQuestions,
    ] =
        useState<string[]>([]);

    const [
        selectedColumns,
        setSelectedColumns,
    ] =
        useState<string[]>([
            "name",
            "enrollment",
            "institute_email",
        ]);

    async function load() {

        const data =
            await adminExportService
                .getOpportunityExportData(
                    opportunityId
                );

        setRows(
            data.rows
        );

        setDynamicQuestions(
            data.dynamicQuestions
        );

    }

    useEffect(() => {

        load();

    }, []);

    const exportColumns =
        useMemo(() => {

            return [

                ...selectedColumns,

                ...dynamicQuestions,

            ];

        }, [
            selectedColumns,
            dynamicQuestions,
        ]);

    function getValue(
        row: any,
        column: string
    ) {

        switch (column) {

            case "name":

                return `${row.profile?.first_name || ""} ${row.profile?.last_name || ""}`;

            case "enrollment":

                return row.profile?.enrollment_no || "";

            case "institute_email":

                return row.profile?.institute_email || "";

            case "personal_email":

                return row.profile?.personal_email || "";

            case "contact_number":

                return row.profile?.contact_number || "";

            case "alternate_contact_number":

                return row.profile?.alternate_contact_number || "";

            case "gender":

                return row.profile?.gender || "";

            case "date_of_birth":

                return row.profile?.date_of_birth || "";

            case "placement_preference":

                return row.profile?.placement_preference || "";

            case "placement_status":

                return row.profile?.placement_status || "";

            case "current_institute_name":

                return row.academic?.current_institute_name || "";

            case "current_degree_level":

                return row.academic?.current_degree_level || "";

            case "current_branch_name":

                return row.academic?.current_branch_name || "";

            case "current_semester":

                return row.academic?.current_semester || "";

            case "current_cgpa":

                return row.academic?.current_cgpa || "";

            case "tenth_percentage":

                return row.academic?.tenth_percentage || "";

            case "education_path":

                return row.academic?.education_path || "";

            case "normalized_hsc_diploma":

                return (
                    row.academic?.diploma_percentage
                    ||
                    row.academic?.twelfth_percentage
                    ||
                    ""
                );

            case "active_backlogs":

                return row.academic?.active_backlogs || "";

            case "year_gap_count":

                return row.academic?.year_gap_count || "";

            case "graduation_year":

                return row.academic?.graduation_year || "";

            case "technical_skills":

                return row.skill?.technical_skills || "";

            case "programming_languages":

                return row.skill?.programming_languages || "";

            case "tools_and_technologies":

                return row.skill?.tools_and_technologies || "";

            case "github_url":

                return row.skill?.github_url || "";

            case "linkedin_url":

                return row.skill?.linkedin_url || "";

            case "portfolio_url":

                return row.skill?.portfolio_url || "";

            case "strengths":

                return row.skill?.strengths || "";

            case "profile_score":

                return row.skill?.profile_score || "";

            case "resume_url":

                return row.resumeUrl || "";

            case "application_status":

                return row.application?.application_status || "";

            case "remarks":

                return row.application?.remarks || "";

            case "applied_at":

                return row.application?.applied_at || "";

            default:

                return row.answers?.[column] || "";

        }

    }

    async function exportExcel() {

        const workbook =
            new ExcelJS.Workbook();

        const sheet =
            workbook.addWorksheet(
                "Applicants"
            );

        sheet.addRow(
            exportColumns
        );

        rows.forEach(
            (row) => {

                sheet.addRow(
                    exportColumns.map(
                        (
                            col
                        ) =>
                            getValue(
                                row,
                                col
                            )
                    )
                );

            }
        );

        const buffer =
            await workbook.xlsx.writeBuffer();

        const blob =
            new Blob(
                [buffer]
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const a =
            document.createElement(
                "a"
            );

        a.href = url;

        a.download =
            "applicants.xlsx";

        a.click();

        URL.revokeObjectURL(
            url
        );

    }

    return (

        <div className="mx-auto max-w-7xl p-6">

            <div className="flex items-center justify-between">

                <h1 className="text-2xl font-bold">
                    Export Builder
                </h1>

                <button

                    onClick={exportExcel}

                    className="rounded-lg border px-4 py-2"

                >

                    Export XLSX

                </button>

            </div>

            <div className="mt-6 grid grid-cols-12 gap-6">

                <div className="col-span-3 rounded-lg border p-4">

                    <h2 className="mb-4 font-semibold">
                        Available Columns
                    </h2>

                    {OPTIONAL_COLUMNS.map(
                        (column) => {

                            const selected =
                                selectedColumns.includes(
                                    column.key
                                );

                            return (

                                <label
                                    key={column.key}
                                    className="mb-2 flex items-center gap-2"
                                >

                                    <input

                                        type="checkbox"

                                        checked={
                                            selected
                                        }

                                        onChange={(
                                            e
                                        ) => {

                                            if (
                                                e.target.checked
                                            ) {

                                                setSelectedColumns(
                                                    (
                                                        prev
                                                    ) => [

                                                            ...prev,

                                                            column.key,

                                                        ]
                                                );

                                            } else {

                                                setSelectedColumns(
                                                    (
                                                        prev
                                                    ) =>
                                                        prev.filter(
                                                            (
                                                                x
                                                            ) =>
                                                                x !==
                                                                column.key
                                                        )
                                                );

                                            }

                                        }}

                                    />

                                    {
                                        column.label
                                    }

                                </label>

                            );

                        }
                    )}

                </div>

                <div className="col-span-9 rounded-lg border p-4 overflow-auto">

                    <table className="min-w-full border">

                        <thead>

                            <tr>

                                {exportColumns.map(
                                    (
                                        column
                                    ) => (

                                        <th
                                            key={column}
                                            className="border p-2 text-left"
                                        >

                                            {column}

                                        </th>

                                    )
                                )}

                            </tr>

                        </thead>

                        <tbody>

                            {rows
                                .slice(
                                    0,
                                    20
                                )
                                .map(
                                    (
                                        row,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                index
                                            }
                                        >

                                            {exportColumns.map(
                                                (
                                                    column
                                                ) => (

                                                    <td
                                                        key={
                                                            column
                                                        }
                                                        className="border p-2"
                                                    >

                                                        {String(
                                                            getValue(
                                                                row,
                                                                column
                                                            )
                                                        )}

                                                    </td>

                                                )
                                            )}

                                        </tr>

                                    )
                                )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

}