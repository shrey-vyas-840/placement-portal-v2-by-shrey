import { useEffect, useState } from "react";
import { academicService } from "@/services/academicService";

type Props = {
    studentId: string;
    existingData?: any;
    onSaved: () => void;
};

const instituteOptions = [
    "IITE",
    "IIMS",
    "IIICT",
    "IIPR",
    "IISHLS",
    "IIATE",
    "Other",
];

const branchOptions = [
    "Computer Science Engineering",
    "Information Technology",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Other",
];

const degreeOptions = [
    "Diploma",
    "UG",
    "PG",
];
export function AcademicSection({
    studentId,
    existingData,
    onSaved,
}: Props) {
    const [saving, setSaving] =
        useState(false);
    const [editing, setEditing] =
        useState(false);

    const [error, setError] =
        useState("");
    const [originalData, setOriginalData] =
        useState<any>(null);

    const [educationPath, setEducationPath] =
        useState(
            existingData?.education_path ??
            "",
        );

    const [
        currentDegreeLevel,
        setCurrentDegreeLevel,
    ] = useState(
        existingData?.current_degree_level ??
        "",
    );

    const [
        currentInstituteName,
        setCurrentInstituteName,
    ] = useState(
        existingData?.current_institute_name ??
        "",
    );

    const [
        currentBranchName,
        setCurrentBranchName,
    ] = useState(
        existingData?.current_branch_name ??
        "",
    );

    const [
        currentSemester,
        setCurrentSemester,
    ] = useState(
        existingData?.current_semester?.toString() ??
        "",
    );

    const [cgpa, setCgpa] =
        useState(
            existingData?.current_cgpa?.toString() ??
            "",
        );

    const [
        tenthPercentage,
        setTenthPercentage,
    ] = useState(
        existingData?.tenth_percentage?.toString() ??
        "",
    );

    const [
        twelfthPercentage,
        setTwelfthPercentage,
    ] = useState(
        existingData?.twelfth_percentage?.toString() ??
        "",
    );

    const [
        diplomaPercentage,
        setDiplomaPercentage,
    ] = useState(
        existingData?.diploma_percentage?.toString() ??
        "",
    );

    const [gpaInput, setGpaInput] =
        useState("");

    const [
        activeBacklogs,
        setActiveBacklogs,
    ] = useState(
        existingData?.active_backlogs?.toString() ??
        "0",
    );

    const [
        yearGapCount,
        setYearGapCount,
    ] = useState(
        existingData?.year_gap_count?.toString() ??
        "0",
    );

    const [
        graduationYear,
        setGraduationYear,
    ] = useState(
        existingData?.graduation_year?.toString() ??
        "",
    );

    useEffect(() => {
        if (!existingData) {
            setEditing(true);
            return;
        }

        setEditing(false);
        setOriginalData(existingData);

        setEducationPath(
            existingData.education_path ?? "",
        );

        setCurrentDegreeLevel(
            existingData.current_degree_level ?? "",
        );

        setCurrentInstituteName(
            existingData.current_institute_name ?? "",
        );

        setCurrentBranchName(
            existingData.current_branch_name ?? "",
        );

        setCurrentSemester(
            existingData.current_semester?.toString() ?? "",
        );

        setCgpa(
            existingData.current_cgpa?.toString() ?? "",
        );

        setTenthPercentage(
            existingData.tenth_percentage?.toString() ?? "",
        );

        setTwelfthPercentage(
            existingData.twelfth_percentage?.toString() ?? "",
        );

        setDiplomaPercentage(
            existingData.diploma_percentage?.toString() ?? "",
        );

        setActiveBacklogs(
            existingData.active_backlogs?.toString() ?? "0",
        );

        setYearGapCount(
            existingData.year_gap_count?.toString() ?? "0",
        );

        setGraduationYear(
            existingData.graduation_year?.toString() ?? "",
        );
    }, [existingData]);

    function handleGpaConvert() {
        if (!gpaInput) {
            return;
        }

        const gpa =
            Number(gpaInput);

        if (
            Number.isNaN(gpa) ||
            gpa < 0 ||
            gpa > 10
        ) {
            return;
        }

        const converted =
            (gpa * 9.5).toFixed(2);

        if (
            educationPath === "HSC"
        ) {
            setTwelfthPercentage(
                converted,
            );
        }

        if (
            educationPath ===
            "Diploma"
        ) {
            setDiplomaPercentage(
                converted,
            );
        }
    }

    async function handleSave() {
        try {
            setError("");

            if (!educationPath) {
                setError(
                    "Education path is required.",
                );
                return;
            }

            if (
                !currentDegreeLevel
            ) {
                setError(
                    "Current degree level is required.",
                );
                return;
            }

            if (
                !currentInstituteName.trim()
            ) {
                setError(
                    "Institute name is required.",
                );
                return;
            }

            if (
                !currentBranchName.trim()
            ) {
                setError(
                    "Branch name is required.",
                );
                return;
            }

            if (
                !tenthPercentage
            ) {
                setError(
                    "10th percentage is required.",
                );
                return;
            }

            if (
                educationPath ===
                "HSC" &&
                !twelfthPercentage
            ) {
                setError(
                    "12th percentage is required.",
                );
                return;
            }

            if (
                educationPath ===
                "Diploma" &&
                !diplomaPercentage
            ) {
                setError(
                    "Diploma percentage is required.",
                );
                return;
            }

            if (
                Number(cgpa) < 0 ||
                Number(cgpa) > 10
            ) {
                setError(
                    "CGPA must be between 0 and 10.",
                );
                return;
            }

            if (
                Number(tenthPercentage) <
                0 ||
                Number(tenthPercentage) >
                100
            ) {
                setError(
                    "10th percentage must be between 0 and 100.",
                );
                return;
            }

            if (
                educationPath ===
                "HSC" &&
                (Number(
                    twelfthPercentage,
                ) < 0 ||
                    Number(
                        twelfthPercentage,
                    ) > 100)
            ) {
                setError(
                    "12th percentage must be between 0 and 100.",
                );
                return;
            }

            if (
                educationPath ===
                "Diploma" &&
                (Number(
                    diplomaPercentage,
                ) < 0 ||
                    Number(
                        diplomaPercentage,
                    ) > 100)
            ) {
                setError(
                    "Diploma percentage must be between 0 and 100.",
                );
                return;
            }

            setSaving(true);

            await academicService.saveAcademicDetails(
                {
                    student_id:
                        studentId,

                    education_path:
                        educationPath,

                    current_degree_level:
                        currentDegreeLevel,

                    current_institute_name:
                        currentInstituteName,

                    current_branch_name:
                        currentBranchName,

                    current_semester:
                        Number(
                            currentSemester,
                        ),

                    current_cgpa:
                        Number(cgpa),

                    tenth_percentage:
                        Number(
                            tenthPercentage,
                        ),

                    twelfth_percentage:
                        educationPath === "HSC"
                            ? Number(
                                twelfthPercentage,
                            )
                            : null,

                    diploma_percentage:
                        educationPath === "Diploma"
                            ? Number(
                                diplomaPercentage,
                            )
                            : null,

                    active_backlogs:
                        Number(
                            activeBacklogs,
                        ),

                    year_gap_count:
                        Number(
                            yearGapCount,
                        ),

                    graduation_year:
                        Number(
                            graduationYear,
                        ),

                    created_by_type:
                        "User",

                    is_active: true,
                },
            );

            setEditing(false);

            onSaved();

            setError("");
        } catch (err) {
            console.error(
                "ACADEMIC SAVE ERROR",
                JSON.stringify(err, null, 2),
            );

            setError(
                "Failed to save academic details.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mt-6 rounded border p-6">
            <h2 className="text-lg font-semibold">
                Academic Details
            </h2>

            {error && (
                <p className="mt-3 text-red-500">
                    {error}
                </p>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">

                <select
                    disabled={!editing}
                    className="rounded border p-2"
                    value={educationPath}
                    onChange={(e) => {
                        const value =
                            e.target.value;

                        setEducationPath(value);

                        if (value === "HSC") {
                            setDiplomaPercentage("");
                        }

                        if (
                            value === "Diploma"
                        ) {
                            setTwelfthPercentage("");
                        }
                    }}
                >
                    <option value="">
                        Select Education Path
                    </option>

                    <option value="HSC">
                        HSC
                    </option>

                    <option value="Diploma">
                        Diploma
                    </option>
                </select>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Current Degree Level
                    </label>

                    <select
                        disabled={!editing}
                        className="w-full rounded border p-2"
                        value={currentDegreeLevel}
                        onChange={(e) =>
                            setCurrentDegreeLevel(
                                e.target.value,
                            )
                        }
                    >
                        <option value="">
                            Select Degree
                        </option>

                        {degreeOptions.map(
                            (degree) => (
                                <option
                                    key={degree}
                                    value={degree}
                                >
                                    {degree}
                                </option>
                            ),
                        )}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Current Institute
                    </label>

                    <select
                        disabled={!editing}
                        className="w-full rounded border p-2"
                        value={currentInstituteName}
                        onChange={(e) =>
                            setCurrentInstituteName(
                                e.target.value,
                            )
                        }
                    >
                        <option value="">
                            Select Institute
                        </option>

                        {instituteOptions.map(
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
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Current Branch
                    </label>

                    <select
                        disabled={!editing}
                        className="w-full rounded border p-2"
                        value={currentBranchName}
                        onChange={(e) =>
                            setCurrentBranchName(
                                e.target.value,
                            )
                        }
                    >
                        <option value="">
                            Select Branch
                        </option>

                        {branchOptions.map(
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
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        10th Percentage
                    </label>

                    <input
                        disabled={!editing}
                        className="w-full rounded border p-2"
                        value={tenthPercentage}
                        onChange={(e) =>
                            setTenthPercentage(
                                e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                ),
                            )
                        }
                    />
                </div>

                {educationPath ===
                    "HSC" && (
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                12th / Diploma Percentage
                            </label>

                            <input
                                disabled={!editing}
                                className="w-full rounded border p-2"
                                value={
                                    twelfthPercentage
                                }
                                onChange={(e) =>
                                    setTwelfthPercentage(
                                        e.target.value.replace(
                                            /[^0-9.]/g,
                                            "",
                                        ),
                                    )
                                }
                            />
                        </div>
                    )}

                {educationPath ===
                    "Diploma" && (
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Diploma Percentage
                            </label>

                            <input
                                disabled={!editing}
                                className="w-full rounded border p-2"
                                value={
                                    diplomaPercentage
                                }
                                onChange={(e) =>
                                    setDiplomaPercentage(
                                        e.target.value.replace(
                                            /[^0-9.]/g,
                                            "",
                                        ),
                                    )
                                }
                            />
                        </div>
                    )}

                {educationPath &&
                    !(
                        educationPath ===
                        "HSC" &&
                        twelfthPercentage
                    ) &&
                    !(
                        educationPath ===
                        "Diploma" &&
                        diplomaPercentage
                    ) && (
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                GPA to Percentage Converter (Optional)
                            </label>

                            <div className="flex gap-2">
                                <input
                                    disabled={!editing}
                                    className="w-full rounded border p-2"
                                    placeholder="Enter GPA"
                                    value={gpaInput}
                                    onChange={(e) => {
                                        let value =
                                            e.target.value.replace(
                                                /[^0-9.]/g,
                                                "",
                                            );

                                        const parts =
                                            value.split(".");

                                        if (
                                            parts.length > 2
                                        ) {
                                            return;
                                        }

                                        if (
                                            parts[1] &&
                                            parts[1].length >
                                            2
                                        ) {
                                            return;
                                        }

                                        if (
                                            Number(value) > 10
                                        ) {
                                            return;
                                        }

                                        if (
                                            value.startsWith(
                                                "10",
                                            ) &&
                                            value !== "10" &&
                                            value !== "10." &&
                                            value !== "10.0" &&
                                            value !== "10.00"
                                        ) {
                                            return;
                                        }

                                        setGpaInput(
                                            value,
                                        );
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={
                                        handleGpaConvert
                                    }
                                    className="rounded bg-black px-4 py-2 text-white"
                                >
                                    Convert
                                </button>
                            </div>
                        </div>
                    )}

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Current Semester
                    </label>
                    <input
                        disabled={!editing}
                        className="rounded border p-2"
                        placeholder="Current Semester"
                        value={
                            currentSemester
                        }
                        onChange={(e) =>
                            setCurrentSemester(
                                e.target.value.replace(
                                    /\D/g,
                                    "",
                                ),
                            )
                        }
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Current CGPA
                    </label>

                    <input
                        disabled={!editing}
                        className="w-full rounded border p-2"
                        value={cgpa}
                        onChange={(e) =>
                            setCgpa(
                                e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                ),
                            )
                        }
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Current Active Backlogs
                    </label>
                    <input
                        disabled={!editing}
                        className="rounded border p-2"
                        placeholder="Active Backlogs"
                        value={
                            activeBacklogs
                        }
                        onChange={(e) =>
                            setActiveBacklogs(
                                e.target.value.replace(
                                    /\D/g,
                                    "",
                                ),
                            )
                        }
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Year Gap Count
                    </label>
                    <input
                        disabled={!editing}
                        className="rounded border p-2"
                        placeholder="Year Gap Count"
                        value={
                            yearGapCount
                        }
                        onChange={(e) =>
                            setYearGapCount(
                                e.target.value.replace(
                                    /\D/g,
                                    "",
                                ),
                            )
                        }
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">
                        Graduation Year
                    </label>

                    <input
                        disabled={!editing}
                        className="w-full rounded border p-2"
                        value={graduationYear}
                        onChange={(e) =>
                            setGraduationYear(
                                e.target.value.replace(
                                    /\D/g,
                                    "",
                                ),
                            )
                        }
                    />
                </div>

            </div>

            <div className="mt-6 flex gap-2">

                {!editing && (
                    <button
                        type="button"
                        onClick={() =>
                            setEditing(true)
                        }
                        className="rounded bg-black px-4 py-2 text-white"
                    >
                        Edit Academic Details
                    </button>
                )}

                {editing && (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                if (originalData) {
                                    setEducationPath(
                                        originalData.education_path ?? "",
                                    );

                                    setCurrentDegreeLevel(
                                        originalData.current_degree_level ?? "",
                                    );

                                    setCurrentInstituteName(
                                        originalData.current_institute_name ?? "",
                                    );

                                    setCurrentBranchName(
                                        originalData.current_branch_name ?? "",
                                    );

                                    setCurrentSemester(
                                        originalData.current_semester?.toString() ?? "",
                                    );

                                    setCgpa(
                                        originalData.current_cgpa?.toString() ?? "",
                                    );

                                    setTenthPercentage(
                                        originalData.tenth_percentage?.toString() ?? "",
                                    );

                                    setTwelfthPercentage(
                                        originalData.twelfth_percentage?.toString() ?? "",
                                    );

                                    setDiplomaPercentage(
                                        originalData.diploma_percentage?.toString() ?? "",
                                    );

                                    setActiveBacklogs(
                                        originalData.active_backlogs?.toString() ?? "0",
                                    );

                                    setYearGapCount(
                                        originalData.year_gap_count?.toString() ?? "0",
                                    );

                                    setGraduationYear(
                                        originalData.graduation_year?.toString() ?? "",
                                    );
                                }

                                setEditing(false);
                            }}
                            className="rounded border px-4 py-2"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded bg-black px-4 py-2 text-white"
                        >
                            {saving
                                ? "Saving..."
                                : "Save Academic Details"}
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}