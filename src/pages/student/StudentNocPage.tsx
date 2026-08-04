import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { usePageLoader } from "@/hooks/usePageLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nocService, NOC_TYPES } from "@/services/nocService";

import { getHodEmail, NOC_EMAIL_CONFIG } from "@/config/hodMapping";

import { supabase } from "@/lib/supabase";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { CalendarIcon } from "lucide-react";

import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

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

  const [startDateOpen, setStartDateOpen] = useState(false);

  const [endDateOpen, setEndDateOpen] = useState(false);

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
      <div className="w-full max-w-none px-4 py-6 lg:px-6 xl:px-8 2xl:px-10">
        <section className="relative overflow-hidden rounded-[32px] border border-primary/10 bg-gradient-to-r from-primary via-blue-700 to-cyan-600 px-6 py-7 text-white shadow-xl sm:px-8 sm:py-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-white/75">Student Services</p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">NOC Request</h1>

              <p className="mt-3 max-w-2xl text-base text-white/80">
                Submit and monitor your No Objection Certificate requests from one centralized
                workspace.
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-sm" />
          <div className="pointer-events-none absolute bottom-0 right-12 h-24 w-24 rounded-full bg-white/10 blur-sm" />
        </section>

        <div className="mt-6 grid gap-4 md:grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
              Requests
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">{requests.length}</div>

            <div className="mt-2 text-sm text-slate-500">Total submitted requests</div>
          </div>

          <div className="rounded-2xl border border-emerald-300 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Active
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">{activeNoc ? 1 : 0}</div>

            <div className="mt-2 text-sm text-slate-500">Active NOC</div>
          </div>

          <div className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600">
              Completion Pending
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">
              {completionRequest ? 1 : 0}
            </div>

            <div className="mt-2 text-sm text-slate-500">Requires submission</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-400 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/70 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="min-w-[180px]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                Quick Process
              </div>

              <div className="mt-1 text-lg font-semibold text-slate-900">
                Complete your NOC in 3 simple steps
              </div>
            </div>

            <div className="grid flex-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-blue-400 bg-white/80 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Step 1
                </div>

                <div className="mt-1 font-medium text-slate-900">Fill Required Details</div>

                <div className="mt-1 text-sm text-slate-500">
                  Complete the NOC request form and review before submission.
                </div>
              </div>

              <div className="rounded-xl border border-amber-400 bg-white/80 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Step 2
                </div>

                <div className="mt-1 font-medium text-slate-900">Wait for Approvals</div>

                <div className="mt-1 text-sm text-slate-500">
                  Your request moves through the HOD and T&amp;P approval workflow.
                </div>
              </div>

              <div className="rounded-xl border border-emerald-400 bg-white/80 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Step 3
                </div>

                <div className="mt-1 font-medium text-slate-900">Track &amp; Collect NOC</div>

                <div className="mt-1 text-sm text-slate-500">
                  Once the status becomes <strong>NOC Issued</strong>, collect it from the T&amp;P
                  Cell.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {activeNoc && (
            <div className="rounded-[24px] border border-yellow-200 bg-yellow-50/90 p-5 shadow-sm">
              <div className="text-sm font-semibold text-yellow-900">Active NOC Exists</div>
              <p className="mt-2 text-sm leading-6 text-yellow-900/80">
                You already have an active NOC until{" "}
                <strong>{activeNoc?.snapshot?.end_date ?? "-"}</strong>. New NOC requests are
                restricted until completion.
              </p>
            </div>
          )}

          {completionRequest && (
            <div className="rounded-[24px] border border-red-200 bg-red-50/90 p-5 shadow-sm">
              <div className="text-sm font-semibold text-red-700">
                Previous NOC Completion Required
              </div>
              <p className="mt-2 text-sm leading-6 text-red-700/80">
                Submit internship/job completion details before applying for a new NOC. Certificate
                upload and HR verification details are mandatory.
              </p>
            </div>
          )}
        </div>

        {!reviewMode && (
          <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  NOC APPLICATION
                </p>

                <h2 className="mt-2 text-2xl font-semibold">Internship / Placement Details</h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Fill in all required organisation details before reviewing your application.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/40 p-6">
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Opportunity Information
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">Internship / Placement Details</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Configure the basic details of your internship or placement opportunity.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">NOC Type</label>
                    <Select
                      value={form.noc_type}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          noc_type: value,
                        })
                      }
                    >
                      <SelectTrigger
                        className="
    h-14
    w-full
    rounded-2xl
    border
    border-slate-400
    bg-white
    px-4
    text-[15px]
    font-medium
    shadow-sm
    transition-all
    duration-200
    hover:border-slate-300
    hover:shadow-md
    focus:ring-4
    focus:ring-primary/10
    data-[state=open]:border-primary
    data-[state=open]:ring-4
    data-[state=open]:ring-primary/10
  "
                      >
                        <SelectValue placeholder="Select NOC Type" />
                      </SelectTrigger>

                      <SelectContent
                        sideOffset={8}
                        position="popper"
                        className="
    min-w-[var(--radix-select-trigger-width)]
    rounded-2xl
    border
    border-slate-600
    bg-white
    p-2
    shadow-2xl
  "
                      >
                        {NOC_TYPES.map((item) => (
                          <SelectItem
                            key={item}
                            value={item}
                            className="
        my-1
        cursor-pointer
        rounded-xl
        px-3
        py-3
        text-[14px]
        font-medium
        outline-none
        focus:bg-primary/10
        data-[highlighted]:bg-primary/10
        data-[state=checked]:bg-primary
        data-[state=checked]:text-primary-foreground
      "
                          >
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>{" "}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Opportunity Mode</label>

                    <Select
                      value={form.opportunity_mode}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          opportunity_mode: value,
                        })
                      }
                    >
                      <SelectTrigger
                        className="
      h-14
      w-full
      rounded-2xl
      border
      border-slate-400
      bg-white
      px-4
      text-[15px]
      font-medium
      shadow-sm
      transition-all
      duration-200
      hover:border-slate-300
      hover:shadow-md
      focus:ring-4
      focus:ring-primary/10
      data-[state=open]:border-primary
      data-[state=open]:ring-4
      data-[state=open]:ring-primary/10
    "
                      >
                        <SelectValue placeholder="Select Opportunity Mode" />
                      </SelectTrigger>

                      <SelectContent
                        sideOffset={8}
                        position="popper"
                        className="
      min-w-[var(--radix-select-trigger-width)]
      rounded-2xl
      border
      border-slate-600
      bg-white
      p-2
      shadow-2xl
    "
                      >
                        <SelectItem
                          value="Offline"
                          className="
        my-1
        cursor-pointer
        rounded-xl
        px-3
        py-3
        text-[14px]
        font-medium
        data-[highlighted]:bg-primary/10
        data-[state=checked]:bg-primary
        data-[state=checked]:text-primary-foreground
      "
                        >
                          Offline
                        </SelectItem>

                        <SelectItem
                          value="Hybrid"
                          className="
        my-1
        cursor-pointer
        rounded-xl
        px-3
        py-3
        text-[14px]
        font-medium
        data-[highlighted]:bg-primary/10
        data-[state=checked]:bg-primary
        data-[state=checked]:text-primary-foreground
      "
                        >
                          Hybrid
                        </SelectItem>

                        <SelectItem
                          value="Online"
                          className="
        my-1
        cursor-pointer
        rounded-xl
        px-3
        py-3
        text-[14px]
        font-medium
        data-[highlighted]:bg-primary/10
        data-[state=checked]:bg-primary
        data-[state=checked]:text-primary-foreground
      "
                        >
                          Online
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>

                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="
          h-14
          w-full
          justify-between
          rounded-2xl
          border
          border-slate-400
          bg-white
          px-4
          text-left
          text-[15px]
          font-medium
          shadow-sm
          hover:border-slate-600
          hover:bg-white
          data-[state=open]:border-primary
          data-[state=open]:ring-4
          data-[state=open]:ring-primary/10
        "
                        >
                          {form.start_date
                            ? format(new Date(form.start_date), "dd MMM yyyy")
                            : "Select start date"}

                          <CalendarIcon className="h-5 w-5 text-slate-500" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        align="start"
                        sideOffset={15}
                        className="
        w-auto
        rounded-3xl
        border
        border-slate-400
        bg-white
        p-4
        shadow-2xl
      "
                      >
                        <Calendar
                          mode="single"
                          showOutsideDays
                          className="rounded-2xl
                           border
                           border-slate-400"
                          selected={form.start_date ? new Date(form.start_date) : undefined}
                          onSelect={(date) => {
                            if (!date) return;

                            setForm({
                              ...form,
                              start_date: format(date, "yyyy-MM-dd"),
                            });

                            setStartDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>

                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="
          h-14
          w-full
          justify-between
          rounded-2xl
          border
          border-slate-400
          bg-white
          px-4
          text-left
          text-[15px]
          font-medium
          shadow-sm
          hover:border-slate-600
          hover:bg-white
          data-[state=open]:border-primary
          data-[state=open]:ring-4
          data-[state=open]:ring-primary/10
        "
                        >
                          {form.end_date
                            ? format(new Date(form.end_date), "dd MMM yyyy")
                            : "Select end date"}

                          <CalendarIcon className="h-5 w-5 text-slate-500" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        align="start"
                        sideOffset={15}
                        className="
        w-auto
        rounded-3xl
        border
        border-slate-400
        bg-white
        p-4
        shadow-2xl
      "
                      >
                        <Calendar
                          mode="single"
                          showOutsideDays
                          defaultMonth={form.start_date ? new Date(form.start_date) : undefined}
                          className="
          rounded-2xl
          border
          border-slate-400
        "
                          selected={form.end_date ? new Date(form.end_date) : undefined}
                          onSelect={(date) => {
                            if (!date) return;

                            setForm({
                              ...form,
                              end_date: format(date, "yyyy-MM-dd"),
                            });

                            setEndDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {form.start_date && form.end_date && (
                  <div className="mt-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                          Internship Duration
                        </p>

                        <h4 className="mt-1 text-lg font-semibold">
                          {Math.max(
                            1,
                            (new Date(form.end_date).getFullYear() -
                              new Date(form.start_date).getFullYear()) *
                              12 +
                              (new Date(form.end_date).getMonth() -
                                new Date(form.start_date).getMonth()),
                          )}{" "}
                          Month(s)
                        </h4>
                      </div>

                      <div className="rounded-xl bg-white px-5 py-3 shadow-sm border border-blue-300">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Timeline
                        </div>

                        <div className="mt-1 text-sm font-medium">
                          {format(new Date(form.start_date), "dd MMM yyyy")}
                          {" → "}
                          {format(new Date(form.end_date), "dd MMM yyyy")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50/40 p-6">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Company Information
                </p>

                <h3 className="mt-2 text-xl font-semibold">Organization Details</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the organization where you will be joining for your internship or placement.
                </p>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>

                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.company_name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Address 1</label>

                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.company_address_1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company_address_1: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Address 2</label>

                  <input
                    className="
            w-full
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-4
            py-3
            transition-all
            outline-none
            focus:border-primary
            focus:ring-4
            focus:ring-primary/10
        "
                    value={form.company_address_2}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company_address_2: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mt-10 border-t border-slate-200 pt-8">
                  <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      HR Contact
                    </p>

                    <h3 className="mt-2 text-xl font-semibold">Organization Representative</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Enter the HR or authorised company representative details.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <Select
                      value={form.hr_prefix}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          hr_prefix: value,
                        })
                      }
                    >
                      <SelectTrigger
                        className="
      h-14
      w-full
      rounded-2xl
      border
      border-slate-400
      bg-white
      px-4
      text-[15px]
      font-medium
      shadow-sm
      transition-all
      duration-200
      hover:border-slate-300
      hover:shadow-md
      focus:ring-4
      focus:ring-primary/10
      data-[state=open]:border-primary
      data-[state=open]:ring-4
      data-[state=open]:ring-primary/10
    "
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent
                        sideOffset={8}
                        position="popper"
                        className="
      min-w-[var(--radix-select-trigger-width)]
      rounded-2xl
      border
      border-slate-600
      bg-white
      p-2
      shadow-2xl
    "
                      >
                        <SelectItem
                          value="Mr."
                          className="
        my-1
        cursor-pointer
        rounded-xl
        px-3
        py-3
        text-[14px]
        font-medium
        data-[highlighted]:bg-primary/10
        data-[state=checked]:bg-primary
        data-[state=checked]:text-primary-foreground
      "
                        >
                          Mr.
                        </SelectItem>

                        <SelectItem
                          value="Ms."
                          className="
        my-1
        cursor-pointer
        rounded-xl
        px-3
        py-3
        text-[14px]
        font-medium
        data-[highlighted]:bg-primary/10
        data-[state=checked]:bg-primary
        data-[state=checked]:text-primary-foreground
      "
                        >
                          Ms.
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <input
                      placeholder="HR Name"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
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
                    className="
w-full
md:min-w-[200px]
mt-10
mb-4
rounded-2xl
bg-primary
px-10
py-3
text-2xl font-semibold
text-primary-foreground
shadow-md
transition-all
hover:shadow-2xl
disabled:cursor-not-allowed
disabled:opacity-50
"
                  >
                    Review & Confirm
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {reviewMode && (
          <section className="mt-6 rounded-[30px] border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                FINAL REVIEW
              </p>

              <h2 className="mt-2 text-3xl font-semibold">Review & Confirm</h2>

              <p className="mb-6 text-sm text-muted-foreground">
                Review every section below before submitting your NOC request. Once submitted, the
                request will be forwarded for HOD approval and cannot be edited.
              </p>

              <div className="grid gap-6 xl:grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-[28px] border border-slate-300 bg-white p-7 shadow-md transition-shadow hover:shadow-xl">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Student Information
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">Profile Snapshot</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">Student Name</span>
                      <span className="font-medium text-right">{profile?.student_name}</span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">Enrollment</span>
                      <span className="font-medium text-right">{profile?.enrollment_no}</span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">Institute Email</span>
                      <span className="font-medium text-right break-all">
                        {profile?.institute_email}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">Institute</span>
                      <span className="font-medium text-right">{profile?.institute_name}</span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">Course</span>
                      <span className="font-medium text-right">{profile?.course}</span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Branch</span>
                      <span className="font-medium text-right">{profile?.branch}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-300 bg-white p-7 shadow-md transition-shadow hover:shadow-xl">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Opportunity Details
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">Internship Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">NOC Type</span>
                      <span className="font-medium text-right">{form.noc_type}</span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">Mode</span>
                      <span className="font-medium text-right">{form.opportunity_mode}</span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Start Date</span>

                      <span className="text-right font-medium">
                        {form.start_date || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground">End Date</span>

                      <span className="text-right font-medium">
                        {form.end_date || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Duration</span>

                      <span className="text-right font-semibold text-primary">
                        {form.start_date && form.end_date
                          ? `${Math.max(
                              1,
                              (new Date(form.end_date).getFullYear() -
                                new Date(form.start_date).getFullYear()) *
                                12 +
                                (new Date(form.end_date).getMonth() -
                                  new Date(form.start_date).getMonth()),
                            )} Month(s)`
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-300 bg-white p-7 shadow-md transition-shadow hover:shadow-xl">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Company Details
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">Organization</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <div className="text-sm text-muted-foreground">Company</div>

                      <div className="mt-1 text-[15px] font-semibold text-slate-900 break-words">
                        {form.company_name || "Not provided"}
                      </div>
                    </div>

                    <div className="border-b border-slate-100 pb-3">
                      <div className="text-sm text-muted-foreground">Address Line 1</div>

                      <div className="mt-1 text-[15px] font-semibold text-slate-900 break-words">
                        {form.company_address_1 || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Address Line 2</div>

                      <div className="mt-1 text-[15px] font-semibold text-slate-900 break-words">
                        {form.company_address_2 || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-300 bg-white p-7 shadow-md transition-shadow hover:shadow-xl">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      HR Contact
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">Company Representative</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">Prefix</span>

                      <span className="text-right text-[15px] font-semibold text-slate-900 break-words">
                        {form.hr_prefix || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-sm text-muted-foreground">HR Name</span>

                      <span className="text-right text-[15px] font-semibold text-slate-900 break-words">
                        {form.hr_name || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Position</span>

                      <span className="text-right text-[15px] font-semibold text-slate-900 break-words">
                        {form.hr_position || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col-reverse gap-4 border-t border-slate-200 pt-8 sm:flex-row">
                <button
                  onClick={() => setReviewMode(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400"
                >
                  Back
                </button>

                <button
                  disabled={submitting || !!activeNoc || !!completionRequest}
                  onClick={submitRequest}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8">
          {completionRequest && (
            <div className="mb-8 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  COMPLETION VERIFICATION
                </p>

                <h2 className="mt-2 text-2xl font-semibold">Internship Completion Details</h2>

                <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
                  Upload your internship completion certificate and HR verification details. Once
                  verified by the Training & Placement Cell, you will become eligible to apply for
                  another NOC.
                </p>
              </div>

              {(!completionRequest?.completion_submitted_at ||
                completionRequest?.status === "TENURE_REJECTED") && (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/40 p-6">
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        DOCUMENT
                      </p>

                      <h3 className="mt-2 text-xl font-semibold">Completion Certificate</h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Upload the internship completion certificate issued by the company.
                      </p>
                    </div>

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
                        rounded-3xl
                        border-2
                        border-dashed
                        p-10
                        text-center
                        cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5
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
                      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="font-semibold text-emerald-700">File Selected</div>

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

                  <div className="rounded-3xl border border-slate-200 bg-slate-50/40 p-6">
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        HR VERIFICATION
                      </p>

                      <h3 className="mt-2 text-xl font-semibold">Verification Contact</h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Provide the HR details that will be used by the Training & Placement Cell
                        for internship verification.
                      </p>
                    </div>

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

          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              HISTORY
            </p>

            <h2 className="mt-2 text-2xl font-semibold">My NOC Requests</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Track every NOC request, approval, issuance and completion status.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="max-h-[420px] overflow-auto rounded-3xl">
              <table className="w-full table-fixed border-collapse">
                <thead className="bg-slate-50">
                  <tr className="border-b">
                    <th className="w-[220px] px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Company
                    </th>

                    <th className="w-[170px] px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Type
                    </th>

                    <th className="w-[110px] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Duration
                    </th>

                    <th className="w-[120px] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Applied
                    </th>

                    <th className="w-[165px] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Deadline
                    </th>

                    <th className="w-[100px] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Ref.
                    </th>

                    <th className="w-[120px] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Issued
                    </th>

                    <th className="w-[70px] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Prints
                    </th>

                    <th className="w-[140px] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Status
                    </th>

                    <th className="w-[170px] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-8 py-16 text-center">
                        <div className="max-w-sm">
                          <div className="text-5xl">📄</div>

                          <h3 className="mt-4 text-lg font-semibold">No NOC Requests Yet</h3>

                          <p className="mt-2 text-sm text-slate-500">
                            Your submitted NOC requests will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr
                        key={request.noc_request_id}
                        className="
        border-b
        even:bg-slate-50/60
        hover:bg-primary/5
        transition-colors
    "
                      >
                        <td className="min-w-[220px] px-5 py-4">
                          <td className="min-w-[220px] px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {request.snapshot?.company_name}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">{request.noc_type}</div>
                          </td>
                        </td>

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
                          {request.created_at
                            ? new Date(request.created_at).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="p-3">
                          {request.hod_approval_deadline
                            ? new Date(request.hod_approval_deadline).toLocaleString()
                            : "-"}
                        </td>

                        <td className="p-3">{request.reference_number ?? "-"}</td>

                        <td className="p-3">
                          {request.issued_at
                            ? new Date(request.issued_at).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="p-3">{request.print_count ?? 0}</td>

                        <td className="p-3">
                          <span
                            className={`
rounded-full
px-3
py-1
text-xs
font-semibold
shadow-sm
inline-flex
items-center
justify-center
whitespace-nowrap
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
                            <Button
                              size="sm"
                              variant="outline"

                              onClick={() => setSelectedRequest(request)}
                              className="rounded-lg
border
border-blue-200
bg-blue-50
px-4
py-2
text-sm
font-medium
text-blue-700
transition-colors
hover:bg-blue-100"
                            >
                              View
                            </Button>
                            {request.status === "PENDING_HOD_APPROVAL" &&
                              request.hod_mail_send_count < 2 &&
                              !(
                                request.hod_mail_send_count >= 1 &&
                                new Date() < new Date(request.hod_approval_deadline)
                              ) && (
                                <Button
                                  size="sm"
                                  onClick={() => sendHodApprovalMail(request)}
                                  className="
                                                       border
                                                            rounded-lg
bg-blue-500
px-4
py-2
text-sm
font-medium
text-white
hover:bg-blue-700
transition-colors
"
                                >
                                  {request.hod_mail_send_count > 0
                                    ? "Resend Approval Request"
                                    : "Request Approval"}
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}

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
