import { supabase } from "@/lib/supabase";

export const adminNocService = {

    async createPrintHistory(
        nocRequestId: string,
        actionType: string,
        reason: string | null = null
    ) {

        const {
            data: request,
            error: fetchError,
        } =
            await (supabase as any)
                .from("noc_requests")
                .select("*")
                .eq(
                    "noc_request_id",
                    nocRequestId
                )
                .single();

        if (fetchError) {
            throw fetchError;
        }

        const {
            data: historyRows,
        } =
            await (supabase as any)
                .from(
                    "noc_print_history"
                )
                .select(
                    "history_id"
                )
                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        const version =
            (historyRows?.length || 0) + 1;

        const {
            error,
        } =
            await (supabase as any)
                .from(
                    "noc_print_history"
                )
                .insert({
                    noc_request_id:
                        nocRequestId,

                    reference_number:
                        request.reference_number,

                    print_version:
                        version,

                    action_type:
                        actionType,

                    reason,

                    snapshot:
                        request.snapshot,

                    noc_customization:
                        request.noc_customization,
                });

        if (error) {
            throw error;
        }
    },

    async reprintNoc(
        nocRequestId: string,
        reason: string
    ) {

        await this.createPrintHistory(
            nocRequestId,
            "REPRINT",
            reason
        );

        const {
            data: request,
            error: fetchError,
        } =
            await (supabase as any)
                .from("noc_requests")
                .select("*")
                .eq(
                    "noc_request_id",
                    nocRequestId
                )
                .single();

        if (fetchError) {
            throw fetchError;
        }

        const {
            error,
        } =
            await (supabase as any)
                .from("noc_requests")
                .update({
                    status: "PENDING_PRINT",
                    printed_at: null,
                    reference_number: null,
                })
                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error) {
            throw error;
        }
    },

    async getRequests() {

        const {
            data,
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .select("*")

                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                );

        if (error)
            throw error;

        return data ?? [];

    },

    async moveToPendingPrint(
        nocRequestId: string
    ) {

        const {
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "PENDING_PRINT",

                    approval_source:
                        "ADMIN_OVERRIDE",

                    approved_at:
                        new Date()
                            .toISOString(),

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },

    async rejectRequest(
        nocRequestId: string,
        reason: string
    ) {

        const { error } =
            await (supabase as any)

                .from("noc_requests")

                .update({
                    status: "ADMIN_REJECTED",
                    rejection_reason: reason,
                    rejected_by: "ADMIN",
                    rejection_at: new Date().toISOString(),
                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },

    async rejectTenureCompletion(
        nocRequestId: string,
        reason: string
    ) {

        const { error } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "TENURE_REJECTED",

                    tenure_rejection_reason:
                        reason,

                    tenure_rejected_by:
                        "ADMIN",

                    tenure_rejected_at:
                        new Date()
                            .toISOString(),

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },

    async getByStatus(
        status: string
    ) {

        const {
            data,
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .select("*")

                .eq(
                    "status",
                    status
                )

                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                );

        if (error)
            throw error;

        return data ?? [];

    },

    async saveCustomization(
        nocRequestId: string,
        customization: any
    ) {

        const {
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    noc_customization:
                        customization,

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },

    async markPrinted(
        nocRequestId: string
    ) {

        const {
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "PRINTED",

                    printed_at:
                        new Date()
                            .toISOString(),

                    print_count:
                        1,

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

        await this.createPrintHistory(
            nocRequestId,
            "PRINT",
            "Initial Print"
        );

    },

    async markIssued(
        nocRequestId: string
    ) {

        const {
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "ISSUED",

                    issued_at:
                        new Date()
                            .toISOString(),

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },

    async markCancelled(
        nocRequestId: string
    ) {

        const {
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "CANCELLED",

                    cancelled_at:
                        new Date()
                            .toISOString(),

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },
    async saveReferenceNumber(
        nocRequestId: string,
        referenceNumber: string
    ) {

        const {
            data: existing,
            error: fetchError,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .select(
                    "reference_number"
                )

                .eq(
                    "noc_request_id",
                    nocRequestId
                )

                .single();

        if (fetchError)
            throw fetchError;

        if (
            existing?.reference_number
        ) {

            throw new Error(
                "Reference Number already locked."
            );

        }

        const {
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    reference_number:
                        referenceNumber,

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },

    async issueRequest(
        nocRequestId: string
    ) {

        const { error } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "ISSUED",

                    issued_at:
                        new Date()
                            .toISOString(),

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },

    async cancelRequest(
        nocRequestId: string,
        reason: string
    ) {

        const { error } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "CANCELLED",

                    cancelled_at:
                        new Date()
                            .toISOString(),

                    cancellation_reason:
                        reason,

                    cancelled_by:
                        "ADMIN",

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },

    async markCompletedTenure(
        nocRequestId: string
    ) {
        const now = new Date().toISOString();

        const {
            error,
        } =
            await (supabase as any)
                .from("noc_requests")
                .update({
                    status: "TENURE_COMPLETED",
                    completion_verified_at: now,
                    tenure_completed_at: now,
                })
                .eq("noc_request_id", nocRequestId);

        if (error) throw error;
    },

    async incrementPrintCount(
        nocRequestId: string
    ) {

        const {
            data,
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .select(
                    "print_count"
                )

                .eq(
                    "noc_request_id",
                    nocRequestId
                )

                .single();

        if (error)
            throw error;

        const currentCount =
            Number(
                data?.print_count ?? 0
            );

        const {
            error: updateError,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    print_count:
                        currentCount + 1,

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (updateError)
            throw updateError;

    },

    async approveTenureCompletion(
        nocRequestId: string
    ) {
        const {
            data: request,
            error: fetchError,
        } =
            await (supabase as any)
                .from("noc_requests")
                .select("*")
                .eq("noc_request_id", nocRequestId)
                .single();

        if (fetchError) throw fetchError;

        if (
            !request.completion_submitted_at ||
            !request.completion_certificate_url ||
            !request.completion_hr_email ||
            !request.completion_hr_contact
        ) {
            throw new Error("Completion details missing.");
        }

        const now = new Date().toISOString();

        const {
            error,
        } =
            await (supabase as any)
                .from("noc_requests")
                .update({
                    status: "TENURE_COMPLETED",
                    completion_verified_at: now,
                    tenure_completed_at: now,
                })
                .eq("noc_request_id", nocRequestId);

        if (error) throw error;
    },

    async getCompletedTenureAudit() {

        const {
            data,
            error,
        } =
            await (supabase as any)
                .from("noc_requests")
                .select("*")
                .eq(
                    "status",
                    "TENURE_COMPLETED"
                )
                .order(
                    "completion_verified_at",
                    {
                        ascending: false,
                    }
                );

        if (error)
            throw error;

        return data ?? [];

    },

    async getCertificateUrl(
        certificateValue: string
    ) {

        if (
            certificateValue.startsWith(
                "http"
            )
        ) {

            return certificateValue;

        }

        const {
            data,
            error,
        } =
            await supabase.storage

                .from(
                    "noc-completion-documents"
                )

                .createSignedUrl(
                    certificateValue,
                    60 * 60
                );

        if (error)
            throw error;

        return data.signedUrl;

    },

    async getPrintHistory() {

    const {
        data,
        error,
    } =
        await (supabase as any)

            .from(
                "noc_print_history"
            )

            .select("*")

            .order(
                "created_at",
                {
                    ascending: false,
                }
            );

    if (error)
        throw error;

    return data ?? [];

}

};