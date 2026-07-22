import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { ExportCenter } from "@/components/export/ExportCenter";

import { recruitmentRegisterExportService } from "@/services/recruitmentRegisterExportService";

import { buildRecruitmentRegisterExportConfiguration } from "@/services/recruitment/recruitmentRegisterExportConfig";

interface RecruitmentRegisterExportDialogProps {
    open: boolean;

    onOpenChange: (open: boolean) => void;
}

export default function RecruitmentRegisterExportDialog({
    open,
    onOpenChange,
}: RecruitmentRegisterExportDialogProps) {

    const [loading, setLoading] = useState(false);

    const [configuration, setConfiguration] = useState<any>();

    useEffect(() => {
        if (!open) return;

        void loadExport();
    }, [open]);

    async function loadExport() {
        try {

            setLoading(true);

            const dataset =
                await recruitmentRegisterExportService.getRecruitmentRegisterExportData();

            setConfiguration(
                buildRecruitmentRegisterExportConfiguration(dataset),
            );

        } finally {

            setLoading(false);

        }
    }

    if (loading || !configuration) {

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-7xl h-[92vh] overflow-hidden p-0">

                    <DialogHeader>
                        <DialogTitle>
                            Recruitment Register Export
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex h-96 items-center justify-center">
                        Loading export...
                    </div>

                </DialogContent>
            </Dialog>
        );

    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl h-[92vh] overflow-hidden p-0">

                <DialogHeader>

                    <DialogTitle>
                        Recruitment Register Export
                    </DialogTitle>

                </DialogHeader>

                <ExportCenter configuration={configuration} />

            </DialogContent>
        </Dialog>
    );

}