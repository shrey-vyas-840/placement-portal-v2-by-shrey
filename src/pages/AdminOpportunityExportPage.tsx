import {
    useEffect,
    useMemo,
    useState,
} from "react";

import ExcelJS from "exceljs";

import {
    adminExportService,
} from "@/services/adminExportService";

import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";

import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";

import {
    CSS,
} from "@dnd-kit/utilities";

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
        key: "current_degree_name",
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

const COLUMN_LABEL_MAP =
    Object.fromEntries(

        [

            ...FIXED_COLUMNS,

            ...OPTIONAL_COLUMNS,

        ].map(
            (
                x
            ) => [

                    x.key,

                    x.label,

                ]
        )

    );

function SortableColumn({
    id,
    label,
}: {
    id: string;
    label: string;
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } =
        useSortable({
            id,
        });

    const style = {

        transform:
            CSS.Transform.toString(
                transform
            ),

        transition,

    };

    return (

        <div

            ref={setNodeRef}

            style={style}

            {...attributes}

            {...listeners}

            className="mb-2 cursor-move rounded border p-2"

        >

            {label}

        </div>

    );

}

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

    const [
        companyName,
        setCompanyName,
    ] =
        useState("");

    const [
        columnOrder,
        setColumnOrder,
    ] =
        useState<string[]>(
            []
        );

    async function load() {

        const data =
            await adminExportService
                .getOpportunityExportData(
                    opportunityId
                );

        setRows(
            data.rows
        );

        setCompanyName(
            data.companyName || ""
        );

        setDynamicQuestions(
            data.dynamicQuestions
        );

        setColumnOrder(

            OPTIONAL_COLUMNS.map(
                (
                    x
                ) =>
                    x.key
            )

        );
    }

    function handleDragEnd(
        event: any
    ) {

        const {
            active,
            over,
        } = event;

        if (
            !over
            ||
            active.id
            ===
            over.id
        ) {
            return;
        }

        setColumnOrder(
            (
                current
            ) => {

                const oldIndex =
                    current.indexOf(
                        active.id
                    );

                const newIndex =
                    current.indexOf(
                        over.id
                    );

                return arrayMove(
                    current,
                    oldIndex,
                    newIndex
                );

            }
        );

    }

    useEffect(() => {

        load();

    }, []);

    const exportColumns =
        useMemo(() => {

            const locked =
                FIXED_COLUMNS.map(
                    x => x.key
                );

            const custom =
                columnOrder.filter(
                    (
                        column
                    ) =>

                        selectedColumns.includes(
                            column
                        )

                        &&

                        !locked.includes(
                            column
                        )

                );

            return [

                ...locked,

                ...custom,

                ...dynamicQuestions,

            ];

        }, [
            selectedColumns,
            dynamicQuestions,
            columnOrder,
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

            case "current_degree_name":

                return row.academic?.current_degree_name || "";

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

    function exportCsv() {

        const header =
            exportColumns.join(
                ","
            );

        const body =
            rows.map(
                (
                    row
                ) =>

                    exportColumns

                        .map(
                            (
                                column
                            ) => {

                                const value =
                                    getValue(
                                        row,
                                        column
                                    );

                                return `"${String(
                                    value ??
                                    ""
                                )
                                    .replaceAll(
                                        `"`,
                                        `""`
                                    )}"`;

                            }
                        )

                        .join(
                            ","
                        )

            );

        const csv =
            [
                header,
                ...body,
            ].join(
                "\n"
            );

        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;",
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const a =
            document.createElement(
                "a"
            );

        a.href =
            url;

        a.download =
            `${companyName || "Applicants"}.csv`;

        a.click();

        URL.revokeObjectURL(
            url
        );

    }

    async function exportExcel() {

        const workbook =
            new ExcelJS.Workbook();

        const sheet =
            workbook.addWorksheet(
                "Applicants"
            );

        const totalColumns =
            Math.max(
                exportColumns.length,
                1
            );

        sheet.mergeCells(
            1,
            1,
            1,
            totalColumns
        );

        sheet.mergeCells(
            2,
            1,
            2,
            totalColumns
        );

        const titleCell =
            sheet.getCell(
                "A1"
            );

        titleCell.value =
            "INDUS UNIVERSITY";

        titleCell.font = {

            bold: true,

            size: 18,

            color: {
                argb: "FFFFFFFF",
            },

        };

        titleCell.alignment = {

            horizontal:
                "center",

            vertical:
                "middle",

        };

        titleCell.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {
                argb: "FF1E3A8A",
            },

        };

        const companyCell =
            sheet.getCell(
                "A2"
            );

        companyCell.value =
            companyName ||
            "COMPANY";

        companyCell.font = {

            bold: true,

            size: 14,

            color: {
                argb: "FFFFFFFF",
            },

        };

        companyCell.alignment = {

            horizontal:
                "center",

            vertical:
                "middle",

        };

        companyCell.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {
                argb: "FF2563EB",
            },

        };

        sheet.getRow(
            1
        ).height = 30;

        sheet.getRow(
            2
        ).height = 24;

        sheet.getRow(
            3
        ).height = 22;

        const headerRow =
            sheet.getRow(3);

        headerRow.values =
            exportColumns.map(
                (
                    column
                ) =>

                    COLUMN_LABEL_MAP[
                    column
                    ]

                    ||

                    column
                        .replaceAll(
                            "_",
                            " "
                        )

            )

        headerRow.eachCell(
            (cell) => {

                cell.font = {
                    bold: true,
                };

                cell.alignment = {
                    horizontal:
                        "center",
                    vertical:
                        "middle",
                };

                cell.fill = {

                    type:
                        "pattern",

                    pattern:
                        "solid",

                    fgColor: {
                        argb:
                            "FFDDEBF7",
                    },

                };

            }
        );

        let rowIndex = 4;

        rows.forEach(
            (row) => {

                const excelRow =
                    sheet.getRow(
                        rowIndex++
                    );

                excelRow.values =
                    exportColumns.map(
                        (
                            column
                        ) =>
                            getValue(
                                row,
                                column
                            )
                    );

            }
        );

        sheet.views = [

            {
                state: "frozen",
                ySplit: 3,
            },

        ];

        sheet.autoFilter = {

            from:
                "A3",

            to:
                `${String.fromCharCode(
                    64 +
                    exportColumns.length
                )}3`,

        };

        sheet.columns.forEach(
            (
                column
            ) => {

                let max =
                    15;

                column.eachCell?.(
                    {
                        includeEmpty:
                            true,
                    },
                    (
                        cell
                    ) => {

                        const len =
                            String(
                                cell.value
                                ??
                                ""
                            ).length;

                        max =
                            Math.max(
                                max,
                                len
                            );

                    }
                );

                column.width =
                    Math.min(
                        max + 4,
                        60
                    );

            }
        );

        sheet.eachRow(
            (row) => {

                row.eachCell(
                    (cell) => {

                        cell.border = {

                            top: {
                                style:
                                    "thin",
                            },

                            left: {
                                style:
                                    "thin",
                            },

                            right: {
                                style:
                                    "thin",
                            },

                            bottom: {
                                style:
                                    "thin",
                            },

                        };

                    }
                );
            }
        );

        const buffer =
            await workbook
                .xlsx
                .writeBuffer();

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
            `${companyName || "Applicants"}.xlsx`;

        a.click();

        URL.revokeObjectURL(
            url
        );

    }

    return (

        <div className="mx-auto max-w-7xl p-6">

            <div className="flex gap-2">

                <button

                    onClick={exportCsv}

                    className="rounded-lg border px-4 py-2"

                >

                    Export CSV

                </button>

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

                    <div className="mb-4 rounded-lg border bg-muted p-3">

                        <div className="font-semibold mb-2">
                            Locked Columns
                        </div>

                        <div>🔒 Name</div>
                        <div>🔒 Enrollment No</div>
                        <div>🔒 Institute Email</div>

                    </div>

                    <DndContext

                        collisionDetection={
                            closestCenter
                        }

                        onDragEnd={
                            handleDragEnd
                        }

                    >

                        <SortableContext

                            items={
                                columnOrder
                            }

                            strategy={
                                verticalListSortingStrategy
                            }

                        >

                            {columnOrder.map(
                                (
                                    columnKey
                                ) => {

                                    const column =
                                        OPTIONAL_COLUMNS.find(
                                            (
                                                x
                                            ) =>
                                                x.key
                                                ===
                                                columnKey
                                        );

                                    if (
                                        !column
                                    ) {
                                        return null;
                                    }

                                    const selected =
                                        selectedColumns.includes(
                                            column.key
                                        );

                                    return (

                                        <div
                                            key={
                                                column.key
                                            }
                                        >

                                            <label
                                                className="mb-1 flex items-center gap-2"
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
                                                                            x
                                                                            !==
                                                                            column.key
                                                                    )
                                                            );

                                                        }

                                                    }}

                                                />

                                                <span>

                                                    {
                                                        column.label
                                                    }

                                                </span>

                                            </label>

                                            <SortableColumn

                                                id={
                                                    column.key
                                                }

                                                label={
                                                    column.label
                                                }

                                            />

                                        </div>

                                    );

                                }
                            )}

                        </SortableContext>

                    </DndContext>

                    <div className="mt-6 border-t pt-4">

                        <h3 className="mb-2 mt-6 font-semibold text-blue-600">
                            Auto Exported Questions
                        </h3>

                        <p className="mb-3 text-sm text-muted-foreground">

                            Company specific questions. These columns are automatically appended and always exported.
                        </p>

                        {dynamicQuestions.map(
                            (
                                question
                            ) => (

                                <div

                                    key={
                                        question
                                    }

                                    className="mb-2 rounded border bg-muted p-2 text-sm"

                                >

                                    {question}

                                </div>

                            )
                        )}

                    </div>

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

                                            {
                                                COLUMN_LABEL_MAP[
                                                column
                                                ]
                                                ||
                                                column
                                                    .replaceAll(
                                                        "_",
                                                        " "
                                                    )
                                            }

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

        </div >

    );

}