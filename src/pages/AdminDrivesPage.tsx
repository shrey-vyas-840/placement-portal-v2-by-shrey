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
            await adminDriveService.createDrive({
                company_id: companyId,
                drive_name: driveName,
                drive_type: driveType,
                drive_mode: driveMode,
                drive_date: driveDate,
                registration_deadline:
                    deadline,
                lowest_package_lpa:
                    Number(lowestPackage),
                highest_package_lpa:
                    Number(highestPackage),
                bond_years:
                    Number(bondYears),
                remarks,
            });

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

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 rounded-lg border p-5 space-y-4"
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
                            Bond Years
                        </label>

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
                        Create Drive
                    </button>

                </form>
            </div>
        </div>
    );
}