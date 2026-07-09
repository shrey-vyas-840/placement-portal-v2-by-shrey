import { supabase } from "@/lib/supabase";
import { generateUuid } from "@/lib/generateUuid";
export const NOC_TYPES = [
  "On Campus Internship + PPO",

  "On Campus Internship",

  "On Campus Placement",

  "Off Campus Internship + PPO",

  "Off Campus Internship",

  "Off Campus Placement",
] as const;

export const NOC_STATUSES = {
  PENDING_HOD_APPROVAL: "PENDING_HOD_APPROVAL",

  HOD_REJECTED: "HOD_REJECTED",

  ADMIN_REJECTED: "ADMIN_REJECTED",

  PENDING_PRINT: "PENDING_PRINT",

  PRINTED: "PRINTED",

  ISSUED: "ISSUED",

  CANCELLED: "CANCELLED",

  COMPLETED_TENURE_PENDING_VERIFICATION: "COMPLETED_TENURE_PENDING_VERIFICATION",

  TENURE_REJECTED: "TENURE_REJECTED",

  TENURE_COMPLETED: "TENURE_COMPLETED",
} as const;

export type NocType = (typeof NOC_TYPES)[number];

export const nocService = {
  async getStudentProfileSnapshot(studentId: string) {
    const { data: profile, error: profileError } = await (supabase as any)

      .from("student_master")

      .select("*")

      .eq("student_id", studentId)

      .single();

    if (profileError) throw profileError;

    const { data: academics } = await (supabase as any)

      .from("student_academic_details")

      .select("*")

      .eq("student_id", studentId)

      .maybeSingle();

    return {
      student_id: studentId,

      student_name: `${profile.first_name ?? ""}
                 ${profile.middle_name ?? ""}
                 ${profile.last_name ?? ""}`
        .replace(/\s+/g, " ")
        .trim(),

      enrollment_no: profile.enrollment_no,

      institute_email: profile.institute_email,

      institute_name: academics?.current_institute_name,

      course: academics?.current_degree_level,

      semester: academics?.current_semester,

      branch: academics?.current_branch_name,
    };
  },

  async createRequest(
    studentId: string,
    payload: {
      noc_type: string;
      start_date: string;
      end_date: string;
      company_name: string;
      company_address_1: string;
      company_address_2: string;
      hr_prefix: string;
      hr_name: string;
      hr_position: string;
      opportunity_mode: string;
    },
  ) {
    const snapshot = await this.getStudentProfileSnapshot(studentId);

    const { data: hod } = await (supabase as any)
      .from("branch_hod_mapping")
      .select("*")
      .eq("branch_name", snapshot.branch)
      .eq("is_active", true)
      .maybeSingle();

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 36);

    const finalSnapshot = {
      ...snapshot,
      noc_type: payload.noc_type,
      opportunity_mode: payload.opportunity_mode,
      start_date: payload.start_date,
      end_date: payload.end_date,
      company_name: payload.company_name,
      company_address_1: payload.company_address_1,
      company_address_2: payload.company_address_2,
      hr_prefix: payload.hr_prefix,
      hr_name: payload.hr_name,
      hr_position: payload.hr_position,
    };

    const hodEmail = (hod?.hod_email ?? "shrey36870@gmail.com").trim().toLowerCase();

    const { data, error } = await (supabase as any)
      .from("noc_requests")
      .insert({
        student_id: studentId,
        noc_type: payload.noc_type,
        hod_email: hodEmail,
        status: "PENDING_HOD_APPROVAL",
        snapshot: finalSnapshot,
        hod_approval_deadline: deadline.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const approvalToken = generateUuid();

    const { error: tokenError } = await (supabase as any).from("noc_approval_tokens").upsert(
      {
        noc_request_id: data.noc_request_id,
        token: approvalToken,
        expires_at: deadline.toISOString(),
        used_at: null,
        action: "HOD_REVIEW",
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "noc_request_id",
      },
    );

    if (tokenError) throw tokenError;

    const reviewUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/hod/review/${approvalToken}`
        : `/hod/review/${approvalToken}`;

    return {
      ...data,
      hod_review_token: approvalToken,
      hod_review_url: reviewUrl,
    };
  },

  async getStudentRequests(studentId: string) {
    const { data, error } = await (supabase as any)

      .from("noc_requests")

      .select("*")

      .eq("student_id", studentId)

      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data ?? [];
  },

  async hasActiveNoc(studentId: string) {
    const { data, error } = await (supabase as any)

      .from("noc_requests")

      .select("*")

      .eq("student_id", studentId);

    if (error) throw error;

    const today = new Date();

    const blockingRequest = (data ?? []).find((request: any) => {
      const endDate = new Date(request.snapshot?.end_date);

      const expiredIssuedWithoutSubmission =
        request.status === "ISSUED" && endDate <= today && !request.completion_submitted_at;

      return (
        expiredIssuedWithoutSubmission ||
        request.status === "COMPLETED_TENURE_PENDING_VERIFICATION" ||
        request.status === "TENURE_REJECTED"
      );
    });

    return blockingRequest ?? null;
  },

  async uploadCompletionCertificate(file: File) {
    const fileExt = file.name.split(".").pop() || "pdf";

    const fileName = `${generateUuid()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("noc-completion-documents")
      .upload(fileName, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) throw error;

    // Private bucket: store the object path, not a public URL.
    return fileName;
  },

  async submitCompletionDetails(
    nocRequestId: string,

    payload: {
      completion_certificate_url: string;

      completion_hr_email: string;

      completion_hr_contact: string;

      completion_same_hr: boolean;

      completion_hr_name: string;

      completion_hr_designation: string;
    },
  ) {
    const { error } = await (supabase as any)

      .from("noc_requests")

      .update({
        ...payload,

        status: "COMPLETED_TENURE_PENDING_VERIFICATION",

        completion_submitted_at: new Date().toISOString(),

        tenure_rejection_reason: null,

        tenure_rejected_by: null,

        tenure_rejected_at: null,
      })

      .eq("noc_request_id", nocRequestId);

    if (error) throw error;
  },

  async getCertificateUrl(certificateValue: string) {
    if (!certificateValue) {
      return "";
    }

    // Keep backward compatibility with old rows that may already store a full URL.
    if (certificateValue.startsWith("http")) {
      return certificateValue;
    }

    const { data, error } = await supabase.storage
      .from("noc-completion-documents")
      .createSignedUrl(certificateValue, 60 * 60);

    if (error) throw error;

    return data.signedUrl;
  },

  async regenerateHodToken(nocRequestId: string) {
    const token = generateUuid();

    const { data: request, error: requestError } = await (supabase as any)

      .from("noc_requests")

      .select(
        `
    hod_approval_deadline,
    status
    `,
      )

      .eq("noc_request_id", nocRequestId)

      .single();

    if (request.status !== "PENDING_HOD_APPROVAL") {
      throw new Error("Approval process already completed.");
    }

    const { error } = await (supabase as any)

      .from("noc_approval_tokens")

      .upsert(
        {
          noc_request_id: nocRequestId,

          token,

          expires_at: request.hod_approval_deadline,

          used_at: null,

          action: "HOD_REVIEW",

          created_at: new Date().toISOString(),
        },
        {
          onConflict: "noc_request_id",
        },
      );

    if (error) throw error;

    return token;
  },

  async markHodMailSent(nocRequestId: string) {
    const { data, error } = await (supabase as any)

      .from("noc_requests")

      .select("hod_mail_send_count")

      .eq("noc_request_id", nocRequestId)

      .single();

    if (error) throw error;

    await (supabase as any)

      .from("noc_requests")

      .update({
        hod_mail_sent_at: new Date().toISOString(),

        hod_mail_send_count: (data?.hod_mail_send_count ?? 0) + 1,
      })

      .eq("noc_request_id", nocRequestId);
  },
};
