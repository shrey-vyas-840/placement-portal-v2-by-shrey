import { useEffect, useState } from "react";

import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { usePageLoader } from "@/hooks/usePageLoader";

import { adminQuestionService } from "@/services/adminQuestionService";

import { supabase } from "@/lib/supabase";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { studentOpportunityService } from "@/services/studentOpportunityService";

export function StudentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);

  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);

  const [questions, setQuestions] = useState<any[]>([]);

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  const [answers, setAnswers] = useState<any>({});

  const [pendingApply, setPendingApply] = useState(false);

  const [loading, setLoading] = useState(true);

  const { showLoader } = usePageLoader(loading);

  async function load() {
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

      const data = await studentOpportunityService.getPublishedOpportunities(student.student_id);

      const enriched = await Promise.all(
        data.map(async (opportunity: any) => {
          const { data: roles } = await (supabase as any)
            .from("drive_roles")
            .select(
              `
        drive_role_id,
        drive_role_name
        `,
            )
            .eq("drive_id", opportunity.drive_id)
            .order("drive_role_name");

          return {
            ...opportunity,
            availableRoles: roles ?? [],
          };
        }),
      );

      setOpportunities(enriched);
    } catch (error) {
      console.error("Failed to load opportunities", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function apply(opportunityId: string, selectedRoles: string[] = []) {
    const { data: authData } = await supabase.auth.getUser();

    const authUserId = authData.user?.id;

    if (!authUserId) {
      alert("User not found");

      return;
    }

    const { data: account } = await (supabase as any)
      .from("user_accounts")
      .select("user_id")
      .eq("auth_provider_id", authUserId)
      .maybeSingle();

    if (!account) {
      alert("Account not found");

      return;
    }

    const { data: student } = await (supabase as any)
      .from("student_master")
      .select("student_id")
      .eq("user_id", account.user_id)
      .maybeSingle();

    if (!student) {
      alert("Student profile not found");

      return;
    }

    try {
      await studentOpportunityService.apply(
        opportunityId,
        student.student_id,
        selectedRoles,
        Object.entries(answers).map(([key, value]) => ({
          question_id: key,
          answer_value: Array.isArray(value) ? value.join(",") : value,
        })),
      );

      alert("Application submitted");

      setLoading(true);
      await load();
    } catch (error: any) {
      alert(error?.message || "Application failed");
    }
  }

  if (showLoader) {
    return <AppLoadingScreen page="opportunities" />;
  }

  return (
    <StudentLayout completionName="" completionPercentage={100}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div
          className="
        relative
        overflow-hidden
        rounded-3xl
        bg-gradient-to-r
        from-blue-800
        via-blue-700
        to-cyan-600
        p-8
        text-white
        shadow-xl
    "
        >
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-widest text-white/70">Student Workspace</p>

            <h1 className="mt-2 text-4xl font-bold">Opportunities</h1>

            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Browse internships, placements, PPOs and campus hiring opportunities.
            </p>

            <div className="mt-4 inline-flex rounded-full bg-white/30 px-4 py-2 text-sm">
              {opportunities.length} Active Opportunities
            </div>
          </div>

          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/20" />
          <div className="absolute right-10 bottom-0 h-24 w-24 rounded-full bg-white/20" />
        </div>

        {opportunities.some((x) => x.restriction_active) && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5">
            <div className="font-semibold text-red-700">Placement Restriction Active</div>

            <p className="mt-2 text-sm text-red-600">
              {opportunities.find((x) => x.restriction_active)?.restriction_reason}
            </p>
          </div>
        )}

        <div
          className="
        mt-6
        grid
        gap-6
        md:grid-cols-2
xl:grid-cols-3
2xl:grid-cols-4
    "
        >
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.opportunity_id}
              className="
    group
    relative
    overflow-hidden
    rounded-3xl
    border
    border-border/50
   bg-white/90
backdrop-blur-sm
    p-4
    shadow-sm
    transition-all
    duration-300
 hover:-translate-y-2
hover:shadow-2xl
hover:border-primary/30
"
            >
              <div
                className="
        absolute
        left-0
        top-0
        h-1
        w-full
        bg-gradient-to-r
        from-primary
        via-cyan-500
        to-emerald-500
    "
              />

              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div
                    className="
        flex
        h-14
        w-14
        shrink-0
        items-center
        justify-center
        rounded-2xl
        bg-gradient-to-br
        from-slate-100
        to-slate-200
        font-bold
        text-lg
        text-primary
        shadow-inner
    "
                  >
                    {(
                      opportunity.drive_master?.company_master?.company_name?.[0] ?? "C"
                    ).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {opportunity.drive_master?.company_master?.company_name ??
                        opportunity.opportunity_title}
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                      {opportunity.opportunity_title}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    opportunity.application_status === "RESTRICTED"
                      ? "Restricted"
                      : opportunity.application_status === "PLACED"
                        ? "Placed"
                        : opportunity.application_status === "NOT_PARTICIPATING"
                          ? "Not Participating"
                          : opportunity.application_status === "INELIGIBLE"
                            ? "Ineligible"
                            : "Eligible"
                  }`}
                >
                  {opportunity.restriction_active ? "Restricted" : opportunity.eligibility_status}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                {opportunity.eligibility_status !== "Eligible" && (
                  <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                    {opportunity.eligibility_reason}
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span
                    className="
            font-medium
            text-blue-700
        "
                  >
                    Package
                  </span>

                  <span
                    className="
            font-semibold
            text-right
            text-slate-900
        "
                  >
                    {opportunity.drive_master?.lowest_package_lpa &&
                    opportunity.drive_master?.highest_package_lpa
                      ? `₹ ${opportunity.drive_master.lowest_package_lpa} - ₹ ${opportunity.drive_master.highest_package_lpa} LPA`
                      : "Not Specified"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Drive Type</span>

                  <span className="font-medium text-right">
                    {opportunity.drive_master?.drive_type ?? "-"}
                  </span>
                </div>

                {opportunity.drive_master?.bond_years ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Bond</span>

                    <span className="font-medium text-right">
                      {opportunity.drive_master.bond_years} Years
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between gap-3">
                  <span
                    className="
            rounded-full
            bg-amber-50
            px-
            py-1
            text-xs
            font-semibold
            text-amber-700
        "
                  >
                    ⏳ Deadline
                  </span>

                  <span className="font-medium">
                    {new Date(opportunity.application_end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                disabled={
                  opportunity.alreadyApplied || opportunity.application_status !== "ELIGIBLE"
                }
                onClick={async () => {
                  if ((opportunity.availableRoles?.length ?? 0) > 0) {
                    setSelectedOpportunity(opportunity);
                    setAvailableRoles(opportunity.availableRoles);
                    setSelectedRoleIds([]);
                    setQuestions([]);
                    return;
                  }

                  const qs = await studentOpportunityService.getApplicationQuestions(
                    opportunity.opportunity_id,
                    [],
                    opportunity.drive_id,
                  );

                  if (qs.length > 0) {
                    setSelectedOpportunity(opportunity);
                    setQuestions(qs);
                    return;
                  }

                  apply(opportunity.opportunity_id);
                }}
                className={`
    mt-5
    w-full
    rounded-xl
    py-2.5
    text-sm
    font-semibold
    transition-all
    ${
      opportunity.alreadyApplied
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : opportunity.application_status === "RESTRICTED"
          ? "bg-red-50 text-red-700 border border-red-200"
          : opportunity.application_status === "PLACED"
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : opportunity.application_status === "NOT_PARTICIPATING"
              ? "bg-slate-100 text-slate-700 border border-slate-300"
              : opportunity.application_status === "INELIGIBLE"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-primary text-white hover:scale-[1.02]"
    }
`}
              >
                {opportunity.alreadyApplied
                  ? "Applied ✓"
                  : opportunity.application_status === "RESTRICTED"
                    ? "Restricted"
                    : opportunity.application_status === "PLACED"
                      ? "Placed"
                      : opportunity.application_status === "NOT_PARTICIPATING"
                        ? "Not Participating"
                        : opportunity.application_status === "INELIGIBLE"
                          ? "Ineligible"
                          : "Apply"}
              </button>
            </div>
          ))}
        </div>
        {selectedOpportunity && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div
              className="
        w-full
        max-w-3xl
        max-h-[90vh]
        overflow-y-auto
        rounded-3xl
        border
        border-border/50
        bg-white
        p-8
        shadow-2xl
    "
            >
              <div className="mb-8">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Opportunity Application
                </p>

                <h2 className="mt-2 text-2xl font-bold">Additional Questions</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Complete the required information before submitting your application.
                </p>

                {availableRoles.length > 0 && (
                  <div className="mt-6 rounded-2xl border bg-slate-50 p-5">
                    <p className="mb-3 font-medium">Select Role(s)</p>

                    <div className="space-y-2">
                      {availableRoles.map((role: any) => (
                        <label
                          key={role.drive_role_id}
                          className="flex items-center gap-3 rounded-xl border bg-white p-3"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoleIds.includes(role.drive_role_id)}
                            onChange={async (e) => {
                              const updated = e.target.checked
                                ? [...selectedRoleIds, role.drive_role_id]
                                : selectedRoleIds.filter((id) => id !== role.drive_role_id);

                              setSelectedRoleIds(updated);

                              const qs = await studentOpportunityService.getApplicationQuestions(
                                selectedOpportunity.opportunity_id,
                                updated,
                                selectedOpportunity.drive_id,
                              );

                              setQuestions(qs);
                            }}
                          />

                          <span>{role.drive_role_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {questions.map((q: any) => (
                <div
                  key={q.question_id}
                  className="
        mb-5
        rounded-2xl
        border
        border-border/50
        bg-slate-50/50
        p-5
    "
                >
                  <label className="mb-2 block font-medium">
                    {q.question_title}
                    {q.is_required ? " *" : ""}
                  </label>

                  {q.question_type === "text" && (
                    <input
                      className="
    w-full
    rounded-xl
    border
    border-border
    bg-white
    px-3
    py-2
"
                      onChange={(e) => setAnswers({ ...answers, [q.question_id]: e.target.value })}
                    />
                  )}
                  {q.question_type === "number" && (
                    <input
                      type="number"
                      min={q.validation?.min}
                      max={q.validation?.max}
                      className="
    w-full
    rounded-xl
    border
    border-border
    bg-white
    px-3
    py-2
"
                      value={answers[q.question_id] || ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [q.question_id]: e.target.value,
                        })
                      }
                    />
                  )}

                  {q.question_type === "paragraph" && (
                    <textarea
                      className="
    w-full
    rounded-xl
    border
    border-border
    bg-white
    px-3
    py-2
"
                      onChange={(e) => setAnswers({ ...answers, [q.question_id]: e.target.value })}
                    />
                  )}

                  {q.question_type === "date" && (
                    <input
                      type="date"
                      min={q.validation?.minDate}
                      max={q.validation?.maxDate}
                      className="
    w-full
    rounded-xl
    border
    border-border
    bg-white
    px-3
    py-2
"
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [q.question_id]: e.target.value,
                        })
                      }
                    />
                  )}

                  {q.question_type === "dropdown" && (
                    <select
                      className="
    w-full
    rounded-xl
    border
    border-border
    bg-white
    px-3
    py-2
"
                      onChange={(e) => setAnswers({ ...answers, [q.question_id]: e.target.value })}
                    >
                      <option value="">Select</option>

                      {q.opportunity_question_options?.map((o: any) => (
                        <option key={o.option_id} value={o.option_text}>
                          {o.option_text}
                        </option>
                      ))}
                    </select>
                  )}

                  {q.question_type === "mcq" && (
                    <div>
                      {q.opportunity_question_options?.map((o: any) => (
                        <label key={o.option_id} className="block">
                          <input
                            type="radio"
                            name={q.question_id}
                            onChange={() =>
                              setAnswers({ ...answers, [q.question_id]: o.option_text })
                            }
                          />
                          {o.option_text}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.question_type === "checkbox" && (
                    <div>
                      {q.opportunity_question_options?.map((o: any) => (
                        <label key={o.option_id} className="block">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const old = answers[q.question_id] || [];

                              setAnswers({
                                ...answers,
                                [q.question_id]: e.target.checked
                                  ? [...old, o.option_text]
                                  : old.filter((x: string) => x !== o.option_text),
                              });
                            }}
                          />
                          {o.option_text}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.question_type === "file" && (
                    <input
                      type="file"
                      className="border w-full p-2 rounded"
                      onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (!file) {
                          return;
                        }

                        setAnswers({
                          ...answers,
                          [q.question_id]: file,
                        });
                      }}
                    />
                  )}
                </div>
              ))}

              <div className="sticky bottom-0 mt-8 flex gap-3 border-t bg-white pt-5">
                <button
                  className="
    rounded-xl
    bg-primary
    px-5
    py-2.5
    font-medium
    text-white
"
                  disabled={pendingApply}
                  onClick={async () => {
                    for (const q of questions) {
                      const answer = answers[q.question_id];

                      if (
                        q.is_required &&
                        (answer === undefined ||
                          answer === null ||
                          answer === "" ||
                          (Array.isArray(answer) && answer.length === 0))
                      ) {
                        alert(`${q.question_title} is required`);

                        return;
                      }

                      if (q.question_type === "text") {
                        if (q.validation?.minLength && answer?.length < q.validation.minLength) {
                          alert(`${q.question_title} is too short`);

                          return;
                        }

                        if (q.validation?.maxLength && answer?.length > q.validation.maxLength) {
                          alert(`${q.question_title} is too long`);

                          return;
                        }

                        if (q.validation?.alphaOnly && answer && !/^[A-Za-z ]+$/.test(answer)) {
                          alert(`${q.question_title} allows only alphabets`);

                          return;
                        }
                      }

                      if (q.question_type === "paragraph") {
                        if (q.validation?.minLength && answer?.length < q.validation.minLength) {
                          alert(`${q.question_title} is too short`);

                          return;
                        }

                        if (q.validation?.maxLength && answer?.length > q.validation.maxLength) {
                          alert(`${q.question_title} is too long`);

                          return;
                        }
                      }

                      if (q.question_type === "number") {
                        const value = Number(answer);

                        const digits = String(answer || "").replace(/\D/g, "").length;

                        if (q.validation?.min !== undefined && value < q.validation.min) {
                          alert(`${q.question_title} is below minimum value`);

                          return;
                        }

                        if (q.validation?.max !== undefined && value > q.validation.max) {
                          alert(`${q.question_title} exceeds maximum value`);

                          return;
                        }

                        if (q.validation?.minDigits && digits < q.validation.minDigits) {
                          alert(`${q.question_title} requires more digits`);

                          return;
                        }

                        if (q.validation?.maxDigits && digits > q.validation.maxDigits) {
                          alert(`${q.question_title} exceeds allowed digits`);

                          return;
                        }
                      }

                      if (q.question_type === "checkbox") {
                        const count = answer?.length || 0;

                        if (q.validation?.minSelection && count < q.validation.minSelection) {
                          alert(`${q.question_title}: select more options`);

                          return;
                        }
                        if (q.validation?.maxSelection && count > q.validation.maxSelection) {
                          alert(`${q.question_title}: too many selections`);

                          return;
                        }
                      }

                      if (q.question_type === "file") {
                        const file = answer as File;

                        if (!file) continue;

                        const extension = file.name.split(".").pop()?.toLowerCase();

                        const allowed = q.validation?.allowedExtensions || [];

                        if (allowed.length > 0 && !allowed.includes(extension)) {
                          alert(`${q.question_title}: invalid file type`);

                          return;
                        }

                        const maxBytes = (q.validation?.maxSizeMb || 0) * 1024 * 1024;

                        if (maxBytes > 0 && file.size > maxBytes) {
                          alert(`${q.question_title}: file too large`);

                          return;
                        }
                      }
                    }

                    if (
                      selectedOpportunity.drive_master?.role_selection_enabled &&
                      selectedRoleIds.length <
                        (selectedOpportunity.drive_master.minimum_role_selection ?? 0)
                    ) {
                      alert(
                        `Please select at least ${selectedOpportunity.drive_master.minimum_role_selection} role(s).`,
                      );
                      return;
                    }

                    if (
                      selectedOpportunity.drive_master?.role_selection_enabled &&
                      selectedRoleIds.length >
                        (selectedOpportunity.drive_master.maximum_role_selection ??
                          Number.MAX_SAFE_INTEGER)
                    ) {
                      alert(
                        `You can select a maximum of ${selectedOpportunity.drive_master.maximum_role_selection} role(s).`,
                      );
                      return;
                    }

                    setPendingApply(true);

                    await apply(selectedOpportunity.opportunity_id, selectedRoleIds);

                    setSelectedOpportunity(null);
                    setQuestions([]);
                    setAnswers({});

                    setPendingApply(false);
                  }}
                >
                  Submit Application
                </button>

                <button
                  className="
    rounded-xl
    border
    px-5
    py-2.5
    font-medium
"
                  onClick={() => {
                    setSelectedOpportunity(null);
                    setAnswers({});
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
