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
  const [placementType, setPlacementType] = useState("Campus Placement");
  const [placedDate, setPlacedDate] = useState("");

  const [placementOverrides, setPlacementOverrides] = useState<any[]>([]);
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

        setPlacementType(result.currentPlacement?.placement_type ?? "Campus Placement");
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Student Profile Management</h1>

          {/* Placement Preference button will be added here */}
          <button
            type="button"
            disabled={preferenceLoading}
            className="rounded-md bg-primary px-5 py-2 text-white"
            onClick={() => {
              setPreferenceDialogOpen(true);
            }}
          >
            {placementPreference === "Interested" ? "OPT-OUT" : "OPT-IN"}
          </button>
        </div>

        <div className="mt-8 space-y-8">
          {/* =========================
      TOP ROW
  ========================== */}

          <div className="grid gap-6 lg:grid-cols-2">
            <div id="profile-card" className="flex flex-col gap-6 rounded-xl border bg-card p-6">
              {/* PROFILE + DOCUMENTS */}

              <div className="rounded-lg border p-5">
                <h2 className="text-lg font-semibold">Basic Details</h2>

                <div className="mt-4 space-y-1">
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

                  <h2 className="text-lg font-semibold">Resume</h2>

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

                <div className="mt-4 rounded-lg border p-5">
                  <p className="text-lg font-bold">
                    Current Preference:{" "}
                    {placementPreference === "Interested" ? "OPT-IN" : "OPT-OUT"}
                  </p>
                </div>
              </div>
            </div>

            <div id="academic-card" className="flex flex-col gap-6 rounded-xl border bg-card p-6">
              {/* ACADEMICS + SKILLS */}

              <div className="rounded-lg border p-5">
                <h2 className="text-lg font-semibold">Academics</h2>

                <div className="mt-4 space-y-1">
                  <p>
                    <strong>CGPA:</strong> {data.academics?.current_cgpa}
                  </p>

                  <p>
                    <strong>Semester:</strong> {data.academics?.current_semester}
                  </p>

                  <p>
                    <strong>Branch:</strong> {data.academics?.current_branch_name}
                  </p>

                  <p>
                    <strong>Graduation:</strong> {data.academics?.graduation_year}
                  </p>
                </div>

                <div className="my-6 border-t" />

                <h2 className="text-lg font-semibold">Skills</h2>

                <div className="mt-4 space-y-2">
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

          <div className="grid gap-6 lg:grid-cols-2">
            <div id="placement-card" className="rounded-xl border bg-card p-6">
              {/* PLACEMENT */}

              <div>
                <h2 className="text-lg font-semibold">Placement Management</h2>

                <div className="mt-6 rounded-lg border p-4">
                  <h3 className="font-semibold">Placement Status</h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <select
                      value={placementStatus}
                      onChange={(e) => setPlacementStatus(e.target.value)}
                      className="rounded border p-2"
                    >
                      <option value="Unplaced">Unplaced</option>

                      <option value="Placed">Placed</option>
                    </select>

<div className="max-h-64 overflow-y-auto">

