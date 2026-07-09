import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { generateUuid } from "@/lib/generateUuid";

export type RecruitmentQuestionType =
  | "text"
  | "paragraph"
  | "number"
  | "date"
  | "dropdown"
  | "mcq"
  | "checkbox"
  | "url"
  | "email"
  | "phone";

export type RecruitmentQuestionValidation = {
  // ---------- Text ----------
  minLength?: number | "";
  maxLength?: number | "";
  alphaOnly?: boolean;
  alphaNumericOnly?: boolean;
  regexPattern?: string;

  // ---------- Number ----------
  min?: number | "";
  max?: number | "";
  minDigits?: number | "";
  maxDigits?: number | "";
  allowDecimal?: boolean;
  positiveOnly?: boolean;

  // ---------- Date ----------
  minDate?: string;
  maxDate?: string;

  // ---------- Email ----------
  institutionalOnly?: boolean;
  allowedDomains?: string;
  blockPersonalEmail?: boolean;

  // ---------- Phone ----------
  countryCode?: string;
  mobileOnly?: boolean;

  // ---------- URL ----------
  httpsOnly?: boolean;
  allowedUrlDomains?: string;

  // ---------- Choice ----------
  minSelection?: number | "";
  maxSelection?: number | "";
  preventDuplicateOptions?: boolean;
  preventEmptyOptions?: boolean;
};

export type RecruitmentQuestion = {
  question_id: string | null;
  question_title: string;
  question_description?: string;
  question_type: RecruitmentQuestionType;
  is_required: boolean;
  validation?: RecruitmentQuestionValidation;
  options: string[];
};

interface RecruitmentQuestionBuilderProps {
  questions: RecruitmentQuestion[];
  onChange: Dispatch<SetStateAction<RecruitmentQuestion[]>>;
  title?: string;
  subtitle?: string;
  readOnly?: boolean;
  loading?: boolean;
  allowSave?: boolean;
  saving?: boolean;
  onSave?: () => Promise<void> | void;
}

const QUESTION_TYPE_OPTIONS: Array<{ label: string; value: RecruitmentQuestionType }> = [
  { label: "Short Answer", value: "text" },
  { label: "Paragraph", value: "paragraph" },
  { label: "Number", value: "number" },
  { label: "Date", value: "date" },
  { label: "Dropdown", value: "dropdown" },
  { label: "Multiple Choice", value: "mcq" },
  { label: "Checkbox", value: "checkbox" },
  { label: "URL", value: "url" },
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
];

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? generateUuid()
    : Math.random().toString(36).slice(2);
}

function createEmptyQuestion(): RecruitmentQuestion {
  return {
    question_id: createId(),
    question_title: "",
    question_description: "",
    question_type: "text",
    is_required: false,
    validation: {},
    options: [],
  };
}

function previewPlaceholderForType(type: RecruitmentQuestionType) {
  switch (type) {
    case "paragraph":
      return "Write your answer here...";
    case "number":
      return "Enter a number";
    case "date":
      return "Select a date";
    case "dropdown":
      return "Choose from the dropdown";
    case "mcq":
      return "Choose one option";
    case "checkbox":
      return "Choose one or more options";
    case "url":
      return "https://example.com";
    case "email":
      return "name@domain.com";
    case "phone":
      return "Enter phone number";
    case "text":
    default:
      return "Short answer text";
  }
}

function isMultiOptionType(type: RecruitmentQuestionType) {
  return type === "dropdown" || type === "mcq" || type === "checkbox";
}

function isTextLikeType(type: RecruitmentQuestionType) {
  return (
    type === "text" ||
    type === "paragraph" ||
    type === "url" ||
    type === "email" ||
    type === "phone"
  );
}

function emptyValidation(): RecruitmentQuestionValidation {
  return {};
}

function hasActiveValidation(validation?: RecruitmentQuestionValidation) {
  if (!validation) return false;

  return Object.values(validation).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (typeof value === "number") {
      return true;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return value != null;
  });
}

