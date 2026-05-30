import { useEffect, useState } from "react";
import { adminDriveService } from "@/services/adminDriveService";
import { ELIGIBILITY_MAPPING } from "@/constants/eligibilityMapping";

export function AdminDrivesPage() {
    const [companies, setCompanies] =
        useState<any[]>([]);

    const [drives, setDrives] =
        useState<any[]>([]);

    const [companyId, setCompanyId] =
        useState("");

    const [driveName, setDriveName] =
        useState("");

    const [driveType, setDriveType] =
        useState("");

    const [driveMode, setDriveMode] =
        useState("Online");

    const [driveDate, setDriveDate] =
        useState("");

    const [deadline, setDeadline] =
        useState("");

    const [lowestPackage, setLowestPackage] =
        useState("");

    const [highestPackage, setHighestPackage] =
        useState("");

    const [bondYears, setBondYears] =
        useState("");

    const [remarks, setRemarks] =
        useState("");

    const [editingDriveId, setEditingDriveId] =
        useState<string | null>(null);

    const [showArchived, setShowArchived] =
        useState(false);

    const [passingBatch, setPassingBatch] =
        useState("");

    const [minimumCgpa, setMinimumCgpa] =
        useState("");

    const [backlogs, setBacklogs] =
        useState("0");

    const [branches, setBranches] =
        useState("");

    const [degrees, setDegrees] =
        useState("");

    const [relocation, setRelocation] =
        useState(false);

    const [selectedInstitutes,
        setSelectedInstitutes] =
        useState<string[]>([]);

    const [selectedDegrees,
        setSelectedDegrees] =
        useState<string[]>([]);

    const [selectedBranches,
        setSelectedBranches] =
        useState<string[]>([]);

    const [additionalRequirements,
        setAdditionalRequirements] =
        useState("");
    async function load() {
        const companyData =
            await adminDriveService.getCompanies();

        const driveData =
            await adminDriveService.getDrives();

        setCompanies(companyData);
        setDrives(driveData);
    }

    useEffect(() => {
        load();
    }, []);

    async function handleSubmit(
        e: React.FormEvent,
    ) {
        e.preventDefault();

        const currentYear =
            new Date().getFullYear();

        if (
            passingBatch &&
            Number(
                passingBatch,
            ) < currentYear
        ) {
            alert(
                "Invalid passing batch",
            );
            return;
        }

        if (
            minimumCgpa &&
            Number(
                minimumCgpa,
            ) < 0
        ) {
            alert(
                "CGPA cannot be negative",
            );
            return;
        }

        if (
            Number(backlogs) < 0
        ) {
            alert(
                "Backlogs cannot be negative",
            );
            return;
        }

        if (
            Number(
                lowestPackage,
            ) < 0
        ) {
            alert(
                "Package cannot be negative",
            );
            return;
        }

        if (
            Number(
                highestPackage,
            ) < 0
        ) {
            alert(
                "Package cannot be negative",
            );
            return;
        }

        try {
            if (editingDriveId) {
                await adminDriveService.updateDrive(
                    editingDriveId,
                    {
                        company_id:
                            companyId,
                        drive_name:
                            driveName,
                        drive_type:
                            driveType,
                        drive_mode:
                            driveMode,
                        registration_deadline:
                            deadline,
                        drive_date:
                            driveDate,
                        lowest_package_lpa:
                            Number(
                                lowestPackage,
                            ),
                        highest_package_lpa:
                            Number(
                                highestPackage,
                            ),
                        bond_years:
                            Number(
                                bondYears,
                            ),
                        remarks,
                    },
                );
            } else {
                await adminDriveService.createDrive({
                    company_id:
                        companyId,
                    drive_name:
                        driveName,
                    drive_type:
                        driveType,
                    drive_mode:
                        driveMode,
                    registration_deadline:
                        deadline,
                    drive_date:
                        driveDate,
                    lowest_package_lpa:
                        Number(
                            lowestPackage,
                        ),
                    highest_package_lpa:
                        Number(
                            highestPackage,
                        ),
                    bond_years:
                        Number(
                            bondYears,
                        ),
                    remarks,
                });
            }

            setCompanyId("");
            setDriveName("");
            setDriveType("");
            setDriveMode("Online");
            setDriveDate("");
            setDeadline("");
            setLowestPackage("");
            setHighestPackage("");
            setBondYears("");
            setRemarks("");
            setPassingBatch("");
            setMinimumCgpa("");
            setBacklogs("0");

            setSelectedInstitutes([]);
            setSelectedDegrees([]);
            setSelectedBranches([]);

            setRelocation(false);

            setAdditionalRequirements("");

            if (
                editingDriveId
            ) {
                await adminDriveService.saveEligibility(
                    {
                        drive_id:
                            editingDriveId,

                        allowed_institutes:
                            selectedInstitutes.join(","),

                        allowed_degrees:
                            selectedDegrees.join(","),

                        allowed_branches:
                            selectedBranches.join(","),

                        passing_out_batch:
                            Number(
                                passingBatch,
                            ),

                        minimum_cgpa:
                            Number(
                                minimumCgpa,
                            ),

                        maximum_active_backlogs:
                            Number(
                                backlogs,
                            ),

                        willing_to_relocate_required:
                            relocation,

                        additional_requirements:
                            additionalRequirements,
                    }
                );
            }

            setEditingDriveId(null);

            await load();

        } catch (err) {
            console.error(err);
            alert("Failed to create drive");
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Drives
                </h1>

                {editingDriveId && (
                    <div className="mt-3 rounded border border-yellow-500 bg-yellow-50 p-3">
                        Editing Drive
                    </div>
                )}

                <div className="mt-4 flex gap-2">

                    <button
                        type="button"
                        onClick={() =>
                            setShowArchived(false)
                        }
                        className={`rounded border px-4 py-2 ${!showArchived
                            ? "font-semibold"
                            : ""
                            }`}
                    >
                        Active Drives
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setShowArchived(true)
                        }
                        className={`rounded border px-4 py-2 ${showArchived
                            ? "font-semibold"
                            : ""
                            }`}
                    >
                        Archived Drives
                    </button>

                </div>

                <div className="mt-6 overflow-hidden rounded-lg border">

                    <table className="w-full">

                        <thead>
                            <tr className="border-b bg-muted">

                                <th className="p-3 text-left">
                                    Company
                                </th>

                                <th className="p-3 text-left">
                                    Drive
                                </th>

                                <th className="p-3 text-left">
                                    Type
                                </th>

                                <th className="p-3 text-left">
                                    Status
                                </th>

                                <th className="p-3 text-left">
                                    Package
                                </th>

                                <th className="p-3 text-left">
                                    Deadline
                                </th>

                                <th className="p-3 text-left">
                                    Action
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {drives
                                .filter((drive) =>
                                    showArchived
                                        ? drive.is_active === false
                                        : drive.is_active === true,
                                )
                                .map((drive) => (
                                    <tr
                                        key={drive.drive_id}
                                        className="border-b"
                                    >

                                        <td className="p-3">
                                            {
                                                drive.company_master
                                                    ?.company_name
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                drive.drive_name
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                drive.drive_type
                                            }
                                        </td>

                                        <td className="p-3">

                                            <select
                                                value={
                                                    drive.drive_status
                                                }
                                                onChange={async (e) => {

                                                    await adminDriveService.updateDriveStatus(
                                                        drive.drive_id,
                                                        e.target.value,
                                                    );

                                                    await load();
                                                }}
                                                className="rounded border px-2 py-1"
                                            >

                                                <option value="Created">
                                                    Created
                                                </option>

                                                <option value="Published">
                                                    Published
                                                </option>

                                                <option value="Registration Open">
                                                    Registration Open
                                                </option>

                                                <option value="Registration Closed">
                                                    Registration Closed
                                                </option>

                                                <option value="Shortlisting">
                                                    Shortlisting
                                                </option>

                                                <option value="Interview Process">
                                                    Interview Process
                                                </option>

                                                <option value="Offer Released">
                                                    Offer Released
                                                </option>

                                                <option value="Completed">
                                                    Completed
                                                </option>

                                                <option value="Cancelled">
                                                    Cancelled
                                                </option>

                                            </select>

                                        </td>

                                        <td className="p-3">
                                            {drive.lowest_package_lpa &&
                                                drive.highest_package_lpa
                                                ? `${Number(
                                                    drive.lowest_package_lpa,
                                                )
                                                    .toFixed(2)
                                                    .padStart(5, "0")} - ${Number(
                                                        drive.highest_package_lpa,
                                                    )
                                                        .toFixed(2)
                                                        .padStart(5, "0")} LPA`
                                                : "-"}
                                        </td>

                                        <td className="p-3">

                                            {drive.registration_deadline
                                                ? new Date(
                                                    drive.registration_deadline,
                                                ).toLocaleDateString()
                                                : "-"}

                                        </td>

                                        <td className="p-3">
                                            <button
                                                className="rounded border px-3 py-1"
                                                onClick={() => {
                                                    setEditingDriveId(
                                                        drive.drive_id,
                                                    );

                                                    setCompanyId(
                                                        drive.company_id ||
                                                        "",
                                                    );

                                                    setDriveName(
                                                        drive.drive_name ||
                                                        "",
                                                    );

                                                    setDriveType(
                                                        drive.drive_type ||
                                                        "",
                                                    );

                                                    setDriveMode(
                                                        drive.drive_mode ||
                                                        "Online",
                                                    );

                                                    setDriveDate(
                                                        drive.drive_date ||
                                                        "",
                                                    );

                                                    setDeadline(
                                                        drive.registration_deadline
                                                            ?.slice(
                                                                0,
                                                                16,
                                                            ) ||
                                                        "",
                                                    );

                                                    setLowestPackage(
                                                        String(
                                                            drive.lowest_package_lpa ??
                                                            "",
                                                        ),
                                                    );

                                                    setHighestPackage(
                                                        String(
                                                            drive.highest_package_lpa ??
                                                            "",
                                                        ),
                                                    );

                                                    setBondYears(
                                                        String(
                                                            drive.bond_years ??
                                                            "",
                                                        ),
                                                    );

                                                    setRemarks(
                                                        drive.remarks ||
                                                        "",
                                                    );

                                                    (async () => {

                                                        const eligibility =
                                                            await adminDriveService.getEligibility(
                                                                drive.drive_id,
                                                            );

                                                        if (!eligibility) return;

                                                        setPassingBatch(
                                                            String(
                                                                eligibility.passing_out_batch,
                                                            ),
                                                        );

                                                        setMinimumCgpa(
                                                            String(
                                                                eligibility.minimum_cgpa,
                                                            ),
                                                        );

                                                        setBacklogs(
                                                            String(
                                                                eligibility.maximum_active_backlogs,
                                                            ),
                                                        );

                                                        setSelectedBranches(
                                                            eligibility.allowed_branches
                                                                ? eligibility.allowed_branches.split(",")
                                                                : [],
                                                        );

                                                        setSelectedDegrees(
                                                            eligibility.allowed_degrees
                                                                ? eligibility.allowed_degrees.split(",")
                                                                : [],
                                                        );

                                                        setRelocation(
                                                            eligibility.willing_to_relocate_required,
                                                        );

                                                        setSelectedInstitutes(
                                                            eligibility.allowed_institutes
                                                                ? eligibility.allowed_institutes.split(",")
                                                                : [],
                                                        );

                                                        setAdditionalRequirements(
                                                            eligibility.additional_requirements ||
                                                            "",
                                                        );

                                                    })();

                                                    window.scrollTo({
                                                        top: document.body.scrollHeight,
                                                        behavior:
                                                            "smooth",
                                                    });
                                                }}
                                            >
                                                Edit
                                            </button>

                                            {drive.is_active ? (
                                                <button
                                                    className="ml-2 rounded border px-3 py-1"
                                                    onClick={async () => {
                                                        const confirmed =
                                                            window.confirm(
                                                                "Archive this drive?",
                                                            );

                                                        if (!confirmed)
                                                            return;

                                                        await adminDriveService.deactivateDrive(
                                                            drive.drive_id,
                                                        );

                                                        await load();
                                                    }}
                                                >
                                                    Archive
                                                </button>
                                            ) : (
                                                <button
                                                    className="ml-2 rounded border px-3 py-1"
                                                    onClick={async () => {
                                                        await adminDriveService.restoreDrive(
                                                            drive.drive_id,
                                                        );

                                                        await load();
                                                    }}
                                                >
                                                    Restore
                                                </button>
                                            )}
                                        </td>

                                    </tr>
                                ))}

                        </tbody>

                    </table>

                </div>

                {editingDriveId && (
                    <div className="mt-3 rounded border border-yellow-500 bg-yellow-50 p-3">
                        Editing Drive
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 rounded-lg border p-5 space-y-4"
                >

                    <div>
                        <label className="mb-1 block font-medium">
                            Company
                        </label>

                        <select
                            value={companyId}
                            onChange={(e) =>
                                setCompanyId(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        >
                            <option value="">
                                Select Company
                            </option>

                            {companies.map(
                                (company) => (
                                    <option
                                        key={
                                            company.company_id
                                        }
                                        value={
                                            company.company_id
                                        }
                                    >
                                        {
                                            company.company_name
                                        }
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Drive Name
                        </label>

                        <input
                            value={driveName}
                            onChange={(e) =>
                                setDriveName(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Drive Type
                        </label>

                        <select
                            value={driveType}
                            onChange={(e) =>
                                setDriveType(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        >
                            <option value="">
                                Select Drive Type
                            </option>

                            <option value="Internship + PPO">
                                Internship + PPO
                            </option>

                            <option value="Full Time">
                                Full Time
                            </option>

                            <option value="Internship">
                                Internship
                            </option>

                            <option value="Apprenticeship">
                                Apprenticeship
                            </option>

                            <option value="Contract">
                                Contract
                            </option>

                            <option value="Other">
                                Other
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Drive Mode
                        </label>

                        <select
                            value={driveMode}
                            onChange={(e) =>
                                setDriveMode(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        >
                            <option>
                                Online
                            </option>

                            <option>
                                Offline
                            </option>

                            <option>
                                Hybrid
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Drive Date
                        </label>

                        <input
                            type="date"
                            value={driveDate}
                            onChange={(e) =>
                                setDriveDate(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Registration Deadline
                        </label>

                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) =>
                                setDeadline(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Lowest Package (LPA)
                        </label>

                        <p className="mb-2 text-xs text-muted-foreground">
                            Example: 4.50, 12.75, 18.25
                        </p>

                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={lowestPackage}
                            onChange={(e) =>
                                setLowestPackage(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Highest Package (LPA)
                        </label>

                        <p className="mb-2 text-xs text-muted-foreground">
                            Example: 8.50, 15.25, 24.75
                        </p>

                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={highestPackage}
                            onChange={(e) =>
                                setHighestPackage(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Bond Duration (Years)
                        </label>

                        <p className="mb-2 text-xs text-muted-foreground">
                            Example: 0.50, 1.00, 2.50, 3.75
                        </p>

                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bondYears}
                            onChange={(e) =>
                                setBondYears(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <hr />

                    <hr />

                    <h2 className="text-xl font-semibold">
                        Eligibility Mapping
                    </h2>

                    <h2 className="text-xl font-semibold">
                        Eligibility Mapping
                    </h2>

                    <div>

                        <label className="mb-2 block font-medium">
                            Institutes
                        </label>

                        <div className="grid grid-cols-2 gap-2">

                            {Object.keys(
                                ELIGIBILITY_MAPPING,
                            ).map((institute) => (

                                <label
                                    key={institute}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedInstitutes.includes(
                                            institute,
                                        )}
                                        onChange={(e) => {

                                            if (
                                                e.target.checked
                                            ) {

                                                setSelectedInstitutes([
                                                    ...selectedInstitutes,
                                                    institute,
                                                ]);

                                            } else {

                                                setSelectedInstitutes(
                                                    selectedInstitutes.filter(
                                                        (x) =>
                                                            x !==
                                                            institute,
                                                    ),
                                                );
                                            }
                                        }}
                                    />

                                    {institute}

                                </label>
                            ))}

                        </div>

                    </div>

                    <div>

                        <label className="mb-2 block font-medium">
                            Degrees
                        </label>

                        <div className="grid grid-cols-2 gap-2">

                            {selectedInstitutes.flatMap(
                                (inst) =>
                                    Object.keys(
                                        ELIGIBILITY_MAPPING[
                                        inst as keyof typeof ELIGIBILITY_MAPPING
                                        ],
                                    ),
                            )
                                .filter(
                                    (
                                        value,
                                        index,
                                        array,
                                    ) =>
                                        array.indexOf(
                                            value,
                                        ) === index,
                                )
                                .map((degree) => (

                                    <label
                                        key={degree}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDegrees.includes(
                                                degree,
                                            )}
                                            onChange={(e) => {

                                                if (
                                                    e.target.checked
                                                ) {

                                                    setSelectedDegrees([
                                                        ...selectedDegrees,
                                                        degree,
                                                    ]);

                                                } else {

                                                    setSelectedDegrees(
                                                        selectedDegrees.filter(
                                                            (x) =>
                                                                x !==
                                                                degree,
                                                        ),
                                                    );
                                                }
                                            }}
                                        />

                                        {degree}

                                    </label>

                                ))}

                        </div>

                    </div>

                    <div>

                        <label className="mb-2 block font-medium">
                            Branches
                        </label>

                        <div className="grid grid-cols-2 gap-2">

                            {selectedInstitutes.flatMap(
                                (inst) => {

                                    const institute =
                                        ELIGIBILITY_MAPPING[
                                        inst as keyof typeof ELIGIBILITY_MAPPING
                                        ];

                                    return selectedDegrees.flatMap(
                                        (degree) =>
                                            institute[
                                            degree as keyof typeof institute
                                            ] || [],
                                    );
                                },
                            )
                                .filter(
                                    (
                                        value,
                                        index,
                                        array,
                                    ) =>
                                        array.indexOf(
                                            value,
                                        ) === index,
                                )
                                .map((branch) => (

                                    <label
                                        key={branch}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedBranches.includes(
                                                branch,
                                            )}
                                            onChange={(e) => {

                                                if (
                                                    e.target.checked
                                                ) {

                                                    setSelectedBranches([
                                                        ...selectedBranches,
                                                        branch,
                                                    ]);

                                                } else {

                                                    setSelectedBranches(
                                                        selectedBranches.filter(
                                                            (x) =>
                                                                x !==
                                                                branch,
                                                        ),
                                                    );
                                                }
                                            }}
                                        />

                                        {branch}

                                    </label>

                                ))}

                        </div>

                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Passing Out Batch
                        </label>

                        <input
                            type="number"
                            value={passingBatch}
                            onChange={(e) =>
                                setPassingBatch(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Minimum CGPA
                        </label>

                        <input
                            type="number"
                            step="0.01"
                            value={minimumCgpa}
                            onChange={(e) =>
                                setMinimumCgpa(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Maximum Active Backlogs
                        </label>

                        <input
                            type="number"
                            value={backlogs}
                            onChange={(e) =>
                                setBacklogs(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Additional Requirements
                        </label>

                        <textarea
                            rows={3}
                            value={
                                additionalRequirements
                            }
                            onChange={(e) =>
                                setAdditionalRequirements(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div className="flex items-center gap-2">

                        <input
                            type="checkbox"
                            checked={relocation}
                            onChange={(e) =>
                                setRelocation(
                                    e.target.checked,
                                )
                            }
                        />

                        <label>
                            Willing To Relocate Required
                        </label>

                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Remarks
                        </label>

                        <textarea
                            rows={4}
                            value={remarks}
                            onChange={(e) =>
                                setRemarks(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <button
                        type="submit"
                        className="rounded border px-4 py-2"
                    >
                        {editingDriveId
                            ? "Save Changes"
                            : "Create Drive"}
                    </button>

                    {editingDriveId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingDriveId(null);

                                setCompanyId("");
                                setDriveName("");
                                setDriveType("");
                                setDriveMode("Online");
                                setDriveDate("");
                                setDeadline("");
                                setLowestPackage("");
                                setHighestPackage("");
                                setBondYears("");
                                setRemarks("");
                                setPassingBatch("");
                                setMinimumCgpa("");
                                setBacklogs("0");

                                setSelectedInstitutes([]);
                                setSelectedDegrees([]);
                                setSelectedBranches([]);

                                setRelocation(false);

                                setAdditionalRequirements("");
                            }}
                            className="ml-2 rounded border px-4 py-2"
                        >
                            Cancel
                        </button>
                    )}

                </form>
            </div>
        </div>
    );
}