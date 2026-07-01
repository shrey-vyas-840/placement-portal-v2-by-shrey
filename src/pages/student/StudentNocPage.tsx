import { useEffect, useState } from "react";

import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { usePageLoader } from "@/hooks/usePageLoader";

import { nocService, NOC_TYPES } from "@/services/nocService";

import { getHodEmail, NOC_EMAIL_CONFIG } from "@/config/hodMapping";

import { supabase } from "@/lib/supabase";
import { StudentLayout } from "@/components/layout/StudentLayout";

export function StudentNocPage() {
  const [profile, setProfile] = useState<any>(null);

  const [requests, setRequests] = useState<any[]>([]);

  const [completionRequest, setCompletionRequest] = useState<any>(null);

  const [uploadProgress, setUploadProgress] = useState(0);

  const [dragActive, setDragActive] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const [activeNoc, setActiveNoc] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const { showLoader } = usePageLoader(loading);

  const [submitting, setSubmitting] = useState(false);

  const [reviewMode, setReviewMode] = useState(false);

  const [form, setForm] = useState({
    noc_type: "On Campus Internship",

    opportunity_mode: "Offline",

    start_date: "",

    end_date: "",

    company_name: "",

    company_address_1: "",

    company_address_2: "",

    hr_prefix: "Mr.",

    hr_name: "",

    hr_position: "",
  });

  const [completionForm, setCompletionForm] = useState<{
    certificate: File | null;

    hr_email: string;

    hr_contact: string;

    same_hr: boolean;

    hr_name: string;

    hr_designation: string;
  }>({
    certificate: null,

    hr_email: "",

    hr_contact: "",

    same_hr: true,

    hr_name: "",

    hr_designation: "",
  });
  useEffect(() => {
    document.title = "NOC Request";

    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: authData } = await supabase.auth.getUser();

      const authUserId = authData.user?.id;

      if (!authUserId) {
        return;
      }

      const { data: account } = await (supabase as any)

        .from("user_accounts")

        .select("user_id")

        .eq("auth_provider_id", authUserId)

        .maybeSingle();

      if (!account) {
        return;
      }

      const { data: student } = await (supabase as any)

        .from("student_master")

        .select("student_id")

        .eq("user_id", account.user_id)

        .maybeSingle();

      if (!student) {
        return;
      }

      const data = await nocService.getStudentProfileSnapshot(student.student_id);

      setProfile(data);

      const nocRequests = await nocService.getStudentRequests(student.student_id);

      setRequests(nocRequests);

      if (selectedRequest) {
        const updatedRequest = nocRequests.find(
          (r: any) => r.noc_request_id === selectedRequest.noc_request_id,
        );

        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }

      const blockingRequest = await nocService.hasActiveNoc(student.student_id);

      setCompletionRequest(blockingRequest ?? null);

      const active = await nocService.hasActiveNoc(student.student_id);

      setActiveNoc(active);
    } finally {
      setLoading(false);
    }
  }

  async function submitRequest() {
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      alert("End Date must be after Start Date");

      return;
    }

    try {
      setSubmitting(true);

      const { data: authData } = await supabase.auth.getUser();

      const authUserId = authData.user?.id;

      if (!authUserId) {
        throw new Error("User not found");
      }

      const { data: account } = await (supabase as any)

        .from("user_accounts")

        .select("user_id")

        .eq("auth_provider_id", authUserId)

        .maybeSingle();

      if (!account) {
        throw new Error("Account not found");
      }

      const { data: student } = await (supabase as any)

        .from("student_master")

        .select("student_id")

        .eq("user_id", account.user_id)

        .maybeSingle();

      if (!student) {
        throw new Error("Student profile not found");
      }

      const activeNoc = await nocService.hasActiveNoc(student.student_id);

      if (activeNoc) {
        alert(`You already have an active NOC until ${activeNoc?.snapshot?.end_date}`);

        return;
      }

      const blockingRequest = activeNoc;

      if (blockingRequest) {
        alert("Complete your previous NOC and submit certificate before applying for a new NOC.");

        return;
      }

      await nocService.createRequest(student.student_id, form);

      alert("NOC Request Submitted Successfully");
      setLoading(true);

      await loadProfile();

      setReviewMode(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (showLoader) {
    return <AppLoadingScreen page="noc" />;
  }

  async function submitCompletion() {
    if (!completionRequest) {
      return;
    }

    if (!/^[0-9]{10}$/.test(completionForm.hr_contact.trim())) {
      alert("Enter a valid 10-digit HR Contact Number.");

      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(completionForm.hr_email.trim())) {
      alert("Enter a valid HR Email.");

      return;
    }
    if (!completionForm.certificate) {
      alert("Upload Your Completion Certificate");

      return;
    }

    if (!completionForm.hr_email.trim()) {
      alert("Enter HR Email");

      return;
    }

    if (!completionForm.hr_contact.trim()) {
      alert("Enter HR Contact Number");

      return;
    }

    if (!completionForm.same_hr) {
      if (!completionForm.hr_name.trim()) {
        alert("Enter New HR Name");

        return;
      }

      if (!completionForm.hr_designation.trim()) {
        alert("Enter New HR Designation");

        return;
      }
    }

    setUploadProgress(25);

    const certificatePath = await nocService.uploadCompletionCertificate(
      completionForm.certificate!,
    );

    setUploadProgress(100);

    await nocService.submitCompletionDetails(
      completionRequest.noc_request_id,

      {
        completion_certificate_url: certificatePath,

        completion_hr_email: completionForm.hr_email,

        completion_hr_contact: completionForm.hr_contact,

        completion_same_hr: completionForm.same_hr,

        completion_hr_name: completionForm.same_hr
          ? completionRequest?.snapshot?.hr_name
          : completionForm.hr_name,

        completion_hr_designation: completionForm.same_hr
          ? completionRequest?.snapshot?.hr_position
          : completionForm.hr_designation,
      },
    );

    alert("Completion Details Submitted");

    setUploadProgress(0);

    setCompletionForm({
      certificate: null,

      hr_email: "",

      hr_contact: "",

      same_hr: true,

      hr_name: "",

      hr_designation: "",
    });
    setLoading(true);
    await loadProfile();
  }

  async function sendHodApprovalMail(request: any) {
    if (request.hod_mail_send_count >= 2) {
      alert("Maximum HOD approval emails already sent.");

      return;
    }

    if (request.hod_mail_send_count >= 1 && new Date() < new Date(request.hod_approval_deadline)) {
      alert(
        "HOD approval request already sent. You can resend only after the approval deadline expires.",
      );

      return;
    }

    if (request.status !== "PENDING_HOD_APPROVAL") {
      alert("Approval process already completed.");

      return;
    }

    try {
      const freshToken = await nocService.regenerateHodToken(request.noc_request_id);

      const hodEmail = getHodEmail(
        request.snapshot?.institute_name,
        request.snapshot?.course,
        request.snapshot?.branch,
      );

      const subject = `NOC Request: ${request.snapshot?.enrollment_no} - ${request.snapshot?.student_name} for ${request.snapshot?.company_name} as ${request.noc_type}`;

      const branchLine =
        request.snapshot?.branch === "Computer Science Engineering"
          ? "CSE"
          : (request.snapshot?.branch ?? "");

      const body = `Dear Sir/Madam,

Greetings.

I am ${request.snapshot?.student_name} (Enrollment No. ${request.snapshot?.enrollment_no}), currently studying in ${request.snapshot?.course} ${request.snapshot?.branch} at ${request.snapshot?.institute_name}.

I have applied for  ${request.noc_type} opportunity with ${request.snapshot?.company_name} and request your approval for my NOC application.

I kindly request you to review and approve/reject my application at your earliest convenience using the secure review link below:

${window.location.origin}/hod/review/${freshToken}

Thank you.

Regards,

${request.snapshot?.student_name}
${request.snapshot?.enrollment_no}
${branchLine}, ${request.snapshot?.institute_name}`;

      const mailto =
        `mailto:${hodEmail}` +
        `?cc=${encodeURIComponent(
          `${NOC_EMAIL_CONFIG.DEPUTY_TNP_EMAIL},${NOC_EMAIL_CONFIG.PLACEMENT_CELL_EMAIL}`,
        )}` +
        `&subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      await nocService.markHodMailSent(request.noc_request_id);
      setLoading(true);
      await loadProfile();

      const gmailUrl =
        `https://mail.google.com/mail/?view=cm&fs=1` +
        `&to=${encodeURIComponent(hodEmail)}` +
        `&cc=${encodeURIComponent(
          `${NOC_EMAIL_CONFIG.DEPUTY_TNP_EMAIL},${NOC_EMAIL_CONFIG.PLACEMENT_CELL_EMAIL}`,
        )}` +
        `&su=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      window.open(gmailUrl, "_blank");
    } catch (error: any) {
      alert(error.message);
    }
  }

  function formatNocTimelineTime(value?: string | null) {
    return value ? new Date(value).toLocaleString() : "Pending";
  }

  function getStudentNocTimeline(request: any) {
    const timeline = [
      {
        title: "Request submitted",
        time: request.submitted_at ?? request.created_at,
        description: `NOC request created for ${request.noc_type}.`,
        done: true,
      },

      {
        title: "Approved By HOD",

        time: request.approved_at,

        description: "Application approved by HOD.",

        done: request.approval_source === "HOD_APPROVED",
      },

      {
        title: "Printed",
        time: request.printed_at,
        description:
          Number(request.print_count ?? 0) > 1
            ? `Printed ${request.print_count} times.`
            : "Printed once.",
        done: [
          "PRINTED",
          "ISSUED",
          "CANCELLED",
          "COMPLETED_TENURE_PENDING_VERIFICATION",
          "TENURE_COMPLETED",
        ].includes(request.status),
      },

      {
        title: "Issued",
        time: request.issued_at,
        description: request.reference_number
          ? `Reference No. ${request.reference_number}`
          : "Issued to student.",
        done: [
          "ISSUED",
          "CANCELLED",
          "COMPLETED_TENURE_PENDING_VERIFICATION",
          "TENURE_COMPLETED",
        ].includes(request.status),
      },

      {
        title: request.status === "HOD_REJECTED" ? "Rejected By HOD" : "Rejected By Admin",

        time: request.rejection_at,

        description: request.rejection_reason || "Application rejected.",

        done: ["HOD_REJECTED", "ADMIN_REJECTED"].includes(request.status),
      },

      {
        title: "Cancelled",
        time: request.cancelled_at,
        description: request.cancellation_reason || "Request was cancelled.",
        done: request.status === "CANCELLED",
      },

      {
        title: "Completion details submitted",
        time: request.completion_submitted_at,
        description: request.completion_same_hr
          ? "Same HR was used for verification."
          : "New HR details were submitted.",
        done: !!request.completion_submitted_at || request.status === "TENURE_COMPLETED",
      },

      {
        title: "Tenure verification rejected",
        time: request.tenure_rejected_at,
        description: request.tenure_rejection_reason || "Completion verification was rejected.",
        done: request.status === "TENURE_REJECTED",
      },

      {
        title: "Tenure verified",
        time: request.completion_verified_at ?? request.tenure_completed_at,
        description: request.completion_remark || "Verification completed.",
        done: request.status === "TENURE_COMPLETED",
      },
    ];

    return timeline.filter((step) => step.done || step.time);
  }

  return (
    <StudentLayout completionName={profile?.student_name ?? ""} completionPercentage={100}>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">NOC Request</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Step 1: Fill Form → Step 2: Review & Confirm → Step 3: Wait For HOD Approval → Step 4:
            NOC Issued → Step 5: Collect From T&P Cell
          </p>
        </div>

        {activeNoc && (
          <div
            className="
mb-6
rounded-lg
border
border-yellow-300
bg-yellow-50
p-4
"
          >
            <strong>Active NOC Exists</strong>
            <br />
            You already have an active NOC until{" "}
            <strong>{activeNoc?.snapshot?.end_date ?? "-"}</strong>. New NOC requests are restricted
            until completion.
          </div>
        )}

        {completionRequest && (
          <div
            className="
mb-6
rounded-lg
border
border-red-300
bg-red-50
p-4
"
          >
            <strong>Previous NOC Completion Required</strong>
            <br />
            Submit internship/job completion details before applying for a new NOC.
            <br />
            <br />
            Certificate Upload is Mandatory. HR Verification Details are Mandatory. New NOC requests
            remain blocked until completion verification.
          </div>
        )}

        {!reviewMode && (
          <div className="rounded-lg border p-6 space-y-4">
            <div>
              <label>NOC Type</label>

              <select
                className="w-full border rounded p-2"
                value={form.noc_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    noc_type: e.target.value,
                  })
                }
              >
                {NOC_TYPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <div>
                <label>Opportunity Mode</label>

                <select
                  className="w-full border rounded p-2"
                  value={form.opportunity_mode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      opportunity_mode: e.target.value,
                    })
                  }
                >
                  <option>Offline</option>

                  <option>Hybrid</option>

                  <option>Online</option>
                </select>
              </div>
            </div>
            {selectedRequest && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <span
                    className="
px-3
py-1
rounded
bg-green-100
text-green-800
"
                  >
                    ✓ Submitted
                  </span>

                  <span
                    className={`
px-3
py-1
rounded
${
  ["PENDING_PRINT", "PRINTED", "ISSUED"].includes(selectedRequest.status) ||
  selectedRequest.approval_source === "HOD_APPROVED"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-600"
}
`}
                  >
                    ✓ HOD Approved
                  </span>

                  <span
                    className={`
px-3
py-1
rounded
${
  ["PRINTED", "ISSUED"].includes(selectedRequest.status)
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-600"
}
`}
                  >
                    ✓ Ready For Print
                  </span>

                  <span
                    className={`
px-3
py-1
rounded
${
  ["ISSUED"].includes(selectedRequest.status)
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-600"
}
`}
                  >
                    ✓ Issued
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Start Date</label>

                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>End Date</label>

                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            {form.start_date && form.end_date && (
              <div className="rounded border p-3 bg-muted">
                Duration:{" "}
                <strong>
                  {Math.max(
                    1,
                    (new Date(form.end_date).getFullYear() -
                      new Date(form.start_date).getFullYear()) *
                      12 +
                      (new Date(form.end_date).getMonth() - new Date(form.start_date).getMonth()),
                  )}
                </strong>{" "}
                Month(s)
              </div>
            )}

            <div>
              <label>Company Name</label>

              <input
                className="w-full border rounded p-2"
                value={form.company_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company_name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Company Address 1</label>

              <input
                className="w-full border rounded p-2"
                value={form.company_address_1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company_address_1: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Company Address 2</label>

              <input
                className="w-full border rounded p-2"
                value={form.company_address_2}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company_address_2: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <select
                className="border rounded p-2"
                value={form.hr_prefix}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hr_prefix: e.target.value,
                  })
                }
              >
                <option>Mr.</option>

                <option>Ms.</option>
              </select>

              <input
                placeholder="HR Name"
                className="border rounded p-2"
                value={form.hr_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hr_name: e.target.value,
                  })
                }
              />

              <input
                placeholder="HR Position"
                className="border rounded p-2"
                value={form.hr_position}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hr_position: e.target.value,
                  })
                }
              />
            </div>

            <button
              disabled={!!activeNoc || !!completionRequest}
              onClick={() => setReviewMode(true)}
              className="rounded border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review & Confirm
            </button>
          </div>
        )}

        {reviewMode && (
          <div className="rounded-lg border p-6">
            <h2 className="mb-2 text-xl font-semibold">Review & Confirm</h2>

            <p className="mb-6 text-sm text-muted-foreground">
              Please verify all details carefully before submitting. Once submitted, the request
              will be sent for HOD approval.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Student Name</p>
                <p className="font-medium">{profile?.student_name}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Enrollment Number</p>
                <p className="font-medium">{profile?.enrollment_no}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Institute Email</p>
                <p className="font-medium">{profile?.institute_email}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Institute</p>
                <p className="font-medium">{profile?.institute_name}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Course</p>
                <p className="font-medium">{profile?.course}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Semester</p>
                <p className="font-medium">{profile?.semester}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Branch</p>
                <p className="font-medium">{profile?.branch}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">NOC Type</p>
                <p className="font-medium">{form.noc_type}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Opportunity Mode</p>

                <p className="font-medium">{form.opportunity_mode}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium">{form.start_date}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium">{form.end_date}</p>
              </div>

              <div className="rounded border p-3 md:col-span-2">
                <p className="text-xs text-muted-foreground">Company Name</p>
                <p className="font-medium">{form.company_name}</p>
              </div>

              <div className="rounded border p-3 md:col-span-2">
                <p className="text-xs text-muted-foreground">Company Address 1</p>
                <p className="font-medium">{form.company_address_1}</p>
              </div>

              <div className="rounded border p-3 md:col-span-2">
                <p className="text-xs text-muted-foreground">Company Address 2</p>
                <p className="font-medium">{form.company_address_2}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">HR Prefix</p>
                <p className="font-medium">{form.hr_prefix}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">HR Name</p>
                <p className="font-medium">{form.hr_name}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">HR Position</p>
                <p className="font-medium">{form.hr_position}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={() => setReviewMode(false)} className="rounded border px-4 py-2">
                Back
              </button>

              <button
                disabled={submitting || !!activeNoc || !!completionRequest}
                onClick={submitRequest}
              >
                Submit Request
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          {completionRequest && (
            <div className="mb-8 rounded-lg border p-6">
              <h2 className="mb-2 text-xl font-semibold">NOC Completion Verification</h2>

              <p className="mb-6 text-sm text-muted-foreground">
                Upload your completion certificate and HR verification details to close your
                previous NOC and become eligible for future NOC requests.
              </p>

              {(!completionRequest?.completion_submitted_at ||
                completionRequest?.status === "TENURE_REJECTED") && (
                <div className="space-y-6">
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <div className="mb-2 font-medium">Completion Certificate</div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();

                        setDragActive(true);
                      }}
                      onDragLeave={() => {
                        setDragActive(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();

                        setDragActive(false);

                        const file = e.dataTransfer.files?.[0];

                        if (!file) return;

                        const allowedTypes = [
                          "application/pdf",

                          "image/jpeg",

                          "image/jpg",

                          "image/png",
                        ];

                        if (!allowedTypes.includes(file.type)) {
                          alert("Only PDF, JPG, JPEG and PNG allowed");

                          return;
                        }

                        if (file.size > 5 * 1024 * 1024) {
                          alert("Maximum file size is 5 MB");

                          return;
                        }

                        setCompletionForm({
                          ...completionForm,

                          certificate: file,
                        });
                      }}
                      className={`
                        rounded-lg
                        border-2
                        border-dashed
                        p-8
                        text-center
                        cursor-pointer
                        transition

                        ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"}
                    `}
                    >
                      <input
                        id="completion-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          if (!file) return;

                          setCompletionForm({
                            ...completionForm,

                            certificate: file,
                          });
                        }}
                      />

                      <label htmlFor="completion-upload" className="cursor-pointer">
                        <div className="text-lg font-semibold">Upload Completion Certificate</div>

                        <div className="mt-2 text-sm text-muted-foreground">
                          Drag & Drop or Click To Browse
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          PDF / JPG / PNG • Max 5 MB
                        </div>
                      </label>
                    </div>

                    {completionForm.certificate && (
                      <div className="mt-4 rounded border bg-green-50 p-3">
                        <div className="font-medium text-green-700">File Selected</div>

                        <div className="text-sm">{completionForm.certificate.name}</div>

                        <div className="text-xs text-muted-foreground">
                          {(completionForm.certificate.size / 1024 / 1024).toFixed(2)}
                          MB
                        </div>

                        {uploadProgress > 0 && (
                          <div className="mt-3">
                            <div className="h-2 rounded bg-slate-200">
                              <div
                                className="h-2 rounded bg-green-600"
                                style={{
                                  width: `${uploadProgress}%`,
                                }}
                              />
                            </div>

                            <div className="mt-1 text-xs">Upload Progress: {uploadProgress}%</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border bg-slate-50 p-4">
                    <div className="mb-4 font-medium">HR Verification Details</div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        placeholder="HR Email"
                        className="w-full rounded border p-2"
                        value={completionForm.hr_email}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,

                            hr_email: e.target.value,
                          })
                        }
                      />

                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="10 Digit HR Contact Number"
                        className="w-full rounded border p-2"
                        value={completionForm.hr_contact}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 10);

                          setCompletionForm({
                            ...completionForm,

                            hr_contact: value,
                          });
                        }}
                      />
                    </div>

                    <label className="mt-4 flex gap-2">
                      <input
                        type="checkbox"
                        checked={completionForm.same_hr}
                        onChange={(e) =>
                          setCompletionForm({
                            ...completionForm,

                            same_hr: e.target.checked,
                          })
                        }
                      />
                      Same HR as NOC ({completionRequest?.snapshot?.hr_name})
                    </label>

                    {!completionForm.same_hr && (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <input
                          placeholder="New HR Name"
                          className="w-full rounded border p-2"
                          value={completionForm.hr_name}
                          onChange={(e) =>
                            setCompletionForm({
                              ...completionForm,

                              hr_name: e.target.value,
                            })
                          }
                        />

                        <input
                          placeholder="New HR Designation"
                          className="w-full rounded border p-2"
                          value={completionForm.hr_designation}
                          onChange={(e) =>
                            setCompletionForm({
                              ...completionForm,

                              hr_designation: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4">
                {completionRequest?.status === "TENURE_REJECTED" ? (
                  <div className="space-y-3">
                    <div className="rounded border border-red-300 bg-red-50 p-3">
                      <div className="font-semibold text-red-700">
                        Completion Verification Rejected
                      </div>

                      <div className="mt-2 text-sm">
                        {completionRequest?.tenure_rejection_reason ?? "No reason provided."}
                      </div>
                    </div>

                    <button
                      onClick={submitCompletion}
                      className="
bg-red-600
text-white
px-4
py-2
rounded
"
                    >
                      Re-submit Completion Details
                    </button>
                  </div>
                ) : completionRequest?.completion_submitted_at ? (
                  <div className="rounded bg-yellow-50 border border-yellow-300 p-3 text-sm">
                    Completion details submitted. Waiting for Admin verification.
                  </div>
                ) : (
                  <button
                    onClick={submitCompletion}
                    className="
bg-red-600
text-white
px-4
py-2
rounded
"
                  >
                    Submit Completion Details
                  </button>
                )}
              </div>
            </div>
          )}

          <h2 className="mb-4 text-xl font-semibold">My NOC Requests</h2>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Company</th>

                  <th className="p-3 text-left">Type</th>

                  <th className="p-3 text-left">Duration</th>

                  <th className="p-3 text-left">Applied On</th>

                  <th className="p-3 text-left">Approval Deadline</th>

                  <th className="p-3 text-left">Reference No</th>

                  <th className="p-3 text-left">Issued Date</th>

                  <th className="p-3 text-left">Prints</th>

                  <th className="p-3 text-left">Status</th>

                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.noc_request_id} className="border-b">
                    <td className="p-3">{request.snapshot?.company_name}</td>

                    <td className="p-3">{request.noc_type}</td>

                    <td className="p-3">
                      {Math.max(
                        1,
                        (new Date(request.snapshot?.end_date).getFullYear() -
                          new Date(request.snapshot?.start_date).getFullYear()) *
                          12 +
                          (new Date(request.snapshot?.end_date).getMonth() -
                            new Date(request.snapshot?.start_date).getMonth()),
                      )}{" "}
                      Month(s)
                    </td>

                    <td className="p-3">
                      {request.created_at ? new Date(request.created_at).toLocaleDateString() : "-"}
                    </td>

                    <td className="p-3">
                      {request.hod_approval_deadline
                        ? new Date(request.hod_approval_deadline).toLocaleString()
                        : "-"}
                    </td>

                    <td className="p-3">{request.reference_number ?? "-"}</td>

                    <td className="p-3">
                      {request.issued_at ? new Date(request.issued_at).toLocaleDateString() : "-"}
                    </td>

                    <td className="p-3">{request.print_count ?? 0}</td>

                    <td className="p-3">
                      <span
                        className={`
            rounded-full
            px-3
            py-1
            text-xs
            font-medium
            ${
              request.status === "PENDING_HOD_APPROVAL"
                ? "bg-yellow-100 text-yellow-800"
                : request.status === "PENDING_PRINT"
                  ? "bg-blue-100 text-blue-800"
                  : request.status === "PRINTED"
                    ? "bg-purple-100 text-purple-800"
                    : request.status === "ISSUED"
                      ? "bg-green-100 text-green-800"
                      : request.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : request.status === "TENURE_REJECTED"
                          ? "bg-red-100 text-red-800"
                          : request.status === "TENURE_COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
            }
        `}
                      >
                        {request.status === "PENDING_HOD_APPROVAL"
                          ? "Pending HOD"
                          : request.status === "PENDING_PRINT"
                            ? "Pending Print"
                            : request.status === "PRINTED"
                              ? "Printed"
                              : request.status === "ISSUED"
                                ? "Issued - Active"
                                : request.status === "COMPLETED_TENURE_PENDING_VERIFICATION"
                                  ? "Completion Verification Pending"
                                  : request.status === "TENURE_COMPLETED"
                                    ? "Eligible For New NOC"
                                    : request.status === "CANCELLED"
                                      ? "Cancelled"
                                      : request.status === "HOD_REJECTED"
                                        ? "Rejected by HOD"
                                        : request.status === "ADMIN_REJECTED"
                                          ? "Rejected by Admin"
                                          : request.status === "TENURE_REJECTED"
                                            ? "Tenure Rejected"
                                            : request.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="rounded border px-3 py-1"
                        >
                          View
                        </button>
                        {request.status === "PENDING_HOD_APPROVAL" &&
                          request.hod_mail_send_count < 2 &&
                          !(
                            request.hod_mail_send_count >= 1 &&
                            new Date() < new Date(request.hod_approval_deadline)
                          ) && (
                            <button
                              onClick={() => sendHodApprovalMail(request)}
                              className="
                                                            rounded
                                                            border
                                                            px-3
                                                            py-1
                                                            bg-blue-50
"
                            >
                              {request.hod_mail_send_count > 0
                                ? "Resend HOD Approval"
                                : "Send HOD Approval Request"}
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}

                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No NOC requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRequest && (
          <div
            className="
fixed
inset-0
z-50
flex
items-center
justify-center
bg-black/50
"
          >
            <div
              className="
w-full
max-w-4xl
rounded-lg
bg-white
p-6
"
            >
              <h2 className="mb-4 text-xl font-semibold">NOC Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Company</strong>

                  <br />

                  {selectedRequest.snapshot?.company_name}
                </div>

                <div>
                  <strong>NOC Type</strong>

                  <br />

                  {selectedRequest.noc_type}
                </div>

                <div>
                  <strong>Start Date</strong>

                  <br />

                  {selectedRequest.snapshot?.start_date}
                </div>

                <div>
                  <strong>End Date</strong>

                  <br />

                  {selectedRequest.snapshot?.end_date}
                </div>

                <div>
                  <strong>HR Name</strong>

                  <br />

                  {selectedRequest.snapshot?.hr_name}
                </div>

                <div>
                  <strong>HR Position</strong>

                  <br />

                  {selectedRequest.snapshot?.hr_position}
                </div>

                <div>
                  <strong>Approval Source</strong>

                  <br />

                  {selectedRequest.approval_source ?? "-"}
                </div>

                <div>
                  <strong>Approved At</strong>

                  <br />

                  {selectedRequest.approved_at
                    ? new Date(selectedRequest.approved_at).toLocaleString()
                    : "-"}
                </div>

                <div>
                  {["ISSUED", "CANCELLED"].includes(selectedRequest.status) && (
                    <>
                      <strong>Reference Number</strong>

                      <br />

                      {selectedRequest.reference_number ?? "-"}
                    </>
                  )}
                </div>
              </div>

              <div>
                <strong>Issued At</strong>

                <br />

                {selectedRequest?.completion_certificate_url && (
                  <div>
                    <strong>Completion Certificate</strong>

                    <br />

                    <button
                      onClick={async () => {
                        const url = await nocService.getCertificateUrl(
                          selectedRequest.completion_certificate_url,
                        );

                        window.open(url, "_blank");
                      }}
                      className="text-blue-600 underline"
                    >
                      View Certificate
                    </button>
                  </div>
                )}

                {selectedRequest.issued_at
                  ? new Date(selectedRequest.issued_at).toLocaleString()
                  : "-"}
              </div>

              <h3 className="mb-4 text-lg font-semibold">NOC Timeline History</h3>

              {selectedRequest.rejection_reason && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4">
                  <div className="font-semibold text-red-700">Rejection Reason</div>

                  <div className="mt-2 text-sm">{selectedRequest.rejection_reason}</div>
                </div>
              )}

              {selectedRequest.cancellation_reason && (
                <div className="mb-4 rounded-lg border border-orange-300 bg-orange-50 p-4">
                  <div className="font-semibold text-orange-700">Cancellation Reason</div>

                  <div className="mt-2 text-sm">{selectedRequest.cancellation_reason}</div>
                </div>
              )}

              {selectedRequest.tenure_rejection_reason && (
                <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                  <div className="font-semibold text-yellow-700">Tenure Verification Rejected</div>

                  <div className="mt-2 text-sm">{selectedRequest.tenure_rejection_reason}</div>
                </div>
              )}

              <div className="mt-6 rounded-lg border bg-slate-50 p-4">
                <h3 className="mb-4 text-lg font-semibold">NOC Timeline History</h3>

                <div className="space-y-4">
                  {getStudentNocTimeline(selectedRequest).map((step: any, index: number) => (
                    <div key={step.title + index} className="flex gap-3">
                      <div
                        className={`
mt-1
h-3
w-3
rounded-full
flex-shrink-0
${step.done ? "bg-green-600" : "bg-gray-300"}
`}
                      />

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="font-medium">{step.title}</div>

                          <div className="text-xs text-muted-foreground">
                            {formatNocTimelineTime(step.time)}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="
rounded
border
px-4
py-2
"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
