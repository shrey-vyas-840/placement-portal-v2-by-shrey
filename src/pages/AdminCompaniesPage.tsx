import { useEffect, useState } from "react";
import { adminDriveService } from "@/services/adminDriveService";

export function AdminCompaniesPage() {
    const [companies, setCompanies] =
        useState<any[]>([]);

    const [companyName, setCompanyName] =
        useState("");

    const [website, setWebsite] =
        useState("");

    const [location, setLocation] =
        useState("");

    const [industry, setIndustry] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [companySize, setCompanySize] =
        useState("");

    async function loadCompanies() {
        const data =
            await adminDriveService.getCompanies();

        setCompanies(data);
    }

    useEffect(() => {
        loadCompanies();
    }, []);

    async function handleSubmit(
        e: React.FormEvent,
    ) {
        e.preventDefault();

        try {
            await adminDriveService.createCompany({
                company_name: companyName,
                company_website: website,
                hiring_location: location,
                industry_type: industry,
                company_description:
                    description,
                company_size:
                    companySize,
            });

            setCompanyName("");
            setWebsite("");
            setLocation("");
            setIndustry("");
            setDescription("");
            setCompanySize("");

            await loadCompanies();

        } catch (err) {
            console.error(err);
            alert("Failed to create company");
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Companies
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 rounded-lg border p-5 space-y-4"
                >

                    <div>
                        <label className="mb-1 block font-medium">
                            Company Name
                        </label>

                        <input
                            value={companyName}
                            onChange={(e) =>
                                setCompanyName(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Company Website
                        </label>

                        <input
                            value={website}
                            onChange={(e) =>
                                setWebsite(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Hiring Location
                        </label>

                        <input
                            value={location}
                            onChange={(e) =>
                                setLocation(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Industry Type
                        </label>

                        <input
                            value={industry}
                            onChange={(e) =>
                                setIndustry(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Company Description
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value,
                                )
                            }
                            rows={4}
                            className="w-full rounded border px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium">
                            Company Size
                        </label>

                        <select
                            value={companySize}
                            onChange={(e) =>
                                setCompanySize(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        >
                            <option value="">
                                Select Size
                            </option>

                            <option value="Startup">
                                Startup
                            </option>

                            <option value="Small">
                                Small
                            </option>

                            <option value="Medium">
                                Medium
                            </option>

                            <option value="Large">
                                Large
                            </option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="rounded border px-4 py-2"
                    >
                        Create Company
                    </button>

                </form>

                <div className="mt-8 overflow-hidden rounded-lg border">

                    <table className="w-full">

                        <thead>
                            <tr className="border-b bg-muted">
                                <th className="p-3 text-left">
                                    Company
                                </th>

                                <th className="p-3 text-left">
                                    Location
                                </th>

                                <th className="p-3 text-left">
                                    Industry
                                </th>

                                <th className="p-3 text-left">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {companies.map(
                                (company) => (
                                    <tr
                                        key={
                                            company.company_id
                                        }
                                        className="border-b"
                                    >
                                        <td className="p-3">
                                            {
                                                company.company_name
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                company.hiring_location
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                company.industry_type
                                            }
                                        </td>
                                        <td className="p-3">
                                            <button
                                                className="rounded border px-3 py-1"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>

                    </table>

                </div>

            </div>
        </div>
    );
}