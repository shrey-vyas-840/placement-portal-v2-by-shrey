import { useEffect, useState } from "react";
import { adminDriveService } from "@/services/adminDriveService";

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
                                    Action
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {drives
                                .filter(
                                    (drive) =>
                                        drive.is_active === true,
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
                                            {
                                                drive.drive_status
                                            }
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

                                                    window.scrollTo({
                                                        top: document.body.scrollHeight,
                                                        behavior:
                                                            "smooth",
                                                    });
                                                }}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="ml-2 rounded border px-3 py-1"
                                                onClick={async () => {
                                                    const confirmed =
                                                        window.confirm(
                                                            "Archive this drive?",
                                                        );

                                                    if (!confirmed) return;

                                                    await adminDriveService.deactivateDrive(
                                                        drive.drive_id,
                                                    );

                                                    await load();
                                                }}
                                            >
                                                Archive
                                            </button>
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