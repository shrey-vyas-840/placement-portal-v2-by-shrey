import { supabase } from "@/lib/supabase";

export const adminNocService = {

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
                        "HOD_REJECTED",

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
        nocRequestId: string
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

        const {
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "COMPLETED_TENURE",

                    tenure_completed_at:
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
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .update({

                    status:
                        "TENURE_COMPLETED",

                    completion_verified_at:
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

    async rejectTenureCompletion(
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

                    completion_submitted_at:
                        null,

                })

                .eq(
                    "noc_request_id",
                    nocRequestId
                );

        if (error)
            throw error;

    },
    

};