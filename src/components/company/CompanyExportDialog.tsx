import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

interface CompanyExportDialogProps {

    open: boolean;

    onOpenChange: (open: boolean) => void;

    totalCompanies: number;

}

export function CompanyExportDialog({

    open,

    onOpenChange,

    totalCompanies,

}: CompanyExportDialogProps) {

    const [additionalRecruiters, setAdditionalRecruiters] =
        useState(0);

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent className="max-w-5xl">

                <DialogHeader>

                    <DialogTitle>

                        Company Export Center

                    </DialogTitle>

                </DialogHeader>

                <div className="grid gap-6 lg:grid-cols-3">

                    <div className="rounded-2xl border bg-card p-6">

                        <h2 className="text-xl font-semibold">

                            Export Summary

                        </h2>

                        <div className="mt-6 space-y-4">

                            <div className="flex justify-between">

                                <span className="text-muted-foreground">

                                    Companies

                                </span>

                                <span className="font-medium">

                                    {totalCompanies}

                                </span>

                            </div>

                            <div className="flex justify-between">

                                <span className="text-muted-foreground">

                                    Additional Recruiters

                                </span>

                                <input
                                    type="number"
                                    min={0}
                                    value={additionalRecruiters}
                                    onChange={(e) =>
                                        setAdditionalRecruiters(
                                            Number(e.target.value),
                                        )
                                    }
                                    className="w-20 rounded-lg border px-2 py-1 text-right"
                                />

                            </div>

                        </div>

                        <div className="mt-8">

                            <Button
                                disabled
                                className="w-full"
                            >

                                Export Excel

                            </Button>

                        </div>

                    </div>

                    <div className="lg:col-span-2 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">

                        Column selector, drag & drop ordering and preview
                        will be added in the next step.

                    </div>

                </div>

            </DialogContent>

        </Dialog>

    );

}