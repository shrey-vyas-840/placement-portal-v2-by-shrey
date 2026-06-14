import {
    useEffect,
    useState,
} from "react";

import {
    adminOpportunityService,
} from "@/services/adminOpportunityService";

import {
    adminQuestionService,
} from "@/services/adminQuestionService";

import {
    Link,
} from "@tanstack/react-router";

import {
    NOC_EMAIL_CONFIG,
} from "@/config/hodMapping";

export function AdminOpportunitiesPage() {

    const [drives, setDrives] =
        useState<any[]>([]);

    const [opportunityCards,
        setOpportunityCards] =
        useState<any[]>([]);

    const [
        questionCounts,
        setQuestionCounts
    ] =
        useState<
            Record<string, number>
        >({});

    const [driveId,
        setDriveId] =
        useState("");

    const [title,
        setTitle] =
        useState("");

    const [description,
        setDescription] =
        useState("");

    const [registrationDeadline,
        setRegistrationDeadline] =
        useState("");

    const [publishNow, setPublishNow] =
        useState(false);

    const [
        extendOpportunity,
        setExtendOpportunity
    ] =
        useState<any>(null);


    const [
        newDeadline,
        setNewDeadline
    ] =
        useState("");

    const [
        editingOpportunity,
        setEditingOpportunity
    ] =
        useState<any>(null);

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

    const hasChanges =

        editingOpportunity
            ?

            (
                title !== editingOpportunity.opportunity_title
                ||
                description !==
                (
                    editingOpportunity.opportunity_description
                    ||
                    ""
                )
                ||
                registrationDeadline !==
                (
                    editingOpportunity.deadline
                        ?
                        editingOpportunity.deadline.slice(0, 16)
                        :
                        ""
                )

            )

            :

            true;

    async function load() {

        const drivesData =
            await adminOpportunityService
                .getDrives();


        const cardsData =
            await adminOpportunityService
                .getOpportunityCards();


        setDrives(
            drivesData
        );


        setOpportunityCards(
            cardsData
        );

        const counts:
            Record<
                string,
                number
            > = {};

        for (
            const opp
            of cardsData
        ) {

            counts[
                opp.opportunity_id
            ] =

                await
                    adminQuestionService
                        .getQuestionCount(
                            opp.opportunity_id
                        );

        }

        setQuestionCounts(
            counts
        );

    }

    useEffect(() => {
        load();
    }, []);

    async function handleSubmit(
        e: React.FormEvent,
    ) {

        e.preventDefault();

        try {
            if (
                editingOpportunity
            ) {

                await adminOpportunityService
                    .updateOpportunity(

                        editingOpportunity.opportunity_id,

                        {

                            opportunity_title:
                                title,

                            opportunity_description:
                                description,

                            application_end_date:

                                new Date(
                                    registrationDeadline
                                )
                                    .toISOString(),
                        }
                    );

                setEditingOpportunity(
                    null
                );


                setDriveId("");
                setTitle("");
                setDescription("");
                setRegistrationDeadline("");


                await load();


                return;

            }
            await adminOpportunityService.createOpportunity(
                {
                    drive_id:
                        driveId,

                    opportunity_title:
                        title,

                    opportunity_description:
                        description,

                    application_end_date:

                        new Date(
                            registrationDeadline
                        ).toISOString(),

                    publish:
                        publishNow,
                },
            );

            setDriveId("");
            setTitle("");
            setDescription("");
            setPublishNow(false);

            await load();

        } catch (err) {

            console.error(
                err,
            );

            alert(
                "Failed to create opportunity",
            );
        }
    }

    function getTimeLeft(
        deadline: string,
    ) {

        if (
            !deadline
        ) {

            return "No deadline";

        }


        const end =
            new Date(
                deadline,
            )
                .getTime();


        const now =
            Date.now();


        const diff =
            end - now;


        if (
            diff <= 0
        ) {

            return "Closed";

        }


        const days =
            Math.floor(
                diff /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        const hours =
            Math.floor(
                (
                    diff %
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                )
                /
                (
                    1000 *
                    60 *
                    60
                )
            );


        const minutes =
            Math.floor(
                (
                    diff %
                    (
                        1000 *
                        60 *
                        60
                    )
                )
                /
                (
                    1000 *
                    60
                )
            );


        return (
            `${days}d ${hours}h ${minutes}m left`
        );

    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    function normalizeMailBody(input: string) {

        return input

            // remove html tags except mark
            .replace(/<\/?(?!mark\b)[^>]+>/gi, "")

            // remove markdown headings only
            .replace(/^#{1,6}\s+/gm, "")

            // convert markdown bold to gmail-friendly bold markers
            .replace(/\*\*(.*?)\*\*/g, "*$1*")

            .replace(/__(.*?)__/g, "*$1*")

            // remove code blocks
            .replace(/`{1,3}/g, "")

            // keep bullet points
            .replace(/^\s*[-*]\s+/gm, "• ")

            // collapse spacing
            .replace(/\n{3,}/g, "\n\n")

            .replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                "$1"
            )

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

            await load();

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
            `- Minimum CGPA: ${mailWorkspaceOpportunity.eligibility.minimumCgpa}`,
            `- Maximum Backlogs: ${mailWorkspaceOpportunity.eligibility.maximumActiveBacklogs}`,
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
If an official company website is provided, use your knowledge of that company and the website context to create a short factual in before Company Profile heading and below Company name.
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

        const degreeText =
            mailWorkspaceOpportunity.eligibility.allowedDegrees.join(", ");

        const branchText =
            mailWorkspaceOpportunity.eligibility.allowedBranches.join("/");

        const batchText =
            mailWorkspaceOpportunity.eligibility.allowedBatches.join(", ");

        const eligibilityText = [
            degreeText,
            branchText ? `(${branchText})` : "",
            batchText ? `${batchText} Passing-outs` : "",
        ]
            .filter(Boolean)
            .join(" ");

        const locationText =
            mailWorkspaceCompanyLocation.trim()
                ? ` || Location: ${mailWorkspaceCompanyLocation.trim()}`
                : "";

        const prefix =
            mailWorkspaceUrgent
                ? "Urgent: Job Opportunity"
                : "Job Opportunity";

        return `${prefix} || Company: ${company}${locationText} || Role: ${role}${packageText ? ` || Package: ${packageText}` : ""}${eligibilityText ? ` || ${eligibilityText}` : ""} || Registration Deadline: ${deadline}`;
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


    return (

        <div className="min-h-screen bg-background">

            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Opportunities
                </h1>

                <div className="mt-4 rounded-lg border p-4">

                    <div className="grid grid-cols-4 gap-4">

                        <div className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">
                                Total Opportunities
                            </div>

                            <div className="mt-2 text-2xl font-bold">
                                {opportunityCards.length}
                            </div>
                        </div>

                        <div className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">
                                Published
                            </div>

                            <div className="mt-2 text-2xl font-bold">
                                {
                                    opportunityCards.filter(
                                        (item) =>
                                            item.visible_to_students === true
                                    ).length
                                }
                            </div>
                        </div>

                        <div className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">
                                Draft
                            </div>

                            <div className="mt-2 text-2xl font-bold">
                                {
                                    opportunityCards.filter(
                                        (item) =>
                                            item.application_status === "Draft"
                                    ).length
                                }
                            </div>
                        </div>

                        <div className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">
                                Applications
                            </div>

                            <div className="mt-2 text-2xl font-bold">
                                {
                                    opportunityCards.reduce(
                                        (
                                            total,
                                            item,
                                        ) =>
                                            total +
                                            item.appliedCount,
                                        0,
                                    )
                                }
                            </div>
                        </div>

                    </div>

                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                    Create opportunities from approved drives and publish them to students.
                </p>

                <div className="mt-8 rounded-lg border p-4">

                    <h2 className="font-semibold">
                        Opportunity Workflow
                    </h2>

                    <div className="mt-3 flex gap-3 text-sm">

                        <span>
                            Draft
                        </span>

                        <span>
                            →
                        </span>

                        <span>
                            Open
                        </span>

                        <span>
                            →
                        </span>

                        <span>
                            Closed
                        </span>

                        <span>
                            →
                        </span>

                        <span>
                            Completed
                        </span>

                    </div>

                </div>

                <div className="mt-8 rounded border p-4">

                    <h2 className="font-semibold">
                        Draft Opportunities
                    </h2>


                    {opportunityCards
                        .filter(
                            x =>
                                x.application_status === "Draft"
                        )
                        .slice(0, 5)
                        .map(
                            opp => (

                                <div
                                    key={opp.opportunity_id}
                                    className="mt-3 flex justify-between border p-3"
                                >

                                    <div>

                                        <b>
                                            {opp.opportunity_title}
                                        </b>

                                        <p>
                                            {opp.company}
                                        </p>

                                    </div>

                                    <div
                                        className="
text-sm
text-muted-foreground
mb-2
"
                                    >

                                        Questions:
                                        {" "}

                                        {
                                            questionCounts[
                                            opp.opportunity_id
                                            ]
                                            ||
                                            0
                                        }

                                    </div>

                                    <button

                                        disabled={
                                            (
                                                questionCounts[
                                                opp.opportunity_id
                                                ]
                                                ||
                                                0
                                            ) === 0
                                        }

                                        onClick={
                                            async () => {

                                                await adminOpportunityService
                                                    .publishOpportunity(
                                                        opp.opportunity_id
                                                    );

                                                await load();

                                            }
                                        }

                                        className="rounded border px-3"

                                    >

                                        Publish Now

                                    </button>

                                    <Link
                                        to="/admin/questions/$opportunityId"
                                        params={{
                                            opportunityId:
                                                opp.opportunity_id,
                                        }}
                                        className="rounded border px-3 py-2"
                                    >
                                        Questions
                                    </Link>

                                    <button

                                        className="rounded border px-3"

                                        onClick={
                                            () => {

                                                setEditingOpportunity(
                                                    opp
                                                );


                                                setDriveId(
                                                    opp.drive_id
                                                );


                                                setTitle(
                                                    opp.opportunity_title
                                                );


                                                setDescription(
                                                    opp.opportunity_description
                                                    ||
                                                    ""
                                                );


                                                setRegistrationDeadline(
                                                    opp.deadline
                                                        ?
                                                        opp.deadline.slice(0, 16)
                                                        :
                                                        ""
                                                );

                                            }
                                        }

                                    >

                                        Edit

                                    </button>

                                </div>

                            )
                        )}

                </div>

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="mt-8 rounded-lg border p-5 space-y-4"
                >

                    <div>

                        <label className="mb-1 block font-medium">
                            Drive
                        </label>

                        <select
                            value={
                                driveId
                            }
                            onChange={(
                                e,
                            ) =>
                                setDriveId(
                                    e.target
                                        .value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        >

                            <option value="">
                                Select Drive
                            </option>

                            {drives.map(
                                (
                                    drive,
                                ) => (
                                    <option
                                        key={
                                            drive.drive_id
                                        }
                                        value={
                                            drive.drive_id
                                        }
                                    >
                                        {drive.company_master?.company_name}
                                        {" - "}
                                        {drive.drive_name}
                                    </option>
                                ),
                            )}

                        </select>

                    </div>

                    <div>

                        <label className="mb-1 block font-medium">
                            Opportunity Title
                        </label>

                        <input
                            value={
                                title
                            }
                            onChange={(
                                e,
                            ) =>
                                setTitle(
                                    e.target
                                        .value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        />

                    </div>

                    <div>

                        <label className="mb-1 block font-medium">
                            Description
                        </label>

                        <textarea
                            rows={10}
                            value={
                                description
                            }
                            onChange={(
                                e,
                            ) =>
                                setDescription(
                                    e.target
                                        .value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />

                    </div>

                    <div>

                        <label className="mb-1 block font-medium">
                            Registration Deadline
                        </label>

                        <input
                            type="datetime-local"
                            value={
                                registrationDeadline
                            }
                            onChange={(
                                e,
                            ) =>
                                setRegistrationDeadline(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        />

                        <div className="flex items-center gap-2 mt-3">

                        </div>

                    </div>

                    <label className="flex gap-2">

                        <input

                            type="checkbox"

                            checked={
                                publishNow
                            }

                            onChange={
                                (e) =>
                                    setPublishNow(
                                        e.target.checked
                                    )
                            }

                        />

                        Publish immediately to students

                    </label>

                    <button
                        type="submit"
                        disabled={
                            !hasChanges
                        }
                        className="rounded border px-4 py-2"
                    >
                        {
                            editingOpportunity
                                ?
                                "Save Changes"
                                :
                                "Create Opportunity"
                        }
                    </button>
                    {
                        editingOpportunity
                        &&

                        <button

                            type="button"

                            onClick={
                                () => {

                                    setEditingOpportunity(
                                        null
                                    );

                                    setDriveId("");
                                    setTitle("");
                                    setDescription("");
                                    setRegistrationDeadline("");

                                }
                            }

                        >

                            Cancel Edit

                        </button>

                    }
                </form>

                <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                    {
                        opportunityCards
                            .filter(
                                x =>
                                    x.application_status !== "Draft"
                            ).slice(0, 5)
                            .map(
                                (opportunity) => (

                                    <div
                                        key={
                                            opportunity.opportunity_id
                                        }
                                        className="rounded-xl border bg-background p-5 shadow-sm"
                                    >

                                        <h2 className="text-xl font-semibold">

                                            {opportunity.company}

                                        </h2>


                                        <p className="mt-1">

                                            {opportunity.opportunity_title}

                                        </p>


                                        <div className="mt-5 space-y-2 text-sm">

                                            <p>
                                                Role:
                                                {" "}
                                                {
                                                    opportunity.drive_master
                                                        ?.drive_name
                                                }
                                            </p>


                                            <p>
                                                Eligible Candidates:
                                                {" "}
                                                <b>
                                                    {
                                                        opportunity.eligibleCount
                                                    }
                                                </b>
                                            </p>


                                            <p>
                                                Applied Students:
                                                {" "}
                                                <b>
                                                    {
                                                        opportunity.appliedCount
                                                    }
                                                </b>
                                            </p>


                                            <p>
                                                Not Applied:
                                                {" "}
                                                <b>
                                                    {
                                                        opportunity.unappliedCount
                                                    }
                                                </b>
                                            </p>


                                            <p>
                                                Deadline:
                                                {" "}
                                                {
                                                    opportunity.deadline
                                                        ?
                                                        new Date(
                                                            opportunity.deadline
                                                        )
                                                            .toLocaleString()
                                                        :
                                                        "-"
                                                }
                                            </p>


                                            <p className="font-semibold text-red-600">

                                                {
                                                    getTimeLeft(
                                                        opportunity.deadline
                                                    )
                                                }

                                            </p>


                                        </div>

                                        <Link

                                            to="/admin/opportunities/$opportunityId"

                                            params={{
                                                opportunityId:
                                                    opportunity.opportunity_id,
                                            }}

                                            className="mt-5 inline-block rounded-lg border px-4 py-2"

                                        >

                                            View Applicants

                                        </Link>

                                        <button

                                            className="
mt-3 block
rounded-lg border
px-4 py-2
"

                                            onClick={() => {

                                                setExtendOpportunity(
                                                    opportunity
                                                );

                                                setNewDeadline(
                                                    opportunity.deadline
                                                        ?
                                                        opportunity.deadline.slice(0, 16)
                                                        :
                                                        ""
                                                );

                                            }}

                                        >

                                            Extend Application

                                        </button>

                                        <button
                                            type="button"
                                            className="
mt-3 block
rounded-lg border
px-4 py-2
"
                                            onClick={async () => {
                                                await openMailWorkspace(
                                                    opportunity
                                                );
                                            }}
                                        >
                                            Mail Workspace
                                        </button>

                                    </div>

                                ),
                            )}{
                        opportunityCards.length > 5
                        &&

                        <Link

                            to="/admin/all-opportunities"

                            className="
rounded-xl
border
p-5
shadow-sm
flex
items-center
justify-center
font-semibold
"

                        >
                            View All (
                            {
                                opportunityCards.filter(
                                    x =>
                                        x.application_status !== "Draft"
                                ).length - 5
                            }
                            )

                        </Link>
                    }

                </div>

            </div>

            {
                extendOpportunity && (

                    <div className="
fixed inset-0 
flex items-center justify-center
bg-black/40
">

                        <div className="
bg-white rounded-lg p-6
space-y-4 w-96
">

                            <h2 className="font-bold text-lg">

                                Extend Deadline

                            </h2>


                            <input

                                type="datetime-local"

                                className="
border rounded px-3 py-2 w-full
"

                                value={
                                    newDeadline
                                }

                                onChange={
                                    (e) =>
                                        setNewDeadline(
                                            e.target.value
                                        )
                                }

                            />


                            <div className="flex gap-3">


                                <button

                                    className="border px-4 py-2 rounded"

                                    onClick={
                                        async () => {
                                            {
                                                await adminOpportunityService
                                                    .extendDeadline(
                                                        extendOpportunity.opportunity_id,
                                                        new Date(
                                                            newDeadline
                                                        )
                                                            .toISOString()
                                                    );

                                                setExtendOpportunity(null);
                                                await load();
                                            }
                                        }
                                    }
                                > Save

                                </button>

                                <button

                                    className="border px-4 py-2 rounded"

                                    onClick={
                                        () => setExtendOpportunity(null)
                                    }

                                >

                                    Cancel

                                </button>


                            </div>


                        </div>

                    </div>

                )
            }
            {
                mailWorkspaceOpportunity && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-6">

                        <div className="min-h-full flex items-start justify-center py-8">

                            <div className="
            w-full
            max-w-7xl
            rounded-lg
            bg-white
            p-6
            shadow-xl
            mb-8
        ">
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
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>

                                {mailWorkspaceLoading ? (
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
                                                            {mailWorkspaceOpportunity.eligibility.allowedInstitutes.length
                                                                ? mailWorkspaceOpportunity.eligibility.allowedInstitutes.join(", ")
                                                                : "All"}
                                                        </b>
                                                    </div>
                                                    <div>
                                                        Degrees:{" "}
                                                        <b>
                                                            {mailWorkspaceOpportunity.eligibility.allowedDegrees.length
                                                                ? mailWorkspaceOpportunity.eligibility.allowedDegrees.join(", ")
                                                                : "All"}
                                                        </b>
                                                    </div>
                                                    <div>
                                                        Branches:{" "}
                                                        <b>
                                                            {mailWorkspaceOpportunity.eligibility.allowedBranches.length
                                                                ? mailWorkspaceOpportunity.eligibility.allowedBranches.join(", ")
                                                                : "All"}
                                                        </b>
                                                    </div>
                                                    <div>
                                                        Batches:{" "}
                                                        <b>
                                                            {mailWorkspaceOpportunity.eligibility.allowedBatches.length
                                                                ? mailWorkspaceOpportunity.eligibility.allowedBatches.join(", ")
                                                                : "All"}
                                                        </b>
                                                    </div>
                                                    <div>
                                                        Minimum CGPA:{" "}
                                                        <b>
                                                            {mailWorkspaceOpportunity.eligibility.minimumCgpa || "-"}
                                                        </b>
                                                    </div>
                                                    <div>
                                                        Max Backlogs:{" "}
                                                        <b>
                                                            {mailWorkspaceOpportunity.eligibility.maximumActiveBacklogs || "-"}
                                                        </b>
                                                    </div>
                                                </div>

                                                <div className="rounded bg-slate-50 p-3 text-sm">
                                                    Eligible Students:{" "}
                                                    <b>{mailWorkspaceOpportunity.eligibleStudents.length}</b>
                                                    <br />
                                                    HOD CC Emails:{" "}
                                                    <b>{mailWorkspaceOpportunity.hodEmails.length}</b>
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
                                                                eligible students
                                                            </b>
                                                        </div>

                                                        <div>
                                                            HODs in CC: {" "}
                                                            <b>
                                                                {mailWorkspaceRecipientPayload.hodEmails.length}
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

                    </div>
                )
            }

        </div>
    );
}