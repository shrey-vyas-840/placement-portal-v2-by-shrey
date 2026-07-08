import { useEffect, useState } from "react";
import { adminStudentService } from "@/services/adminStudentService";

import {
  getDraftByEnrollmentNo,
  approveOnboardingDraft,
  rejectOnboardingDraft,
} from "@/services/studentOnboardingDraftService";

import { authService } from "@/services/authService";

export function AdminStudentDetailPage({ studentId }: { studentId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [restrictions, setRestrictions] = useState<any[]>([]);
  const [restrictionType, setRestrictionType] = useState("ATTENDANCE_RESTRICTION");
  const [restrictionReason, setRestrictionReason] = useState("");
  const [restrictionLoading, setRestrictionLoading] = useState(false);

  const [placementLoading, setPlacementLoading] = useState(false);

  const [preferenceLoading, setPreferenceLoading] = useState(false);

  const [placementPreference, setPlacementPreference] = useState(
    data?.profile?.placement_preference ?? "Interested",
  );

  const [preferenceReason, setPreferenceReason] = useState("");
  const [preferenceDialogOpen, setPreferenceDialogOpen] = useState(false);

  const [placementStatus, setPlacementStatus] = useState(
    data?.profile?.placement_status ?? "Unplaced",
  );
  const [placedCompany, setPlacedCompany] = useState("");
  const [placedPackage, setPlacedPackage] = useState("");
  const [placementType, setPlacementType] = useState("");
  const [placedDate, setPlacedDate] = useState("");

  const [placementOverrides, setPlacementOverrides] = useState<any[]>([]);
  const [showOverrideHistory, setShowOverrideHistory] = useState(false);
  const [showRestrictionHistory, setShowRestrictionHistory] = useState(false);
  const [overrideScope, setOverrideScope] = useState<"ALL" | "SPECIFIC">("ALL");
  const [overrideOpportunityId, setOverrideOpportunityId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [availableOpportunities, setAvailableOpportunities] = useState<any[]>([]);
  const [overrideAvailableOpportunities, setOverrideAvailableOpportunities] = useState<any[]>([]);
  const [selectedPlacementOpportunity, setSelectedPlacementOpportunity] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualPackage, setManualPackage] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await adminStudentService.getStudentById(studentId);

        setData(result);
        setPlacementStatus(result.profile?.placement_status ?? "Unplaced");
        setPlacedCompany(result.currentPlacement?.company_name ?? "");
        setPlacedPackage(
          result.currentPlacement?.package_lpa != null
            ? String(result.currentPlacement.package_lpa)
            : "",
        );

        setPlacementType(result.currentPlacement?.placement_type ?? "");
        setPlacedDate(result.currentPlacement?.placed_at ?? "");
        setPlacementPreference(result.profile?.placement_preference ?? "Interested");

        const restrictionData = await adminStudentService.getStudentRestrictions(studentId);
        setRestrictions(restrictionData);

        const overrideData = await adminStudentService.getStudentPlacementOverrides(studentId);
        setPlacementOverrides(overrideData);

        const placementOpportunities =
          await adminStudentService.getStudentPlacementOpportunities(studentId);

        setAvailableOpportunities(placementOpportunities);

        const overrideOpportunities =
          await adminStudentService.getAvailablePlacementOverrideOpportunities(studentId);

        setOverrideAvailableOpportunities(overrideOpportunities);

        if (result?.profile?.enrollment_no) {
          const onboardingDraft = await getDraftByEnrollmentNo(result.profile.enrollment_no);

          setDraft(onboardingDraft);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId]);

  if (loading) {
    return <div className="p-8">Loading Student...</div>;
  }

  if (!data?.profile) {
    return <div className="p-8">Student not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 shadow-lg">
          <div className="flex items-center justify-between px-10 py-8">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">ADMIN WORKSPACE</p>

              <h1 className="mt-2 text-4xl font-bold text-white">Student Profile Management</h1>

              <p className="mt-2 text-blue-100">
                Manage profile, placement, preference and restrictions.
              </p>
            </div>

            <button
              type="button"
              disabled={preferenceLoading}
              className="rounded-full border-2 border-white bg-white/20 px-8 py-3 font-bold text-white backdrop-blur hover:bg-white hover:text-blue-700"
              onClick={() => {
                setPreferenceDialogOpen(true);
              }}
            >
              {placementPreference === "Interested" ? "OPT-OUT" : "OPT-IN"}
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* =========================
      TOP ROW
  ========================== */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div
              id="profile-card"
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="border-b bg-muted/40 px-8 py-5">
                <h2 className="text-xl font-bold">Basic Details</h2>

                <p className="text-m text-muted-foreground">
                  Student profile, documents and placement preference
                </p>
              </div>

              <div className="p-8">
                {/* PROFILE + DOCUMENTS */}

                <div className="mt-2 space-y-3 text-m">
                  <p>
                    <strong>Name:</strong> {data.profile.first_name} {data.profile.last_name}
                  </p>

                  <p>
                    <strong>Enrollment:</strong> {data.profile.enrollment_no}
                  </p>

                  <p>
                    <strong>Institute Email:</strong> {data.profile.institute_email}
                  </p>

                  <p>
                    <strong>Personal Email:</strong> {data.profile.personal_email}
                  </p>

                  <p>
                    <strong>Contact:</strong> {data.profile.contact_number}
                  </p>

                  <p>
                    <strong>Gender:</strong> {data.profile.gender}
                  </p>

                  <h3 className="mt-6 border-t pt-5 text-lg font-semibold">Resume</h3>

                  {data.documents?.map((doc: any) => (
                    <div key={doc.student_document_id}>
                      {doc.document_metadata?.storage_url && (
                        <a
                          href={doc.document_metadata.storage_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Open Document
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <p className="text-lg font-bold">
                    Current Preference:{" "}
                    {placementPreference === "Interested" ? "OPT-IN" : "OPT-OUT"}
                  </p>
                </div>
              </div>
            </div>

            <div
              id="academic-card"
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="border-b bg-muted/40 px-8 py-5">
                <h2 className="text-xl font-bold">Academic Profile</h2>

                <p className="text-m text-muted-foreground">Academics and technical skills</p>
              </div>

              <div className="p-8">
                {/* ACADEMICS + SKILLS */}

                <div className="mt-2 space-y-3 text-m">
                  <p>
                    <strong>SSC Marks:</strong> {data.academics?.tenth_percentage}
                  </p>

                  <p>
                    <strong>{data.academics?.education_path} Marks:</strong>{" "}
                    {data.academics?.education_path === "HSC"
                      ? data.academics?.twelfth_percentage
                      : data.academics?.education_path === "Diploma"
                        ? data.academics?.diploma_percentage
                        : "N/A"}
                  </p>

                  <p>
                    <strong>Institute:</strong> {data.academics?.current_institute_name}
                  </p>
                  <p>
                    <strong>Branch:</strong> {data.academics?.current_branch_name}
                  </p>
                  <p>
                    <strong>Semester:</strong> {data.academics?.current_semester}
                  </p>
                  <p>
                    <strong>CGPA:</strong> {data.academics?.current_cgpa}
                  </p>
                  <p>
                    <strong>Graduation:</strong> {data.academics?.graduation_year}
                  </p>
                </div>

                <div className="my-8 border-t" />

                <h2 className="text-lg font-semibold">Skills</h2>

                <div className="mt-2 space-y-3">
                  <p>
                    <strong>Programming:</strong> {data.skills?.programming_languages}
                  </p>

                  <p>
                    <strong>Technical:</strong> {data.skills?.technical_skills}
                  </p>

                  <p>
                    <strong>Tools:</strong> {data.skills?.tools_and_technologies}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================
      BOTTOM ROW
  ========================== */}

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div
              id="placement-card"
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="border-b bg-muted/40 px-8 py-5">
                <h2 className="text-xl font-semibold">Placement Management</h2>

                <p className="text-sm text-muted-foreground">
                  Placement status and override management
                </p>
              </div>

              <div className="p-6">
                {/* PLACEMENT */}

                <div>
                  <h3 className="text-xl font-semibold">Placement Status</h3>

                  <div className="mt-6 grid gap-6">
                    <div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Registered Opportunity
                        </label>
                        <div className="mt-2 grid gap-6 py-4">
                          <select
                            value={selectedPlacementOpportunity}
                            onChange={(e) => {
                              const value = e.target.value;

                              setSelectedPlacementOpportunity(value);

                              if (value === "") {
                                setSelectedApplication(null);

                                return;
                              }

                              if (value === "OTHER") {
                                setSelectedApplication(null);

                                setManualCompany("");

                                setManualPackage("");

                                return;
                              }

                              const selected = availableOpportunities.find(
                                (item: any) => item.opportunity_id === value,
                              );

                              setSelectedApplication(selected);

                              setManualCompany(selected?.company_name ?? "");

                              setManualPackage(
                                selected?.package_lpa != null ? String(selected.package_lpa) : "",
                              );
                            }}
                            className="w-full rounded-xl border bg-background px-3 py-3"
                          >
                            <option value="">Select Registered Opportunity</option>

                            {availableOpportunities.map((item: any) => (
                              <option key={item.opportunity_id} value={item.opportunity_id}>
                                {item.opportunity_title.length > 45
                                  ? item.opportunity_title.slice(0, 45) + "..."
                                  : item.opportunity_title}
                              </option>
                            ))}

                            <option value="OTHER">Other (Off Campus)</option>
                          </select>

                          {selectedApplication && (
                            <div className="grid gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-6">
                              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                                Company
                              </p>

                              <p className="text-lg font-semibold text-foreground">
                                {" "}
                                {selectedApplication.company_name}
                              </p>

                              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                                Opportunity
                              </p>

                              <p className="text-lg font-semibold text-foreground">
                                {" "}
                                {selectedApplication.opportunity_title}
                              </p>

                              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                                Package
                              </p>

                              <p className="text-lg font-semibold text-foreground">
                                {manualPackage || "-"}
                                LPA
                              </p>
                            </div>
                          )}

                          {selectedPlacementOpportunity === "OTHER" && (
                            <div className="grid gap-5 md:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Company Name
                                </label>

                                <input
                                  type="text"
                                  value={manualCompany}
                                  onChange={(e) => setManualCompany(e.target.value)}
                                  placeholder="Enter company name"
                                  className="w-full rounded-xl border px-3 py-2.5"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Package (LPA)
                                </label>

                                <input
                                  type="number"
                                  step="0.01"
                                  value={manualPackage}
                                  onChange={(e) => setManualPackage(e.target.value)}
                                  placeholder="5.50"
                                  className="w-full rounded-xl border px-3 py-2.5"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-5 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Placement Status</label>

                          <select
                            value={placementStatus}
                            onChange={(e) => setPlacementStatus(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2.5"
                          >
                            <option value="Unplaced">Unplaced</option>
                            <option value="Placed">Placed</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Placement Type</label>

                          <select
                            value={placementType}
                            onChange={(e) => setPlacementType(e.target.value)}
                            className="w-full rounded-xl border px-2.5 py-2.5"
                          >
                            <option value="">Placement Type</option>

                            <option value="On Campus Internship + PPO">
                              On Campus Internship + PPO
                            </option>

                            <option value="On Campus Internship">On Campus Internship</option>

                            <option value="On Campus Placement">On Campus Placement</option>

                            <option value="Off Campus Internship + PPO">
                              Off Campus Internship + PPO
                            </option>

                            <option value="Off Campus Internship">Off Campus Internship</option>

                            <option value="Off Campus Placement">Off Campus Placement</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Placement Date</label>

                          <input
                            type="date"
                            value={placedDate}
                            onChange={(e) => setPlacedDate(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2.5"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={placementLoading}
                      onClick={async () => {
                        try {
                          setPlacementLoading(true);
                          if (placementStatus === "Placed" && placementType.trim() === "") {
                            alert("Placement Type is mandatory.");
                            return;
                          }

                          if (placementStatus === "Placed" && placedDate.trim() === "") {
                            alert("Placement Date is mandatory.");
                            return;
                          }

                          if (
                            placementStatus === "Placed" &&
                            selectedPlacementOpportunity === "OTHER" &&
                            manualCompany.trim() === ""
                          ) {
                            alert("Company Name is mandatory.");
                            return;
                          }

                          if (
                            placementStatus === "Placed" &&
                            selectedPlacementOpportunity === "OTHER" &&
                            manualPackage.trim() === ""
                          ) {
                            alert("Package (LPA) is mandatory.");
                            return;
                          }
                          if (!placementStatus) {
                            alert("Placement Status is mandatory.");
                            setPlacementLoading(false);
                            return;
                          }

                          if (!placementType) {
                            alert("Placement Type is mandatory.");
                            setPlacementLoading(false);
                            return;
                          }

                          if (placementStatus === "Placed" && !selectedPlacementOpportunity) {
                            alert("Please select a registered opportunity or Other (Off Campus).");

                            setPlacementLoading(false);

                            return;
                          }

                          if (selectedPlacementOpportunity === "OTHER" && !manualCompany.trim()) {
                            alert("Company Name is mandatory.");

                            setPlacementLoading(false);

                            return;
                          }

                          if (selectedPlacementOpportunity === "OTHER" && !manualPackage.trim()) {
                            alert("Package is mandatory.");

                            setPlacementLoading(false);

                            return;
                          }

                          if (!placedDate && placementStatus === "Placed") {
                            alert("Placement Date is mandatory.");

                            setPlacementLoading(false);

                            return;
                          }

                          if (placementStatus === "Placed" && !placementType) {
                            alert("Placement Type is mandatory.");

                            setPlacementLoading(false);

                            return;
                          }

                          if (placementStatus === "Unplaced") {
                            setSelectedPlacementOpportunity("");

                            setSelectedApplication(null);

                            setManualCompany("");

                            setManualPackage("");
                          }

                          await adminStudentService.updatePlacementStatus(studentId, {
                            placement_status: placementStatus as "Placed" | "Unplaced",

                            placed_company_name:
                              selectedPlacementOpportunity === "OTHER"
                                ? manualCompany
                                : (selectedApplication?.company_name ?? null),

                            placed_package_lpa:
                              selectedPlacementOpportunity === "OTHER"
                                ? Number(manualPackage)
                                : Number(selectedApplication?.package_lpa ?? 0),

                            placement_type: placementType as any,

                            placed_at: placedDate || null,

                            opportunity_id:
                              selectedPlacementOpportunity === "OTHER"
                                ? null
                                : (selectedApplication?.opportunity_id ?? null),

                            drive_id:
                              selectedPlacementOpportunity === "OTHER"
                                ? null
                                : (selectedApplication?.drive_id ?? null),

                            company_id:
                              selectedPlacementOpportunity === "OTHER"
                                ? null
                                : (selectedApplication?.company_id ?? null),
                          });

                          const refreshed = await adminStudentService.getStudentById(studentId);

                          setData(refreshed);

                          alert("Placement status updated successfully.");
                        } finally {
                          setPlacementLoading(false);
                        }
                      }}
                      className="mt-6 w-full rounded-xl bg-primary py-3 font-bold text-white transition hover:opacity-90"
                    >
                      Save Placement Status
                    </button>
                  </div>

                  <div className="mt-10 border-t pt-2">
                    <h3 className="text-xl font-semibold">Placement Override</h3>

                    <p className="mb-6 text-sm text-muted-foreground">
                      Allow placed students to participate in additional opportunities.
                    </p>
                    <div className="mt-5 space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={overrideScope === "ALL"}
                            onChange={() => {
                              setOverrideScope("ALL");
                              setOverrideOpportunityId("");
                            }}
                          />
                          Allow All Opportunities
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={overrideScope === "SPECIFIC"}
                            onChange={() => {
                              setOverrideScope("SPECIFIC");
                            }}
                          />
                          Allow Specific Opportunity
                        </label>
                      </div>
                      {overrideScope === "SPECIFIC" && (
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Registered Opportunity
                          </label>
                          <select
                            value={overrideOpportunityId}
                            onChange={(e) => setOverrideOpportunityId(e.target.value)}
                            className="w-full rounded-xl border bg-background px-3 py-3"
                          >
                            <option value="">Select Opportunity</option>

                            {overrideAvailableOpportunities.map((op) => (
                              <option key={op.opportunity_id} value={op.opportunity_id}>
                                {op.opportunity_title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <textarea
                        rows={3}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Reason"
                        className="w-full rounded border p-3"
                      />

                      <button
                        type="button"
                        disabled={overrideLoading}
                        className="w-full rounded-xl bg-primary py-3 font-bold text-white transition hover:opacity-90"
                        onClick={async () => {
                          try {
                            setOverrideLoading(true);

                            const session = await authService.getSession();

                            if (!session?.user?.id) {
                              throw new Error("Admin not found");
                            }

                            if (!overrideReason.trim()) {
                              alert("Override reason is mandatory.");

                              setOverrideLoading(false);

                              return;
                            }

                            if (overrideScope === "SPECIFIC" && !overrideOpportunityId) {
                              alert("Please select an opportunity.");

                              setOverrideLoading(false);

                              return;
                            }

                            await adminStudentService.createPlacementOverride({
                              student_id: studentId,

                              override_scope: overrideScope,

                              opportunity_id:
                                overrideScope === "SPECIFIC" ? overrideOpportunityId : null,

                              override_reason: overrideReason,

                              granted_by: session.user.id,
                            });

                            const refreshed =
                              await adminStudentService.getStudentPlacementOverrides(studentId);

                            setPlacementOverrides(refreshed);

                            setOverrideReason("");

                            setOverrideOpportunityId("");

                            alert("Override applied successfully.");
                          } finally {
                            setOverrideLoading(false);
                          }
                        }}
                      >
                        Apply Override
                      </button>
                    </div>

                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => setShowOverrideHistory(!showOverrideHistory)}
                        className="flex w-full items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-left font-semibold"
                      >
                        <span>Override History</span>

                        <span>{showOverrideHistory ? "▲" : "▼"}</span>
                      </button>

                      {showOverrideHistory && (
                        <div className="mt-4 space-y-3 max-h-86 overflow-y-auto">
                          {placementOverrides.map((item) => (
                            <div key={item.override_id} className="rounded border p-3">
                              <p>
                                <b>Company:</b>

                                {item.company_name ??
                                  (item.override_scope === "ALL" ? "All Eligible Companies" : "-")}
                              </p>

                              <p>
                                <b>Opportunity:</b>

                                {item.override_scope === "ALL"
                                  ? "All Eligible Opportunities"
                                  : item.opportunity_title}
                              </p>

                              <p>
                                <b>Reason:</b> {item.override_reason}
                              </p>
                              {item.is_active && (
                                <button
                                  type="button"
                                  className="mt-3 rounded-lg border border-red-500 px-3 py-2 text-red-600 hover:bg-red-50"
                                  onClick={async () => {
                                    await adminStudentService.removePlacementOverride(
                                      item.override_id,
                                    );

                                    const refreshed =
                                      await adminStudentService.getStudentPlacementOverrides(
                                        studentId,
                                      );

                                    setPlacementOverrides(refreshed);
                                  }}
                                >
                                  Stop Allowing
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              id="restriction-card"
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="border-b bg-muted/40 px-8 py-5">
                <h2 className="text-xl font-semibold">Restriction Management</h2>

                <p className="text-sm text-muted-foreground">
                  Manage student restrictions and history
                </p>
              </div>

              <h3 className="mt-2 text-lg px-8 py-4 font-bold">Create Restriction</h3>

              <p className="mb-6 px-8 text-m font-semibold text-muted-foreground">
                Apply a temporary restriction to this student.
              </p>

              <div className="p-6">
                <div className="rounded-2xl border bg-background p-6">
                  <div className="space-y-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Restriction Type</label>

                      <select
                        value={restrictionType}
                        onChange={(e) => setRestrictionType(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2.5"
                      >
                        <option value="ATTENDANCE_RESTRICTION">Attendance Restriction</option>

                        <option value="GRIEVANCE_RESTRICTION">Grievance Restriction</option>

                        <option value="MISBEHAVIOR_RESTRICTION">Misbehavior Restriction</option>

                        <option value="CUSTOM">Custom Restriction</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Reason</label>

                      <textarea
                        rows={4}
                        value={restrictionReason}
                        onChange={(e) => setRestrictionReason(e.target.value)}
                        placeholder="Restriction reason"
                        className="w-full rounded-xl border px-3 py-3"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={
                        restrictionLoading ||
                        (restrictionType === "CUSTOM" && !restrictionReason.trim())
                      }
                      onClick={async () => {
                        try {
                          setRestrictionLoading(true);

                          const session = await authService.getSession();

                          if (!session?.user?.id) {
                            throw new Error("Unable to determine admin.");
                          }

                          const finalReason =
                            restrictionType === "CUSTOM"
                              ? restrictionReason
                              : restrictionReason ||
                                {
                                  ATTENDANCE_RESTRICTION: "Attendance shortage",
                                  GRIEVANCE_RESTRICTION: "Student grievance case under review",
                                  MISBEHAVIOR_RESTRICTION: "Student conduct review in progress",
                                }[restrictionType];

                          await adminStudentService.createRestriction({
                            student_id: studentId,
                            restriction_type: restrictionType,
                            restriction_reason: finalReason ?? "",
                            restricted_by: session.user.id,
                          });

                          const refreshed =
                            await adminStudentService.getStudentRestrictions(studentId);

                          setRestrictions(refreshed);

                          setRestrictionReason("");
                        } catch (err) {
                          console.error(err);
                          alert("Unable to create restriction.");
                        } finally {
                          setRestrictionLoading(false);
                        }
                      }}
                      className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700"
                    >
                      Apply Restriction
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 px-8">
                <h3 className="mb-4 text-lg font-semibold">Current Restriction</h3>

                {restrictions.find((r) => r.is_active) ? (
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p>
                      <b>Type:</b> {restrictions.find((r) => r.is_active)?.restriction_type}
                    </p>

                    <p className="mt-2">
                      <b>Reason:</b> {restrictions.find((r) => r.is_active)?.restriction_reason}
                    </p>

                    <button
                      type="button"
                      className="mt-4 rounded-lg border border-red-500 px-4 py-2 text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        const active = restrictions.find((r) => r.is_active);

                        if (!active) return;

                        await adminStudentService.removeRestriction(active.restriction_id);

                        const refreshed =
                          await adminStudentService.getStudentRestrictions(studentId);

                        setRestrictions(refreshed);
                      }}
                    >
                      Remove Restriction
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                    No active restriction.
                  </div>
                )}
              </div>

              <div className="mt-8 px-8 pb-8">
                <button
                  type="button"
                  onClick={() => setShowRestrictionHistory(!showRestrictionHistory)}
                  className="flex w-full items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 font-semibold"
                >
                  <span>Restriction History</span>

                  <span>{showRestrictionHistory ? "▲" : "▼"}</span>
                </button>

                {showRestrictionHistory && (
                  <div className="mt-4 max-h-92 space-y-3 overflow-y-auto">
                    {restrictions.map((restriction) => (
                      <div key={restriction.restriction_id} className="rounded-lg border p-3">
                        <p>
                          <b>Type:</b> {restriction.restriction_type}
                        </p>

                        <p>
                          <b>Reason:</b> {restriction.restriction_reason}
                        </p>

                        <p>
                          <b>Status:</b> {restriction.is_active ? "Active" : "Removed"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {preferenceDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="w-[500px] rounded-xl bg-white p-6">
                <h2 className="text-xl font-semibold">Change Placement Preference</h2>

                <p className="mt-2 text-sm text-muted-foreground">Please provide a reason.</p>

                <textarea
                  rows={5}
                  value={preferenceReason}
                  onChange={(e) => setPreferenceReason(e.target.value)}
                  className="mt-5 w-full rounded border p-3"
                  placeholder="Reason..."
                />

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPreferenceDialogOpen(false);
                      setPreferenceReason("");
                    }}
                    className="rounded border px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="rounded bg-primary px-5 py-2 text-white"
                    onClick={async () => {
                      if (!preferenceReason.trim()) {
                        alert("Reason is mandatory.");
                        return;
                      }

                      const nextPreference =
                        placementPreference === "Interested" ? "Not Interested" : "Interested";

                      await adminStudentService.updatePlacementPreference(
                        studentId,
                        nextPreference,
                        preferenceReason.trim(),
                      );

                      const refreshed = await adminStudentService.getStudentById(studentId);

                      setData(refreshed);

                      setPlacementPreference(refreshed.profile.placement_preference);

                      setPreferenceReason("");

                      setPreferenceDialogOpen(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {draft && (
            <div className="rounded-lg border p-5">
              <h2 className="font-semibold">Onboarding Review</h2>

              <div className="mt-4 space-y-2">
                <p>
                  <strong>Approval Status:</strong> {draft.approval_status ?? "PENDING_APPROVAL"}
                </p>

                <p>
                  <strong>Registry Found:</strong> {draft.registry_found ? "Yes" : "No"}
                </p>

                <p>
                  <strong>Policy Accepted:</strong> {draft.policy_accepted ? "Yes" : "No"}
                </p>

                <p>
                  <strong>Mail Received:</strong> {draft.mail_confirmation_received ? "Yes" : "No"}
                </p>

                <p>
                  <strong>Mail Type:</strong> {draft.mail_type ?? "-"}
                </p>
              </div>

              <div className="mt-4 rounded border p-3">
                <pre className="overflow-auto text-xs">
                  {JSON.stringify(draft.questionnaire_answers, null, 2)}
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      `https://mail.google.com/mail/u/0/#search/${data.profile.enrollment_no}`,
                      "_blank",
                    );
                  }}
                  className="rounded border px-4 py-2"
                >
                  Check Mail
                </button>

                <button
                  type="button"
                  disabled={reviewLoading}
                  onClick={async () => {
                    try {
                      setReviewLoading(true);

                      const session = await authService.getSession();

                      if (!session?.user?.id) {
                        throw new Error("Unable to determine current admin user.");
                      }

                      await approveOnboardingDraft(draft.auth_provider_id, session.user.id);

                      const refreshed = await getDraftByEnrollmentNo(data.profile.enrollment_no);

                      setDraft(refreshed);

                      alert("Student approved successfully.");
                    } catch (error) {
                      console.error(error);

                      alert("Unable to approve student.");
                    } finally {
                      setReviewLoading(false);
                    }
                  }}
                  className="rounded bg-green-600 px-4 py-2 text-white"
                >
                  Approve
                </button>

                <button
                  type="button"
                  disabled={reviewLoading || !rejectionReason.trim()}
                  onClick={async () => {
                    try {
                      setReviewLoading(true);

                      const session = await authService.getSession();

                      if (!session?.user?.id) {
                        throw new Error("Unable to determine current admin user.");
                      }

                      await rejectOnboardingDraft(
                        draft.auth_provider_id,
                        session.user.id,
                        rejectionReason,
                      );

                      const refreshed = await getDraftByEnrollmentNo(data.profile.enrollment_no);

                      setDraft(refreshed);

                      alert("Student rejected successfully.");
                    } catch (error) {
                      console.error(error);

                      alert("Unable to reject student.");
                    } finally {
                      setReviewLoading(false);
                    }
                  }}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  Reject
                </button>
              </div>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Rejection reason (required before rejecting)"
                className="mt-4 w-full rounded border p-3"
                rows={4}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
