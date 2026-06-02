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

};