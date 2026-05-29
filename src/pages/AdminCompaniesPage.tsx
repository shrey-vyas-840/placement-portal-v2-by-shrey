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

    const [editingCompanyId, setEditingCompanyId] =
        useState<string | null>(null);

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
            if (editingCompanyId) {
                await adminDriveService.updateCompany(
                    editingCompanyId,
                    {
                        company_name:
                            companyName,
                        company_website:
                            website,
                        hiring_location:
                            location,
                        industry_type:
                            industry,
                        company_description:
                            description,
                        company_size:
                            companySize,
                    },
                );
            } else {
                await adminDriveService.createCompany({
                    company_name:
                        companyName,
                    company_website:
                        website,
                    hiring_location:
                        location,
                    industry_type:
                        industry,
                    company_description:
                        description,
                    company_size:
                        companySize,
                });
            }

            setCompanyName("");
            setWebsite("");
            setLocation("");
            setIndustry("");
            setDescription("");
            setCompanySize("");
            setEditingCompanyId(null);

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

                {editingCompanyId && (
                    <div className="mt-3 rounded border border-yellow-500 bg-yellow-50 p-3">
                        Editing Company
                    </div>
                )}

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
                        {editingCompanyId
                            ? "Save Changes"
                            : "Create Company"}
                    </button>

                    {editingCompanyId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingCompanyId(null);

                                setCompanyName("");
                                setWebsite("");
                                setLocation("");
                                setIndustry("");
                                setDescription("");
                                setCompanySize("");
                            }}
                            className="ml-2 rounded border px-4 py-2"
                        >
                            Cancel
                        </button>
                    )}

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
                                                onClick={() => {
                                                    setEditingCompanyId(
                                                        company.company_id,
                                                    );

                                                    setCompanyName(
                                                        company.company_name || "",
                                                    );

                                                    setWebsite(
                                                        company.company_website ||
                                                        "",
                                                    );

                                                    setLocation(
                                                        company.hiring_location ||
                                                        "",
                                                    );

                                                    setIndustry(
                                                        company.industry_type ||
                                                        "",
                                                    );

                                                    setDescription(
                                                        company.company_description ||
                                                        "",
                                                    );

                                                    setCompanySize(
                                                        company.company_size ||
                                                        "",
                                                    );
                                                }}
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