function PreviewQuestionCard({ question }: { question: RecruitmentQuestion }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Student View
          </div>
          <h4 className="mt-2 text-base font-semibold leading-5">
            {question.question_title.trim() !== "" ? question.question_title : "Untitled Question"}
            {question.is_required ? <span className="ml-1 text-red-500">*</span> : null}
          </h4>
          {question.question_description ? (
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {question.question_description}
            </p>
          ) : null}
        </div>

        <div className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {QUESTION_TYPE_OPTIONS.find((item) => item.value === question.question_type)?.label ||
            question.question_type}
        </div>
      </div>
      <div className="mt-5">
        {question.question_type === "paragraph" ? (
          <textarea
            rows={4}
            disabled
            placeholder={previewPlaceholderForType(question.question_type)}
            className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          />
        ) : question.question_type === "dropdown" ? (
          <select
            disabled
            className="w-full rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
          >
            <option>Select an option</option>

            {(question.options.length ? question.options : ["Option 1", "Option 2"]).map(
              (option, optionIndex) => (
                <option key={optionIndex}>{option || `Option ${optionIndex + 1}`}</option>
              ),
            )}
          </select>
        ) : isMultiOptionType(question.question_type) ? (
          <div className="space-y-2">
            {(question.options.length ? question.options : ["Option 1", "Option 2"]).map(
              (option, optionIndex) => (
                <label
                  key={optionIndex}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm"
                >
                  {question.question_type === "checkbox" ? (
                    <input disabled type="checkbox" />
                  ) : (
                    <input disabled type="radio" />
                  )}

                  <span>{option || `Option ${optionIndex + 1}`}</span>
                </label>
              ),
            )}
          </div>
        ) : (
          <input
            disabled
            placeholder={previewPlaceholderForType(question.question_type)}
            className="w-full rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
          />
        )}
      </div>
      {hasActiveValidation(question.validation) && (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          ✓ Validation Rules Applied
        </div>
      )}
    </div>
  );
}