<select
size={8}
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
    selected?.package_lpa != null
      ? String(selected.package_lpa)
      : "",
  );

}}
className="w-full min-h-[220px] rounded border p-2 md:col-span-2"
>
                      <option value="">Select Registered Opportunity</option>

                      {availableOpportunities.map((item: any) => (
                        <option key={item.opportunity_id} value={item.opportunity_id}>
                          {item.opportunity_title}
                        </option>
                      ))}

                      <option value="OTHER">Other (Off Campus)</option>
                    </select>
                    </div>

                    {selectedApplication && (
                      <div className="rounded-lg border bg-muted/20 p-4 md:col-span-2">
                        <p>
                          <strong>Company:</strong> {selectedApplication.company_name}
                        </p>

                        <p>
                          <strong>Opportunity:</strong> {selectedApplication.opportunity_title}
                        </p>

                        <p>
                          <strong>Package:</strong> {manualPackage || "-"}
                          LPA
                        </p>
                      </div>
                    )}

                    {selectedPlacementOpportunity === "OTHER" && (
                      <>
                        <input
                          type="text"
                          placeholder="Company Name"
                          value={manualCompany}
                          onChange={(e) => setManualCompany(e.target.value)}
                          className="rounded border p-2"
                        />

                        <input
                          type="number"
                          step="0.01"
                          placeholder="Package (LPA)"
                          value={manualPackage}
                          onChange={(e) => setManualPackage(e.target.value)}
                          className="rounded border p-2"
                        />
                      </>
                    )}

                    <select
                      value={placementType}
                      onChange={(e) => setPlacementType(e.target.value)}
                      className="rounded border p-2"
                    >
                      <option value="">Select Placement Type</option>

                      <option value="On Campus Internship + PPO">On Campus Internship + PPO</option>

                      <option value="On Campus Internship">On Campus Internship</option>

                      <option value="On Campus Placement">On Campus Placement</option>

                      <option value="Off Campus Internship + PPO">
                        Off Campus Internship + PPO
                      </option>

                      <option value="Off Campus Internship">Off Campus Internship</option>

                      <option value="Off Campus Placement">Off Campus Placement</option>
                    </select>

                    <input
                      type="date"
                      value={placedDate}
                      onChange={(e) => setPlacedDate(e.target.value)}
                      className="rounded border p-2"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={placementLoading}
                    onClick={async () => {
                      try {
                        setPlacementLoading(true);

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

                        await adminStudentService.updatePlacementStatus(studentId, {
                          placement_status: placementStatus as "Placed" | "Unplaced",

                          placed_company_name:
                            selectedPlacementOpportunity === "OTHER"
                              ? manualCompany
                              : (selectedApplication?.company_name ?? null),

                          placed_package_lpa:
                            selectedPlacementOpportunity === "OTHER" ? Number(manualPackage) : null,

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
                    className="mt-4 rounded bg-primary px-4 py-2 text-white"
                  >
                    Save Placement Status
                  </button>

                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-semibold">Placement Override</h3>

                    <div className="mt-5 space-y-4">
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

                      {overrideScope === "SPECIFIC" && (
                        <div className="max-h-64 overflow-y-auto">
                          <select
                            size={8}
                            value={overrideOpportunityId}
                            onChange={(e) => setOverrideOpportunityId(e.target.value)}
                            className="w-full min-h-[220px] rounded border p-2"
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
                        className="rounded bg-primary px-4 py-2 text-white"
                        onClick={async () => {
                          try {
                            setOverrideLoading(true);

                            const session = await authService.getSession();

                            if (!session?.user?.id) {
                              throw new Error("Admin not found");
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
                      <h3 className="font-semibold">Current Override</h3>

                      <div className="mt-3">
                        {placementOverrides.find((x) => x.is_active) ? (
                          <div className="rounded border p-4">
                            <p>
                              <b>Scope:</b>{" "}
                              {placementOverrides.find((x) => x.is_active).override_scope}
                            </p>

                            <p>
                              <b>Reason:</b>{" "}
                              {placementOverrides.find((x) => x.is_active).override_reason}
                            </p>

                            <button
                              type="button"
                              className="mt-4 rounded border px-3 py-2"
                              onClick={async () => {
                                await adminStudentService.removePlacementOverride(
                                  placementOverrides.find((x) => x.is_active).override_id,
                                );

                                const refreshed =
                                  await adminStudentService.getStudentPlacementOverrides(studentId);

                                setPlacementOverrides(refreshed);
                              }}
                            >
                              Remove Override
                            </button>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No active override.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-semibold">Override History</h3>

                      <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                        {placementOverrides.map((item) => (
                          <div key={item.override_id} className="rounded border p-3">
                            <p>
                              <b>Scope:</b> {item.override_scope}
                            </p>

                            {item.opportunity_id && (
                              <p>
                                <b>Opportunity:</b> {item.opportunity_id}
                              </p>
                            )}

                            <p>
                              <b>Reason:</b> {item.override_reason}
                            </p>

                            <p>
                              <b>Status:</b> {item.is_active ? "Active" : "Removed"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="restriction-card" className="rounded-xl border bg-card p-6">
              <h2 className="mb-6 text-lg font-semibold">Restriction Management</h2>
              <div className="rounded-lg border p-5">
                <div className="mt-4 grid gap-3">
                  <select
                    value={restrictionType}
                    onChange={(e) => setRestrictionType(e.target.value)}
                    className="rounded border p-2"
                  >
                    <option value="ATTENDANCE_RESTRICTION">Attendance Restriction</option>

                    <option value="GRIEVANCE_RESTRICTION">Grievance Restriction</option>

                    <option value="MISBEHAVIOR_RESTRICTION">Misbehavior Restriction</option>

                    <option value="CUSTOM">Custom Restriction</option>
                  </select>

                  <textarea
                    rows={4}
                    value={restrictionReason}
                    onChange={(e) => setRestrictionReason(e.target.value)}
                    placeholder="Restriction reason"
                    className="rounded border p-3"
                  />

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
                    className="rounded bg-red-600 px-4 py-2 text-white"
                  >
                    Apply Restriction
                  </button>
                </div>
              </div>

              <div className="mt-6 max-h-[540px] space-y-3 overflow-y-auto">
                {restrictions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No restrictions found.</p>
                ) : (
                  restrictions.map((restriction) => (
                    <div key={restriction.restriction_id} className="rounded border p-3">
                      <p>
                        <strong>Type:</strong> {restriction.restriction_type}
                      </p>

                      <p>
                        <strong>Reason:</strong> {restriction.restriction_reason}
                      </p>

                      <p>
                        <strong>Status:</strong> {restriction.is_active ? "Active" : "Removed"}
                      </p>

                      {restriction.is_active && (
                        <button
                          type="button"
                          onClick={async () => {
                            await adminStudentService.removeRestriction(restriction.restriction_id);

                            const refreshed =
                              await adminStudentService.getStudentRestrictions(studentId);

                            setRestrictions(refreshed);
                          }}
                          className="mt-3 rounded border px-3 py-1"
                        >
                          Remove Restriction
                        </button>
                      )}
                    </div>
                  ))
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
