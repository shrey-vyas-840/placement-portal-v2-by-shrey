import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { adminDriveService } from "@/services/adminDriveService";
import { resolveCompanyWorkspace } from "@/services/recruitmentDraftService";
import { Building2, Pencil, Search, Users, Globe, Mail, Phone, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyManagementEditor } from "@/components/company/CompanyManagementEditor";
import CompanyExportDialog from "@/components/company/CompanyExportDialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
export function AdminCompaniesPage() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<any[]>([]);

  const [companyName, setCompanyName] = useState("");

  const [website, setWebsite] = useState("");

  const [location, setLocation] = useState("");

  const [industry, setIndustry] = useState("");

  const [description, setDescription] = useState("");

  const [companySize, setCompanySize] = useState("");

  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [primaryContacts, setPrimaryContacts] = useState<Record<string, any>>({});

  const [companyContacts, setCompanyContacts] = useState<Record<string, any[]>>({});

  const [recruiters, setRecruiters] = useState<any[]>([]);

  const filteredCompanies = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return companies;

    return companies.filter((company) => {
      const primary = primaryContacts[company.company_id];

      const recruiters = companyContacts[company.company_id] ?? [];

      return [
        company.company_name,

        company.company_website,

        company.industry_type,

        company.hiring_location,

        company.company_description,

        primary?.contact_name,

        primary?.contact_email,

        primary?.contact_number,

        ...recruiters.flatMap((r: any) => [
          r.contact_name,
          r.contact_email,
          r.contact_number,
          r.contact_position,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [companies, search, primaryContacts, companyContacts]);

  async function loadCompanies() {
    const data = await adminDriveService.getCompanies();

    const contacts: Record<string, any> = {};
    const allContacts: Record<string, any[]> = {};

    await Promise.all(
      data.map(async (company: any) => {
        try {
          const contact = await adminDriveService.getPrimaryCompanyContact(company.company_id);

          const recruiters = await adminDriveService.getCompanyContacts(company.company_id);

          allContacts[company.company_id] = recruiters;

          if (contact) {
            contacts[company.company_id] = contact;
          }
        } catch {
          // keep page loading even if one company has no primary contact
        }
      }),
    );

    setPrimaryContacts(contacts);
    setCompanyContacts(allContacts);
    setCompanies(data);
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingCompanyId) {
        await adminDriveService.updateCompany(editingCompanyId, {
          company_name: companyName,
          company_website: website,
          hiring_location: location,
          industry_type: industry,
          company_description: description,
          company_size: companySize,
        });

        for (const recruiter of recruiters) {
          /*
           * Existing recruiter marked for deletion
           */
          if (recruiter.contact_id && recruiter.markedForDelete) {
            await adminDriveService.deleteCompanyContact(recruiter.contact_id);

            continue;
          }

          /*
           * Existing recruiter
           */
          if (recruiter.contact_id) {
            await adminDriveService.updateCompanyContact(recruiter.contact_id, {
              contact_name: recruiter.contact_name,
              contact_email: recruiter.contact_email,
              contact_number: recruiter.contact_number,
              contact_position: recruiter.contact_position,
              primary_contact: recruiter.primary_contact,
            });

            continue;
          }

          /*
           * Ignore completely empty new cards
           */
          if (
            !recruiter.contact_name.trim() &&
            !recruiter.contact_email.trim() &&
            !recruiter.contact_number.trim()
          ) {
            continue;
          }

          /*
           * New recruiter
           */
          await adminDriveService.createCompanyContact({
            company_id: editingCompanyId,

            contact_name: recruiter.contact_name,

            contact_email: recruiter.contact_email,

            contact_number: recruiter.contact_number,

            contact_position: recruiter.contact_position,

            primary_contact: recruiter.primary_contact,
          });
        }
      } else {
        await adminDriveService.createCompany({
          company_name: companyName,
          company_website: website,
          hiring_location: location,
          industry_type: industry,
          company_description: description,
          company_size: companySize,
        });
      }

      setCompanyName("");
      setWebsite("");
      setLocation("");
      setIndustry("");
      setDescription("");
      setCompanySize("");
      setEditingCompanyId(null);
      setEditDialogOpen(false);
      await loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Failed to create company");
    }
  }

  return (
    <AdminLayout
      title="Companies"
      description="Manage registered companies and recruiter contacts."
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              navigate({
                to: "/admin/recruitment",
              });
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
          >
            <Building2 className="h-4 w-4" />
            Register Company
          </button>

          <button
            type="button"
            onClick={() => setExportDialogOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2 transition hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-80 rounded-xl border bg-background py-2 pl-10 pr-4 outline-none transition focus:border-primary"
            />
          </div>
        </div>
        {editingCompanyId && (
          <div className="mb-6 rounded-xl border border-yellow-500 bg-yellow-50 px-4 py-3">
            <div className="font-medium">Editing Company Information</div>

            <div className="text-sm text-muted-foreground">
              Only Company & Recruiter Information is editable.
            </div>
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
            </DialogHeader>
            <CompanyManagementEditor
              companyName={companyName}
              setCompanyName={setCompanyName}
              website={website}
              setWebsite={setWebsite}
              industry={industry}
              setIndustry={setIndustry}
              location={location}
              setLocation={setLocation}
              companySize={companySize}
              setCompanySize={setCompanySize}
              description={description}
              setDescription={setDescription}

              recruiters={recruiters}
              setRecruiters={setRecruiters}

              onSave={() => {
                handleSubmit({
                  preventDefault() {},
                } as React.FormEvent);
              }}
            />
          </DialogContent>
        </Dialog>

        <CompanyExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          totalCompanies={filteredCompanies.length}
        />

        <div className="mt-8 overflow-hidden rounded-3xl border bg-card">
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Registered Companies</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Compact overview of all registered companies and their primary HR contact.
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                {filteredCompanies.length} Companies
              </div>
            </div>
          </div>

          <div className="max-h-[85vh] overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20 bg-background">
                <tr className="border-b bg-muted/40">
                  <th className="px-5 py-3 text-left font-semibold">Company</th>

                  <th className="px-5 py-3 text-left font-semibold">Primary HR</th>

                  <th className="px-5 py-3 text-left font-semibold">Email</th>

                  <th className="px-5 py-3 text-left font-semibold">Contact</th>

                  <th className="px-5 py-3 text-left font-semibold">Location</th>

                  <th className="px-5 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCompanies.map((company) => {
                  const recruiters = companyContacts[company.company_id] ?? [];

                  const contact = primaryContacts[company.company_id] ?? recruiters[0] ?? null;

                  return (
                    <tr
                      key={company.company_id}
                      onClick={async () => {
                        try {
                          const workspace = await resolveCompanyWorkspace(company.company_id);

                          if (!workspace) {
                            alert("No published recruitment exists for this company yet.");

                            return;
                          }

                          navigate({
                            to: "/admin/recruitment/$draftId",
                            params: {
                              draftId: workspace.draftId,
                            },
                          });
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      className="cursor-pointer border-b transition-all hover:bg-primary/5"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium">{company.company_name}</div>

                        {company.company_website && (
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />

                            {company.company_website}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {contact ? (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />

                            <div>
                              <div className="font-medium">{contact.contact_name}</div>

                              <div className="text-xs text-muted-foreground">
                                {contact.contact_position || "—"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {contact ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />

                            <span className="text-sm">{contact.contact_email}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {contact ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />

                            <span>{contact.contact_number || "—"}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-5 py-4">{company.hiring_location}</td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditDialogOpen(true);
                              setEditingCompanyId(company.company_id);
                              setCompanyName(company.company_name || "");
                              setWebsite(company.company_website || "");
                              setLocation(company.hiring_location || "");
                              setIndustry(company.industry_type || "");
                              setDescription(company.company_description || "");
                              setCompanySize(company.company_size || "");
                              setRecruiters(
                                (companyContacts[company.company_id] ?? []).map((contact) => ({
                                  ...contact,
                                  isNew: false,
                                  markedForDelete: false,
                                })),
                              );
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 transition hover:bg-muted"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No companies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