export function RecruitmentQuestionBuilder({
  questions,
  onChange,
  title = "Default Questions",
  subtitle,
  readOnly = false,
  loading = false,
  allowSave = false,
  saving = false,
  onSave,
}: RecruitmentQuestionBuilderProps) {
  
  const questionCount = useMemo(() => questions.length, [questions]);

  const requiredCount = useMemo(() => questions.filter((q) => q.is_required).length, [questions]);

  const optionalCount = questionCount - requiredCount;

  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [previewExpanded, setPreviewExpanded] = useState<Record<number, boolean>>({
    0: false,
  });

  const [validationExpanded, setValidationExpanded] = useState<Record<number, boolean>>({
    0: true,
  });

  const [basicExpanded, setBasicExpanded] = useState<Record<number, boolean>>({
    0: true,
  });

  const [optionsExpanded, setOptionsExpanded] = useState<Record<number, boolean>>({
    0: true,
  });

  const titleInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    const expandedIndex = Object.entries(expandedQuestions).find(([, expanded]) => expanded)?.[0];

    if (expandedIndex === undefined) return;

    const index = Number(expandedIndex);

    requestAnimationFrame(() => {
      titleInputRefs.current[index]?.focus();
    });
  }, [questions.length, expandedQuestions]);

  function toggleBasic(index: number) {
    setBasicExpanded((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  }

  function toggleOptions(index: number) {
    setOptionsExpanded((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  }

  function toggleValidation(index: number) {
    setValidationExpanded((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  }

  function toggleQuestion(index: number) {
    setExpandedQuestions((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  }

  function togglePreview(index: number) {
    setPreviewExpanded((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  }

  function expandOnly(index: number) {
    setExpandedQuestions({
      [index]: true,
    });

    setBasicExpanded({
      [index]: true,
    });

    setValidationExpanded({
      [index]: true,
    });

    setOptionsExpanded({
      [index]: true,
    });
  }

  function addQuestion() {
    if (readOnly) return;

    const newIndex = questions.length;

    onChange((previous) => [...previous, createEmptyQuestion()]);
    expandOnly(newIndex);
    requestAnimationFrame(() => {
      const element = document.getElementById(`question-card-${newIndex}`);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });
  }

  function updateQuestion(index: number, field: keyof RecruitmentQuestion, value: any) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];

      const current = copy[index];

      if (!current) return previous;

      const next = {
        ...current,
        [field]: value,
      };
      if (field === "question_type") {
        const nextType = value as RecruitmentQuestionType;

        const previousWasChoice = isMultiOptionType(current.question_type);
        const nextIsChoice = isMultiOptionType(nextType);

        if (!previousWasChoice && nextIsChoice) {
          next.options =
            current.options.length > 0 ? [...current.options] : ["Option 1", "Option 2"];
        }

        if (previousWasChoice && nextIsChoice) {
          next.options = [...current.options];
        }

        if (previousWasChoice && !nextIsChoice) {
          next.options = [...current.options];
        }

        next.validation = {};
      }

      copy[index] = next;

      return copy;
    });
  }

  function updateValidation(index: number, field: keyof RecruitmentQuestionValidation, value: any) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];
      copy[index] = {
        ...copy[index],
        validation: {
          ...(copy[index].validation || emptyValidation()),
          [field]: value,
        },
      };
      return copy;
    });
  }

  function duplicateQuestion(index: number) {
    if (readOnly) return;

    const newIndex = index + 1;

    onChange((previous) => {
      const current = previous[index];
      if (!current) return previous;

      const cloned: RecruitmentQuestion = {
        ...JSON.parse(JSON.stringify(current)),
        question_id: createId(),
        question_title: current.question_title ? `${current.question_title} Copy` : "Copy",
      };

      const copy = [...previous];
      copy.splice(newIndex, 0, cloned);
      return copy;
    });

    expandOnly(newIndex);

    requestAnimationFrame(() => {
      document.getElementById(`question-card-${newIndex}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function moveQuestionUp(index: number) {
    if (readOnly || index === 0) return;

    onChange((previous) => {
      const copy = [...previous];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  }

  function moveQuestionDown(index: number) {
    if (readOnly || index >= questions.length - 1) return;

    onChange((previous) => {
      const copy = [...previous];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
  }

  function addQuestionBelow(index: number) {
    if (readOnly) return;

    const newIndex = index + 1;

    onChange((previous) => {
      const copy = [...previous];
      copy.splice(newIndex, 0, createEmptyQuestion());
      return copy;
    });

    expandOnly(newIndex);
    requestAnimationFrame(() => {
      const element = document.getElementById(`question-card-${newIndex}`);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });
  }

  function deleteQuestion(index: number) {
    if (readOnly) return;

    setDeleteIndex(index);
  }
  function confirmDeleteQuestion() {
    if (deleteIndex === null) return;

    onChange((previous) => previous.filter((_, index) => index !== deleteIndex));

    setDeleteIndex(null);
  }

  function addOption(index: number) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];
      copy[index] = {
        ...copy[index],
        options: [...(copy[index].options || []), ""],
      };
      return copy;
    });
  }

  function updateOption(index: number, optionIndex: number, value: string) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];
      const nextOptions = [...(copy[index].options || [])];
      nextOptions[optionIndex] = value;
      copy[index] = {
        ...copy[index],
        options: nextOptions,
      };
      return copy;
    });
  }

  function removeOption(index: number, optionIndex: number) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];
      copy[index] = {
        ...copy[index],
        options: (copy[index].options || []).filter((_, i) => i !== optionIndex),
      };
      return copy;
    });
  }

  function renderValidationEditor(question: RecruitmentQuestion, index: number) {
    if (question.question_type === "text") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Validation</div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Minimum Characters"
              value={question.validation?.minLength || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "minLength",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />

            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Maximum Characters"
              value={question.validation?.maxLength || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "maxLength",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </div>

          <label className="mt-4 flex items-center gap-3 text-sm">
            <input
              disabled={readOnly}
              type="checkbox"
              checked={question.validation?.alphaOnly || false}
              onChange={(e) => updateValidation(index, "alphaOnly", e.target.checked)}
            />
            Only alphabets
          </label>
        </div>
      );
    }

    if (question.question_type === "paragraph") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Validation</div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Minimum Characters"
              value={question.validation?.minLength || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "minLength",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />

            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Maximum Characters"
              value={question.validation?.maxLength || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "maxLength",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </div>
        </div>
      );
    }

    if (question.question_type === "number") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Validation</div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Minimum Value"
              value={question.validation?.min || ""}
              onChange={(e) =>
                updateValidation(index, "min", e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Maximum Value"
              value={question.validation?.max || ""}
              onChange={(e) =>
                updateValidation(index, "max", e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Minimum Digits"
              value={question.validation?.minDigits || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "minDigits",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />

            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Maximum Digits"
              value={question.validation?.maxDigits || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "maxDigits",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </div>
        </div>
      );
    }

    if (question.question_type === "email") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Email Validation</div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input
                disabled={readOnly}
                type="checkbox"
                checked={question.validation?.institutionalOnly || false}
                onChange={(e) => updateValidation(index, "institutionalOnly", e.target.checked)}
              />
              Allow Institutional Email Only
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                disabled={readOnly}
                type="checkbox"
                checked={question.validation?.blockPersonalEmail || false}
                onChange={(e) => updateValidation(index, "blockPersonalEmail", e.target.checked)}
              />
              Block Personal Email Providers
            </label>

            <input
              disabled={readOnly}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
              placeholder="Allowed domains (comma separated)"
              value={question.validation?.allowedDomains || ""}
              onChange={(e) => updateValidation(index, "allowedDomains", e.target.value)}
            />

            <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
              Example: indusuni.ac.in, company.com
            </div>
          </div>
        </div>
      );
    }

    if (question.question_type === "phone") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Phone Validation</div>

          <div className="space-y-4">
            <input
              disabled={readOnly}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
              placeholder="Country Code (Example: +91)"
              value={question.validation?.countryCode || ""}
              onChange={(e) => updateValidation(index, "countryCode", e.target.value)}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <input
                disabled={readOnly}
                type="number"
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
                placeholder="Minimum Digits"
                value={question.validation?.minDigits || ""}
                onChange={(e) =>
                  updateValidation(
                    index,
                    "minDigits",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />

              <input
                disabled={readOnly}
                type="number"
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
                placeholder="Maximum Digits"
                value={question.validation?.maxDigits || ""}
                onChange={(e) =>
                  updateValidation(
                    index,
                    "maxDigits",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                disabled={readOnly}
                type="checkbox"
                checked={question.validation?.mobileOnly || false}
                onChange={(e) => updateValidation(index, "mobileOnly", e.target.checked)}
              />
              Accept Mobile Numbers Only
            </label>
          </div>
        </div>
      );
    }

    if (question.question_type === "url") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">URL Validation</div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                disabled={readOnly}
                type="checkbox"
                checked={question.validation?.httpsOnly || false}
                onChange={(e) => updateValidation(index, "httpsOnly", e.target.checked)}
              />
              Allow HTTPS URLs Only
            </label>

            <input
              disabled={readOnly}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
              placeholder="Allowed Domains (comma separated)"
              value={question.validation?.allowedUrlDomains || ""}
              onChange={(e) => updateValidation(index, "allowedUrlDomains", e.target.value)}
            />

            <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
              Example: github.com, linkedin.com, drive.google.com
            </div>
          </div>
        </div>
      );
    }

    if (question.question_type === "date") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-700">Date Range</div>

            <div className="mt-1 text-xs text-muted-foreground">
              Restrict which dates students are allowed to select.
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              aria-label="Earliest Date"
              value={question.validation?.minDate || ""}
              onChange={(e) => updateValidation(index, "minDate", e.target.value)}
            />

            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              aria-label="Latest Date"
              value={question.validation?.maxDate || ""}
              onChange={(e) => updateValidation(index, "maxDate", e.target.value)}
            />
          </div>
        </div>
      );
    }

    if (question.question_type === "dropdown" || question.question_type === "mcq") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Choice Validation</div>

          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
              Students can select only one option.
            </div>
          </div>
        </div>
      );
    }

    if (question.question_type === "checkbox") {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Validation</div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Minimum Selections"
              value={question.validation?.minSelection || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "minSelection",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />

            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Maximum Selections"
              value={question.validation?.maxSelection || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "maxSelection",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </div>
        </div>
      );
    }
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="text-sm text-muted-foreground">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {questionCount} Total
              </div>

              <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                {requiredCount} Required
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {optionalCount} Optional
              </div>
            </div>
          </div>

          {!readOnly ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addQuestion}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                + Add Question
              </button>

              {allowSave && onSave ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onSave}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Questions"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {!questions.length ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <div className="text-5xl">📝</div>
          <h3 className="mt-4 text-xl font-semibold">No questions added yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add optional questions for this recruitment, or skip this step and continue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => {
            const isExpanded =
              expandedQuestions[index] ??
              (Object.keys(expandedQuestions).length === 0 && index === 0);
            const previewVisible = previewExpanded[index] ?? false;

            return (
              <div
                id={`question-card-${index}`}
                key={question.question_id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div
                  className={`grid gap-0 ${
                    previewVisible ? "lg:grid-cols-[1.35fr_0.65fr]" : "grid-cols-1"
                  }`}
                >
                  <div className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                            Q{index + 1}
                          </div>

                          <div className="text-base font-semibold">
                            {question.question_title.trim() !== ""
                              ? question.question_title
                              : "Untitled Question"}
                          </div>

                          {question.is_required && (
                            <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] text-red-700">
                              Required
                            </span>
                          )}
                        </div>

                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => toggleQuestion(index)}
                            className="text-sm text-primary hover:underline"
                          >
                            {isExpanded ? "▲ Collapse Editor" : "▼ Edit Question"}
                          </button>
                        </div>
                      </div>

                      {!readOnly && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveQuestionUp(index)}
                            className="rounded-xl border px-3 py-2 text-m disabled:opacity-40 transition hover:bg-gray-200"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            disabled={index === questions.length - 1}
                            onClick={() => moveQuestionDown(index)}
                            className="rounded-xl border px-3 py-2 text-m disabled:opacity-40 transition hover:bg-gray-200"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() => addQuestionBelow(index)}
                            className="rounded-full border border-dashed border-blue-300 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            + Add Question Below
                          </button>

                          <button
                            type="button"
                            onClick={() => duplicateQuestion(index)}
                            className="rounded-xl border h-10 px-4 text-sm text-sm transition hover:bg-gray-100"
                          >
                            Duplicate
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteQuestion(index)}
                            className="rounded-full border border-red-200 h-10 px-4 text-sm text-red-600 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {deleteIndex !== null && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                            <h3 className="text-lg font-semibold">Delete Question?</h3>

                            <p className="mt-2 text-sm text-muted-foreground">
                              This action cannot be undone.
                            </p>

                            <div className="mt-4 rounded-xl border bg-muted/20 p-3">
                              <div className="text-xs text-muted-foreground">Question</div>

                              <div className="font-medium">
                                {questions[deleteIndex]?.question_title || "Untitled Question"}
                              </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                              <button
                                onClick={() => setDeleteIndex(null)}
                                className="rounded-xl font-semibold text-m border px-5 py-2"
                              >
                                Cancel
                              </button>

                              <button
                                onClick={confirmDeleteQuestion}
                                className="rounded-xl bg-red-600 font-bold text-m px-5 py-2 text-white"
                              >
                                Delete Question
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="mt-6 space-y-4 rounded-xl border border-border bg-muted/10 p-5">
                        <div className="rounded-xl border border-border bg-background">
                          <button
                            type="button"
                            onClick={() => toggleBasic(index)}
                            className="flex w-full items-center justify-between px-5 py-4"
                          >
                            <div>
                              <div className="font-medium">Basic Information</div>

                              <div className="text-xs text-muted-foreground">
                                Title, description, type and required status
                              </div>
                            </div>

                            <div>{(basicExpanded[index] ?? index === 0) ? "▲" : "▼"}</div>
                          </button>

                          {(basicExpanded[index] ?? index === 0) && (
                            <div className="border-t border-border p-5">
                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Question Title
                                </label>
                                <input
                                  ref={(element) => {
                                    titleInputRefs.current[index] = element;
                                  }}
                                  disabled={readOnly}
                                  className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                                  placeholder="Question title"
                                  value={question.question_title}
                                  onChange={(e) =>
                                    updateQuestion(index, "question_title", e.target.value)
                                  }
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Description{" "}
                                  <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <textarea
                                  disabled={readOnly}
                                  rows={3}
                                  className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                                  placeholder="Add supporting instruction or guidance"
                                  value={question.question_description || ""}
                                  onChange={(e) =>
                                    updateQuestion(index, "question_description", e.target.value)
                                  }
                                />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <label className="mb-2 block text-sm font-medium">
                                    Question Type
                                  </label>
                                  <select
                                    disabled={readOnly}
                                    className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                                    value={question.question_type}
                                    onChange={(e) =>
                                      updateQuestion(
                                        index,
                                        "question_type",
                                        e.target.value as RecruitmentQuestionType,
                                      )
                                    }
                                  >
                                    {QUESTION_TYPE_OPTIONS.map((type) => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-end">
                                  <label className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm">
                                    <input
                                      disabled={readOnly}
                                      type="checkbox"
                                      checked={question.is_required}
                                      onChange={(e) =>
                                        updateQuestion(index, "is_required", e.target.checked)
                                      }
                                    />
                                    Required
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <>
                          <>
                            {isMultiOptionType(question.question_type) && (
                              <div className="rounded-xl border border-border bg-background">
                                <button
                                  type="button"
                                  onClick={() => toggleOptions(index)}
                                  className="flex w-full items-center justify-between px-5 py-4"
                                >
                                  <div>
                                    <div className="font-medium">Answer Options</div>

                                    <div className="text-xs text-muted-foreground">
                                      Configure available choices
                                    </div>
                                  </div>

                                  <div>{(optionsExpanded[index] ?? index === 0) ? "▲" : "▼"}</div>
                                </button>

                                {(optionsExpanded[index] ?? index === 0) && (
                                  <div className="border-t border-border p-5">
                                    <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                                      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
                                        Options are displayed to students exactly in the order shown
                                        below. You can add, edit or remove options at any time.
                                      </div>

                                      <div className="space-y-3">
                                        {question.options.length < 2 && (
                                          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                                            At least two options are recommended.
                                          </div>
                                        )}

                                        {question.options.some(
                                          (option) => option.trim() === "",
                                        ) && (
                                          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                            One or more options are empty.
                                          </div>
                                        )}

                                        {new Set(
                                          question.options
                                            .map((option) => option.trim().toLowerCase())
                                            .filter(Boolean),
                                        ).size !==
                                          question.options.filter((option) => option.trim())
                                            .length && (
                                          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                            Duplicate options detected.
                                          </div>
                                        )}
                                        {question.options.map((option, optionIndex) => (
                                          <div
                                            key={`${question.question_id ?? "new"}-${optionIndex}`}
                                            className="grid grid-cols-[40px_1fr_auto] items-center gap-3"
                                          >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-semibold">
                                              {optionIndex + 1}
                                            </div>
                                            <input
                                              disabled={readOnly}
                                              className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm"
                                              value={option}
                                              placeholder={`Option ${optionIndex + 1}`}
                                              onChange={(e) =>
                                                updateOption(index, optionIndex, e.target.value)
                                              }
                                            />

                                            {!readOnly ? (
                                              <button
                                                type="button"
                                                onClick={() => removeOption(index, optionIndex)}
                                                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                              >
                                                Delete
                                              </button>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>

                                      {!readOnly ? (
                                        <button
                                          type="button"
                                          onClick={() => addOption(index)}
                                          className="mt-5 rounded-xl border border-dashed border-border bg-background px-5 py-3 text-sm font-medium transition hover:bg-muted"
                                        >
                                          + Add Another Option
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {renderValidationEditor(question, index) && (
                              <div className="rounded-xl border border-border bg-muted/10">
                                <button
                                  type="button"
                                  onClick={() => toggleValidation(index)}
                                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                                >
                                  <div>
                                    <div className="font-medium">Validation Rules</div>

                                    <div className="text-xs text-muted-foreground">
                                      Configure validation for this question
                                    </div>
                                  </div>

                                  <div className="text-sm">
                                    {(validationExpanded[index] ?? index === 0) ? "▲" : "▼"}
                                  </div>
                                </button>

                                {(validationExpanded[index] ?? index === 0) && (
                                  <div className="border-t border-border p-5">
                                    {renderValidationEditor(question, index)}
                                  </div>
                                )}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => togglePreview(index)}
                              className="mb-4 flex w-full items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-left text-sm font-medium transition hover:bg-muted"
                            >
                              <span>
                                {previewVisible ? "Hide Student Preview" : "Show Student Preview"}
                              </span>

                              <span>{previewVisible ? "▲" : "▼"}</span>
                            </button>
                          </>
                        </>
                      </div>
                    )}
                  </div>

                  <div
                    className={`bg-slate-50 p-6 ${
                      previewVisible ? "border-t border-border lg:border-l lg:border-t-0" : "hidden"
                    }`}
                  >
                    {previewVisible && <PreviewQuestionCard question={question} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
