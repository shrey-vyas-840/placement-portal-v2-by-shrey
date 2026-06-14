import { useEffect, useState } from "react";
import { adminOpportunityService } from "@/services/adminOpportunityService";
import { NOC_EMAIL_CONFIG } from "@/config/hodMapping";

type OpportunityMailWorkspaceModalProps = {
    open: boolean;
    opportunityId: string | null;
    onClose: () => void;
};

export function OpportunityMailWorkspaceModal({
    open,
    opportunityId,
    onClose,
}: OpportunityMailWorkspaceModalProps) {

    const [
        mailWorkspaceOpportunity,
        setMailWorkspaceOpportunity,
    ] = useState<any>(null);

    const [
        mailWorkspaceDraft,
        setMailWorkspaceDraft,
    ] = useState<any>(null);

    const [
        mailWorkspaceLoading,
        setMailWorkspaceLoading,
    ] = useState(false);

    const [
        mailWorkspaceAttachJD,
        setMailWorkspaceAttachJD,
    ] = useState(false);

    const [
        mailWorkspaceAttachFiles,
        setMailWorkspaceAttachFiles,
    ] = useState(false);

    const [
        mailWorkspaceUrgent,
        setMailWorkspaceUrgent,
    ] = useState(true);

    const [
        mailWorkspaceHighlightPPO,
        setMailWorkspaceHighlightPPO,
    ] = useState(true);

    const [
        mailWorkspaceSpecialInstruction,
        setMailWorkspaceSpecialInstruction,
    ] = useState("");

    const [
        mailWorkspaceCompanyConversation,
        setMailWorkspaceCompanyConversation,
    ] = useState("");

    const [
        mailWorkspaceBody,
        setMailWorkspaceBody,
    ] = useState("");

    const [
        mailWorkspaceRecipientsFetched,
        setMailWorkspaceRecipientsFetched,
    ] = useState(false);

    const [
        mailWorkspaceRecipientPayload,
        setMailWorkspaceRecipientPayload,
    ] = useState<any>(null);

    const [
        mailWorkspaceCompanyLogoUrl,
        setMailWorkspaceCompanyLogoUrl,
    ] = useState<string | null>(null);

    const [
        mailWorkspaceCompanyDescription,
        setMailWorkspaceCompanyDescription,
    ] = useState("");

    const [
        mailWorkspaceCompanyWebsite,
        setMailWorkspaceCompanyWebsite,
    ] = useState("");

    const [
        mailWorkspaceCompanyLocation,
        setMailWorkspaceCompanyLocation,
    ] = useState("");

    const [
        mailWorkspaceLowestPackage,
        setMailWorkspaceLowestPackage
    ] = useState<number | null>(null);

    const [
        mailWorkspaceHighestPackage,
        setMailWorkspaceHighestPackage
    ] = useState<number | null>(null);

    const [
        mailWorkspaceBondYears,
        setMailWorkspaceBondYears
    ] = useState<number | null>(null);

    const [
        mailWorkspaceDriveType,
        setMailWorkspaceDriveType
    ] = useState("");

    const [
        mailWorkspaceDriveMode,
        setMailWorkspaceDriveMode
    ] = useState("");

    const [
        mailWorkspaceIndustryType,
        setMailWorkspaceIndustryType
    ] = useState("");

    const [
        mailWorkspaceCompanySize,
        setMailWorkspaceCompanySize
    ] = useState("");

    const [mailWorkspaceStipendEnabled, setMailWorkspaceStipendEnabled] = useState(false);
    const [mailWorkspaceStipendAmount, setMailWorkspaceStipendAmount] = useState("");

    const [mailWorkspacePpoEnabled, setMailWorkspacePpoEnabled] = useState(false);

    const MAX_AUTO_BCC = 500;

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    function normalizeMailBody(input: string) {

        return input

            // remove html tags except mark
            .replace(/<\/?(?!mark\b)[^>]+>/gi, "")

            // remove markdown headings only
            .replace(/^#{1,6}\s+/gm, "")

            .replace(/#/g, "")
            .replace(/\*/g, "")
            .replace(/\**/g, "")
            .replace(/\##/g, "")

            // remove code blocks
            .replace(/`{1,3}/g, "")

            // keep bullet points
            .replace(/^\s*[-*]\s+/gm, "• ")

            // collapse spacing
            .replace(/\n{3,}/g, "\n\n")

            .trim();
    }

    async function openMailWorkspace(opportunity: any) {
        setMailWorkspaceLoading(true);

        try {
            const workspace: any =
                await adminOpportunityService
                    .getOpportunityMailWorkspace(
                        opportunity.opportunity_id
                    );

            setMailWorkspaceOpportunity(workspace);
            setMailWorkspaceCompanyConversation("");

            setMailWorkspaceCompanyLogoUrl(
                workspace.companyLogoUrl || null
            );

            setMailWorkspaceCompanyDescription(
                workspace.companyDescription || ""
            );

            setMailWorkspaceCompanyWebsite(
                workspace.companyWebsite || ""
            );

            setMailWorkspaceCompanyLocation(
                workspace.companyLocation || ""
            );

            setMailWorkspaceLowestPackage(
                workspace.lowestPackage ?? null
            );

            setMailWorkspaceHighestPackage(
                workspace.highestPackage ?? null
            );

            setMailWorkspaceBondYears(
                workspace.bondYears ?? null
            );

            setMailWorkspaceDriveType(
                workspace.driveType || ""
            );

            setMailWorkspaceDriveMode(
                workspace.driveMode || ""
            );

            setMailWorkspaceIndustryType(
                workspace.industryType || ""
            );

            setMailWorkspaceCompanySize(
                workspace.companySize || ""
            );

            setMailWorkspaceDraft({
                opportunity_id:
                    workspace.opportunity.opportunity_id,
                opportunity_title:
                    workspace.opportunity.opportunity_title || "",
                opportunity_description:
                    workspace.opportunity.opportunity_description || "",
                application_end_date:
                    workspace.opportunity.application_end_date
                        ? new Date(
                            workspace.opportunity.application_end_date
                        )
                            .toISOString()
                            .slice(0, 16)
                        : "",
            });

            setMailWorkspaceAttachJD(false);
            setMailWorkspaceAttachFiles(false);
            setMailWorkspaceUrgent(true);
            setMailWorkspaceHighlightPPO(true);
            setMailWorkspaceSpecialInstruction("");
            setMailWorkspaceBody("");
            setMailWorkspaceRecipientsFetched(false);
            setMailWorkspaceRecipientPayload(null);

            setMailWorkspaceStipendEnabled(false);
            setMailWorkspaceStipendAmount("");
            setMailWorkspacePpoEnabled(false);
        } finally {
            setMailWorkspaceLoading(false);
        }
    }

    async function saveWorkspaceChanges() {

        if (
            !mailWorkspaceDraft ||
            !mailWorkspaceOpportunity
        ) {
            return;
        }

        try {

            await adminOpportunityService.updateOpportunity(
                mailWorkspaceOpportunity.opportunity.opportunity_id,
                {
                    opportunity_title:
                        mailWorkspaceDraft.opportunity_title,

                    opportunity_description:
                        mailWorkspaceDraft.opportunity_description,

                    application_end_date:
                        new Date(
                            mailWorkspaceDraft.application_end_date
                        ).toISOString(),
                }
            );

            alert(
                "Opportunity updated successfully."
            );

            await openMailWorkspace({
                opportunity_id:
                    mailWorkspaceOpportunity.opportunity.opportunity_id,
            });

        } catch (error) {

            console.error(error);

            alert(
                "Failed to update opportunity."
            );

        }
    }

    async function fetchRecipientsFromWorkspace() {

        if (
            !mailWorkspaceOpportunity
        ) {
            return;
        }

        try {

            const workspace: any =
                await adminOpportunityService
                    .getOpportunityMailWorkspace(
                        mailWorkspaceOpportunity.opportunity.opportunity_id
                    );

            setMailWorkspaceRecipientPayload({
                studentEmails:
                    workspace.studentEmails || [],

                hodEmails:
                    workspace.hodEmails || [],
            });

            setMailWorkspaceRecipientsFetched(
                true
            );

        } catch (error) {

            console.error(error);

            alert(
                "Failed to fetch recipients."
            );

        }
    }

    function buildMailPrompt() {
        if (
            !mailWorkspaceOpportunity ||
            !mailWorkspaceDraft
        ) {
            return "";
        }

        const companyName =
            mailWorkspaceOpportunity.opportunity.company_name ||
            "Company";

        const roleName =
            mailWorkspaceDraft.opportunity_title ||
            mailWorkspaceOpportunity.opportunity.drive_name ||
            "Role";

        const companyDescription =
            mailWorkspaceCompanyDescription.trim();

        const companyWebsite =
            mailWorkspaceCompanyWebsite.trim();

        const companyLocation =
            mailWorkspaceCompanyLocation.trim();

        const industryType =
            mailWorkspaceIndustryType.trim();

        const companySize =
            mailWorkspaceCompanySize.trim();

        const driveType =
            mailWorkspaceDriveType.trim();

        const driveMode =
            mailWorkspaceDriveMode.trim();

        const deadlineText =
            mailWorkspaceDraft.application_end_date
                ?
                new Date(
                    mailWorkspaceDraft.application_end_date
                ).toLocaleString()
                :
                "Not specified";

        const packageParts = [
            mailWorkspaceLowestPackage != null
                ? `${mailWorkspaceLowestPackage} LPA`
                : "",
            mailWorkspaceHighestPackage != null
                ? `${mailWorkspaceHighestPackage} LPA`
                : "",
        ].filter(Boolean);

        const packageText =
            packageParts.length
                ? packageParts.join(" - ")
                : "";

        const bondYearsText =
            mailWorkspaceBondYears != null
                ? `${mailWorkspaceBondYears} Years`
                : "";

        const stipendLine =
            mailWorkspaceStipendEnabled &&
                mailWorkspaceStipendAmount.trim()
                ? `- Stipend: ${mailWorkspaceStipendAmount.trim()}`
                : "";

        const ppoLine =
            mailWorkspacePpoEnabled
                ? "- PPO Opportunity: Mention only if explicitly available."
                : "";

        const institutes =
            mailWorkspaceOpportunity.eligibility.allowedInstitutes.join(", ");

        const degrees =
            mailWorkspaceOpportunity.eligibility.allowedDegrees.join(", ");

        const branches =
            mailWorkspaceOpportunity.eligibility.allowedBranches.join(", ");

        const batches =
            mailWorkspaceOpportunity.eligibility.allowedBatches.join(", ");

        const specialInstruction =
            mailWorkspaceSpecialInstruction.trim() || "None";

        const companyConversation =
            mailWorkspaceCompanyConversation.trim();

        const registrationPortalUrl =
            "Student Opportunity Portal";

        // const registrationPortalUrl =
        //     `${window.location.origin}/student/opportunities`;

        const companyProfileBlock = [
            `Company Name: ${companyName}`,

            companyWebsite
                ? `Official Website: ${companyWebsite}`
                : "",

            industryType
                ? `Industry Type: ${industryType}`
                : "",

            companyLocation
                ? `Hiring Location: ${companyLocation}`
                : "",

            companySize
                ? `Company Size: ${companySize}`
                : "",
        ]
            .filter(Boolean)
            .join("\n");

        const jobRoleBlock = [
            `- Role: ${roleName}`,
            driveType ? `- Drive Type: ${driveType}` : "",
            driveMode ? `- Drive Mode: ${driveMode}` : "",
        ]
            .filter(Boolean)
            .join("\n");

        const compensationBlock = [
            packageText ? `- Package: ${packageText}` : "",
            stipendLine,
        ]
            .filter(Boolean)
            .join("\n");

        const internshipBlock = [
            ppoLine,
        ]
            .filter(Boolean)
            .join("\n");

        const eligibilityBlock = [
            `- Institutes: ${institutes}`,
            `- Degrees: ${degrees}`,
            `- Branches: ${branches}`,
            `- Passing Batches: ${batches}`,
            `- Minimum CGPA: ${mailWorkspaceOpportunity?.eligibility.minimumCgpa}`,
            `- Maximum Backlogs: ${mailWorkspaceOpportunity?.eligibility.maximumActiveBacklogs}`,
        ].join("\n");

        const importantNotesBlock = [

            mailWorkspaceAttachJD
                ? "- JD will be attached by admin."
                : "",
            mailWorkspaceAttachFiles
                ? "- Additional files will be attached by admin."
                : "",

            "- Do not use markdown headings (#, ##, ###).",
            "- Do not invent missing information.",
            "- Omit any unavailable line completely.",
            "- Do not include Selection Process unless the Special Instruction explicitly asks for it.",
        ]
            .filter(Boolean)
            .join("\n");

        return `
STRICT REQUIREMENTS:

Generate an official placement email.
You are an experienced Indian University Training & Placement Officer.
Use natural professional language.
Use the style commonly used by Indian universities such as Nirma University, PDEU, DAIICT, Indus University, LDCE, NITs and IITs.
The email should feel written by a Training & Placement Cell officer.
Use complete sentences where appropriate.
Use bullets only where useful.
Do not sound like HR.
Do not sound like marketing content.
Do not sound like AI generated content.
Company Website:
${companyWebsite || "Not Available"}
Company Background Source:
Use the company website and company conversation if available.
If website is available, generate a short factual company introduction before the Company Profile section.
Do not invent hiring details.
Final Starting structure should look like - starting with exact format mentioned below then a short description of the company, use the provided website or conversation pasted (if any) to generate description, then leave space for company logo then company profile then other sections as mentioned
keep the heading of the sections bold
Company Description should be 4-7 lines maximum.
Do not invent salary, eligibility, stipend, bond, registration deadline or hiring information.
Only enrich general company background.
Only use factual information for those fields.
Generate only the final email body.
Email must end exactly with:
Regards,
Training & Placement Cell
NOT
Training & Placement Cell, IITE
NOT
Training & Placement Cell, Indus University
Just:
Training & Placement Cell

Use this exact format and section order if the data is available:

Dear Students,
Greetings!!!

We are pleased to share that ${companyName} is aligned for a placement / internship opportunity.

Company Profile:
${companyProfileBlock}

Job Role:
${jobRoleBlock}

Compensation Details:
${compensationBlock || "- Omit this section if no compensation data is available."}

Internship Details:
${internshipBlock || "- Omit this section if no internship-specific details are available."}

Eligibility Criteria:
${eligibilityBlock}

Registration Process:
Students should apply through:
${registrationPortalUrl}

Important Notes:
${importantNotesBlock}

Special Instruction:
${specialInstruction}

Company Conversation:
${companyConversation || "None"}

Generate only the final email body.
    `;
    }


    function buildSubjectLine() {
        if (
            !mailWorkspaceOpportunity ||
            !mailWorkspaceDraft
        ) {
            return "";
        }

        const company =
            mailWorkspaceOpportunity.opportunity.company_name ||
            "Company";

        const role =
            mailWorkspaceDraft.opportunity_title ||
            mailWorkspaceOpportunity.opportunity.drive_name ||
            "Role";

        const packageParts = [
            mailWorkspaceLowestPackage != null
                ? `${mailWorkspaceLowestPackage} LPA`
                : "",
            mailWorkspaceHighestPackage != null
                ? `${mailWorkspaceHighestPackage} LPA`
                : "",
        ].filter(Boolean);

        const packageText =
            packageParts.length
                ? packageParts.join(" - ")
                : "";

        const deadline =
            mailWorkspaceDraft.application_end_date
                ?
                new Date(
                    mailWorkspaceDraft.application_end_date
                ).toLocaleString()
                :
                "";

        const locationText =
            mailWorkspaceCompanyLocation.trim()
                ? ` || Location: ${mailWorkspaceCompanyLocation.trim()}`
                : "";

        const prefix =
            mailWorkspaceUrgent
                ? "Urgent: Job Opportunity"
                : "Job Opportunity";

        return `${prefix} || Company: ${company}${locationText} || Role: ${role}${packageText ? ` || Package: ${packageText}` : ""} || Registration Deadline: ${deadline}`;
    }


    function buildMailPackage() {
        const body =
            normalizeMailBody(mailWorkspaceBody);

        if (
            !mailWorkspaceRecipientPayload ||
            !body
        ) {
            return null;
        }

        const studentEmails =
            mailWorkspaceRecipientPayload.studentEmails || [];

        const shouldAutoFillBcc =
            studentEmails.length <= MAX_AUTO_BCC;

        const to =
            NOC_EMAIL_CONFIG.PLACEMENT_CELL_EMAIL;

        const cc = [
            NOC_EMAIL_CONFIG.DEPUTY_TNP_EMAIL,
            ...(mailWorkspaceRecipientPayload.hodEmails || [])
        ]
            .filter(Boolean)
            .join(", ");

        const bcc =
            shouldAutoFillBcc
                ? studentEmails.join(", ")
                : "";

        return {
            to,
            cc,
            bcc,
            subject:
                buildSubjectLine(),
            body,
            studentEmails,
            hodEmails:
                mailWorkspaceRecipientPayload.hodEmails || [],
            shouldAutoFillBcc,
        };
    }


    async function copyStudentEmails() {

        const emails =
            mailWorkspaceRecipientPayload?.studentEmails || [];

        await navigator.clipboard.writeText(
            emails.join(", ")
        );

        alert(
            `${emails.length} student emails copied.`
        );
    }

    async function copyHodEmails() {

        const emails =
            mailWorkspaceRecipientPayload?.hodEmails || [];

        await navigator.clipboard.writeText(
            emails.join(", ")
        );

        alert(
            `${emails.length} HOD emails copied.`
        );
    }

    async function copyMailPackage() {
        const mail = buildMailPackage();
        if (!mail) {
            alert("Paste the final ChatGPT mail body first.");
            return;
        }

        await navigator.clipboard.writeText(
            [
                `TO: ${mail.to}`,
                `CC: ${mail.cc}`,
                `BCC: ${mail.studentEmails.join(", ")}`,
                `SUBJECT: ${mail.subject}`,
                "",
                mail.body,
            ].join("\n")
        );

        alert("Mail package copied.");
    }

    function openGmailDraft() {

        const mail = buildMailPackage();

        if (!mail) {
            alert("Paste the final ChatGPT mail body first.");
            return;
        }

        const gmailUrl =
            `https://mail.google.com/mail/?view=cm&fs=1` +
            `&to=${encodeURIComponent(mail.to)}` +
            `&cc=${encodeURIComponent(mail.cc)}` +
            `&bcc=${encodeURIComponent(mail.bcc)}` +
            `&su=${encodeURIComponent(mail.subject)}`;

        window.open(
            gmailUrl,
            "_blank",
            "noopener,noreferrer"
        );

        navigator.clipboard.writeText(mail.body);

        alert(
            "Gmail draft opened. Mail body copied to clipboard. Paste it into Gmail."
        );
    }

    useEffect(() => {

        if (!open || !opportunityId) {
            return;
        }

        openMailWorkspace({
            opportunity_id: opportunityId,
        });

    }, [open, opportunityId]);

    if (!open) {
        return null;
    }
    if (
        !mailWorkspaceLoading &&
        !mailWorkspaceOpportunity
    ) {
        return (
            <div className="p-6">
                Loading workspace...
            </div>
        );
    }
    return (
        <div
            className="
fixed inset-0 z-[9999]
bg-black/50
flex items-center justify-center
p-4
"
        >
            <div
                className="
bg-white
w-full
max-w-7xl
max-h-[95vh]
overflow-y-auto
rounded-lg
p-6
"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold">
                            Opportunity Mail Workspace
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create prompt, send to ChatGPT, paste the final mail body, then generate recipients.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="rounded border px-3 py-1"
                        onClick={() => {
                            setMailWorkspaceOpportunity(null);
                            setMailWorkspaceDraft(null);
                            setMailWorkspaceBody("");
                            setMailWorkspaceRecipientsFetched(false);
                            setMailWorkspaceRecipientPayload(null);

                            setMailWorkspaceCompanyLogoUrl(null);
                            setMailWorkspaceCompanyDescription("");
                            setMailWorkspaceCompanyWebsite("");
                            setMailWorkspaceCompanyLocation("");

                            setMailWorkspaceLowestPackage(null);
                            setMailWorkspaceHighestPackage(null);
                            setMailWorkspaceBondYears(null);
                            setMailWorkspaceDriveType("");
                            setMailWorkspaceDriveMode("");
                            setMailWorkspaceIndustryType("");
                            setMailWorkspaceCompanySize("");

                            setMailWorkspaceStipendEnabled(false);
                            setMailWorkspaceStipendAmount("");
                            setMailWorkspacePpoEnabled(false);
                            setMailWorkspaceCompanyConversation("");
                            onClose();
                        }}
                    >
                        Close
                    </button>
                </div>

                {
                    mailWorkspaceLoading ? (
                        <div className="mt-6 rounded border p-4">
                            Loading workspace...
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                                <div className="rounded border p-4 space-y-3">
                                    <h3 className="font-semibold">
                                        Temporary Opportunity Info
                                    </h3>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium">
                                            Opportunity Title
                                        </label>
                                        <input
                                            className="w-full rounded border px-3 py-2"
                                            value={mailWorkspaceDraft?.opportunity_title || ""}
                                            onChange={(e) =>
                                                setMailWorkspaceDraft({
                                                    ...mailWorkspaceDraft,
                                                    opportunity_title: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium">
                                            Opportunity Description
                                        </label>
                                        <textarea
                                            rows={10}
                                            className="w-full rounded border px-3 py-2"
                                            value={mailWorkspaceDraft?.opportunity_description || ""}
                                            onChange={(e) =>
                                                setMailWorkspaceDraft({
                                                    ...mailWorkspaceDraft,
                                                    opportunity_description: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium">
                                            Application Deadline
                                        </label>
                                        <input
                                            type="datetime-local"
                                            className="w-full rounded border px-3 py-2"
                                            value={mailWorkspaceDraft?.application_end_date || ""}
                                            onChange={(e) =>
                                                setMailWorkspaceDraft({
                                                    ...mailWorkspaceDraft,
                                                    application_end_date: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="rounded border px-4 py-2"
                                        onClick={saveWorkspaceChanges}
                                    >
                                        Save Changes To Database
                                    </button>
                                </div>

                                <div className="rounded border p-4 space-y-3">
                                    <h3 className="font-semibold">
                                        Eligibility Snapshot
                                    </h3>

                                    <div className="text-sm">
                                        <div>
                                            Institutes:{" "}
                                            <b>
                                                {mailWorkspaceOpportunity?.eligibility?.allowedInstitutes.length
                                                    ? mailWorkspaceOpportunity.eligibility.allowedInstitutes.join(", ")
                                                    : "All"}
                                            </b>
                                        </div>
                                        <div>
                                            Degrees:{" "}
                                            <b>
                                                {mailWorkspaceOpportunity?.eligibility?.allowedDegrees?.length
                                                    ? mailWorkspaceOpportunity.eligibility.allowedDegrees.join(", ")
                                                    : "All"}
                                            </b>
                                        </div>
                                        <div>
                                            Branches:{" "}
                                            <b>
                                                {mailWorkspaceOpportunity?.eligibility?.allowedBranches?.length
                                                    ? mailWorkspaceOpportunity.eligibility.allowedBranches.join(", ")
                                                    : "All"}
                                            </b>
                                        </div>
                                        <div>
                                            Batches:{" "}
                                            <b>
                                                {mailWorkspaceOpportunity?.eligibility?.allowedBatches?.length
                                                    ? mailWorkspaceOpportunity.eligibility.allowedBatches.join(", ")
                                                    : "All"}
                                            </b>
                                        </div>
                                        <div>
                                            Minimum CGPA:{" "}
                                            <b>
                                                {mailWorkspaceOpportunity?.eligibility?.minimumCgpa ?? "-"}
                                            </b>
                                        </div>
                                        <div>
                                            Max Backlogs:{" "}
                                            <b>
                                                {mailWorkspaceOpportunity?.eligibility?.maximumActiveBacklogs ?? "-"}
                                            </b>
                                        </div>
                                    </div>

                                    <div className="rounded bg-slate-50 p-3 text-sm">
                                        Eligible Students:{" "}
                                        <b>{mailWorkspaceOpportunity?.eligibleStudents?.length ?? 0}</b>
                                        <br />{" "}
                                        HOD CC Emails:{" "}
                                        <b>{mailWorkspaceOpportunity?.hodEmails?.length ?? 0}</b>
                                    </div>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 rounded border p-3">
                                <input
                                    type="checkbox"
                                    checked={mailWorkspaceStipendEnabled}
                                    onChange={(e) => setMailWorkspaceStipendEnabled(e.target.checked)}
                                />
                                Add Internship / Apprenticeship Stipend
                            </label>

                            {mailWorkspaceStipendEnabled ? (
                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Stipend Amount
                                    </label>
                                    <input
                                        className="w-full rounded border px-3 py-2"
                                        value={mailWorkspaceStipendAmount}
                                        onChange={(e) => setMailWorkspaceStipendAmount(e.target.value)}
                                        placeholder="e.g. 15000 per month"
                                    />
                                </div>
                            ) : null}

                            <label className="flex items-center gap-2 rounded border p-3">
                                <input
                                    type="checkbox"
                                    checked={mailWorkspacePpoEnabled}
                                    onChange={(e) => setMailWorkspacePpoEnabled(e.target.checked)}
                                />
                                PPO Opportunity Available
                            </label>

                            <div className="mt-6 rounded border p-4 space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <label className="flex items-center gap-2 rounded border p-3">
                                        <input
                                            type="checkbox"
                                            checked={mailWorkspaceAttachJD}
                                            onChange={(e) =>
                                                setMailWorkspaceAttachJD(e.target.checked)
                                            }
                                        />
                                        I will attach JD
                                    </label>

                                    <label className="flex items-center gap-2 rounded border p-3">
                                        <input
                                            type="checkbox"
                                            checked={mailWorkspaceAttachFiles}
                                            onChange={(e) =>
                                                setMailWorkspaceAttachFiles(e.target.checked)
                                            }
                                        />
                                        I will attach files
                                    </label>

                                    <label className="flex items-center gap-2 rounded border p-3">
                                        <input
                                            type="checkbox"
                                            checked={mailWorkspaceUrgent}
                                            onChange={(e) =>
                                                setMailWorkspaceUrgent(e.target.checked)
                                            }
                                        />
                                        Mark as urgent
                                    </label>

                                    <label className="flex items-center gap-2 rounded border p-3">
                                        <input
                                            type="checkbox"
                                            checked={mailWorkspaceHighlightPPO}
                                            onChange={(e) =>
                                                setMailWorkspaceHighlightPPO(e.target.checked)
                                            }
                                        />
                                        Highlight PPO
                                    </label>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Special Instruction
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded border px-3 py-2"
                                        placeholder="Add custom instructions for ChatGPT here..."
                                        value={mailWorkspaceSpecialInstruction}
                                        onChange={(e) =>
                                            setMailWorkspaceSpecialInstruction(e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Company Conversation / HR Discussion
                                    </label>

                                    <textarea
                                        rows={8}
                                        className="w-full rounded border px-3 py-2"
                                        placeholder="
Paste HR emails,
WhatsApp conversations,
meeting notes,
salary clarification,
bond clarification,
selection process,
company requirements,
or any communication received from company.
"
                                        value={mailWorkspaceCompanyConversation}
                                        onChange={(e) =>
                                            setMailWorkspaceCompanyConversation(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        className="rounded border px-4 py-2"
                                        onClick={() =>
                                            copyToClipboard(buildMailPrompt())
                                        }
                                    >
                                        Copy Prompt
                                    </button>

                                    <button
                                        type="button"
                                        className="rounded border px-4 py-2"
                                        onClick={() =>
                                            window.open(
                                                "https://chatgpt.com/?temporary-chat=true",
                                                "_blank"
                                            )
                                        }
                                    >
                                        Open ChatGPT
                                    </button>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Generated Prompt
                                    </label>
                                    <textarea
                                        rows={22}
                                        readOnly
                                        className="w-full rounded border bg-slate-50 px-3 py-2 text-sm"
                                        value={buildMailPrompt()}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 rounded border p-4 space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Paste ChatGPT Output Here
                                    </label>
                                    <textarea
                                        rows={18}
                                        className="w-full rounded border px-3 py-2"
                                        placeholder="Paste the final mail body copied from ChatGPT..."
                                        value={mailWorkspaceBody}
                                        onChange={(e) =>
                                            setMailWorkspaceBody(e.target.value)
                                        }
                                    />
                                </div>

                                {mailWorkspaceBody.trim() && (
                                    <button
                                        type="button"
                                        className="rounded border px-4 py-2"
                                        onClick={fetchRecipientsFromWorkspace}
                                    >
                                        Fetch Recipient Lists
                                    </button>
                                )}

                                {mailWorkspaceRecipientsFetched && mailWorkspaceRecipientPayload && (
                                    <>
                                        <div className="rounded bg-slate-50 p-4 text-sm space-y-3">
                                            <div>
                                                Students in BCC: {" "}
                                                <b>
                                                    {mailWorkspaceRecipientPayload.studentEmails.length}
                                                    {" "}
                                                    Eligible Candidates
                                                </b>
                                            </div>

                                            <div>
                                                HODs in CC: {" "}
                                                <b>
                                                    {mailWorkspaceRecipientPayload.hodEmails.length}
                                                    {" "}
                                                    HOD emails
                                                </b>
                                            </div>

                                            <div className="rounded border bg-white p-3">
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <div className="font-semibold">
                                                        Student Emails
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="rounded border px-3 py-1"
                                                        onClick={copyStudentEmails}
                                                    >
                                                        Copy Student Emails
                                                    </button>
                                                </div>

                                                <textarea
                                                    readOnly
                                                    rows={10}
                                                    className="w-full rounded border bg-slate-50 px-3 py-2 font-mono text-xs"
                                                    value={mailWorkspaceRecipientPayload.studentEmails.join(", ")}
                                                />

                                                <div className="mt-2 text-xs text-muted-foreground">
                                                    {mailWorkspaceRecipientPayload.studentEmails.length > MAX_AUTO_BCC
                                                        ? "More than 500 student emails were found. Gmail draft will not auto-fill BCC. Use Copy Student Emails and paste manually in BCC."
                                                        : "Auto BCC is enabled in Gmail draft for this recipient count."
                                                    }
                                                </div>
                                            </div>

                                            <div className="rounded border bg-white p-3">
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <div className="font-semibold">
                                                        HOD Emails
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="rounded border px-3 py-1"
                                                        onClick={copyHodEmails}
                                                    >
                                                        Copy HOD Emails
                                                    </button>
                                                </div>

                                                <textarea
                                                    readOnly
                                                    rows={8}
                                                    className="w-full rounded border bg-slate-50 px-3 py-2 font-mono text-xs"
                                                    value={mailWorkspaceRecipientPayload.hodEmails.join(", ")}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                            <button
                                                type="button"
                                                className="rounded border px-4 py-2"
                                                onClick={copyMailPackage}
                                            >
                                                Copy Full Mail Package
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded border px-4 py-2"
                                                onClick={openGmailDraft}
                                            >
                                                Open Gmail Draft
                                            </button>
                                        </div>

                                        <div className="rounded border p-4 text-sm">
                                            <div><b>TO:</b> {NOC_EMAIL_CONFIG.PLACEMENT_CELL_EMAIL}</div>
                                            <div>
                                                <b>CC:</b>{" "}
                                                {[
                                                    NOC_EMAIL_CONFIG.DEPUTY_TNP_EMAIL,
                                                    ...mailWorkspaceRecipientPayload.hodEmails,
                                                ].join(", ")}
                                            </div>
                                            <div>
                                                <b>BCC:</b>{" "}
                                                {mailWorkspaceRecipientPayload.studentEmails.length > MAX_AUTO_BCC
                                                    ? "Use Copy Student Emails"
                                                    : mailWorkspaceRecipientPayload.studentEmails.join(", ")}
                                            </div>
                                            <div className="mt-3">
                                                <b>Subject:</b> {buildSubjectLine()}
                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>
                        </>
                    )}
            </div>
        </div>
    );
}