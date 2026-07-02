import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export type RecruitmentQuestionType =
  | "text"
  | "paragraph"
  | "number"
  | "date"
  | "dropdown"
  | "mcq"
  | "checkbox"
  | "file"
  | "url"
  | "email"
  | "phone";

export type RecruitmentQuestionValidation = {
  minLength?: number | "";
  maxLength?: number | "";
  alphaOnly?: boolean;

  min?: number | "";
  max?: number | "";
  minDigits?: number | "";
  maxDigits?: number | "";

  minDate?: string;
  maxDate?: string;

  minSelection?: number | "";
  maxSelection?: number | "";

  allowedExtensions?: string[];
  maxSizeMb?: number | "";
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
  { label: "File Upload", value: "file" },
  { label: "URL", value: "url" },
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
];

const FILE_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "xls", "xlsx", "zip", "rar"];

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function createEmptyQuestion(): RecruitmentQuestion {
  return {
    question_id: null,
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
    case "file":
      return "Upload a file";
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

function PreviewQuestionCard({ question }: { question: RecruitmentQuestion }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Student View
          </div>
          <h4 className="mt-2 text-base font-semibold leading-6">
            {question.question_title.trim() !== "" ? question.question_title : "Untitled Question"}
            {question.is_required ? <span className="ml-1 text-red-500">*</span> : null}
          </h4>
          {question.question_description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
        ) : question.question_type === "file" ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
            <div className="font-medium">Choose File</div>
            <div className="mt-1">{previewPlaceholderForType(question.question_type)}</div>
          </div>
        ) : isMultiOptionType(question.question_type) ? (
          <div className="space-y-2">
            {(question.options?.length ? question.options : ["Option 1", "Option 2"]).map(
              (option, optionIndex) => (
                <label
                  key={`${option}-${optionIndex}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm"
                >
                  {question.question_type === "checkbox" ? (
                    <input type="checkbox" disabled />
                  ) : (
                    <input type="radio" disabled />
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

      {question.validation && Object.keys(question.validation).length > 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          Validation configured
        </div>
      ) : null}
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

  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [previewExpanded, setPreviewExpanded] = useState<Record<number, boolean>>({
    0: false,
  });

  const [validationExpanded, setValidationExpanded] = useState<Record<number, boolean>>({
    0: true,
  });

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

  function addQuestion() {
    if (readOnly) return;

    onChange((previous) => [...previous, createEmptyQuestion()]);

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }

  function updateQuestion(index: number, field: keyof RecruitmentQuestion, value: any) {
    if (readOnly) return;

    onChange((previous) => {
      const copy = [...previous];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
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

    onChange((previous) => {
      const current = previous[index];
      if (!current) return previous;

      const cloned: RecruitmentQuestion = {
        ...JSON.parse(JSON.stringify(current)),
        question_id: null,
        question_title: current.question_title ? `${current.question_title} Copy` : "Copy",
      };

      const copy = [...previous];
      copy.splice(index + 1, 0, cloned);
      return copy;
    });
  }

  function deleteQuestion(index: number) {
    if (readOnly) return;

    if (!window.confirm("Delete this question?")) return;

    onChange((previous) => previous.filter((_, i) => i !== index));
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

  function toggleAllowedExtension(index: number, ext: string, checked: boolean) {
    if (readOnly) return;

    const existing = questions[index]?.validation?.allowedExtensions || [];
    const next = checked
      ? Array.from(new Set([...existing, ext]))
      : existing.filter((item: string) => item !== ext);

    updateValidation(index, "allowedExtensions", next);
  }

  function renderValidationEditor(question: RecruitmentQuestion, index: number) {
    if (question.question_type === "text") {
      return (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Validation</div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Min Length"
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
              placeholder="Max Length"
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
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Validation</div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Min Length"
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
              placeholder="Max Length"
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
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
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

    if (question.question_type === "date") {
      return (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Validation</div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="date"
              value={question.validation?.minDate || ""}
              onChange={(e) => updateValidation(index, "minDate", e.target.value)}
            />

            <input
              disabled={readOnly}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="date"
              value={question.validation?.maxDate || ""}
              onChange={(e) => updateValidation(index, "maxDate", e.target.value)}
            />
          </div>
        </div>
      );
    }

    if (question.question_type === "checkbox") {
      return (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
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

    if (question.question_type === "file") {
      const allowedExtensions: string[] = question.validation?.allowedExtensions || [];

      return (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-700">Validation</div>

          <div className="grid gap-2 md:grid-cols-2">
            {FILE_EXTENSIONS.map((ext) => (
              <label
                key={ext}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <input
                  disabled={readOnly}
                  type="checkbox"
                  checked={allowedExtensions.includes(ext)}
                  onChange={(e) => toggleAllowedExtension(index, ext, e.target.checked)}
                />
                .{ext}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <input
              disabled={readOnly}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
              type="number"
              placeholder="Maximum File Size (MB)"
              value={question.validation?.maxSizeMb || ""}
              onChange={(e) =>
                updateValidation(
                  index,
                  "maxSizeMb",
                  e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
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
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="text-sm text-muted-foreground">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-2 text-sm text-muted-foreground">
              {questionCount} question(s) configured
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
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <div className="text-5xl">📝</div>
          <h3 className="mt-4 text-xl font-semibold">No questions added yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add optional questions for this recruitment, or skip this step and continue.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((question, index) => {
            const isExpanded = expandedQuestions[index] ?? index === 0;
            const previewVisible = previewExpanded[index] ?? false;

            return (
              <div
                key={`${question.question_id ?? "new"}-${index}`}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
              >
                <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">

  <div className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                            Question {index + 1}
                          </div>

                          <div className="font-semibold">
                            {question.question_title.trim() !== ""
                              ? question.question_title
                              : "Untitled Question"}
                          </div>

                          <span className="rounded-full bg-muted px-2 py-1 text-[11px]">
                            {
                              QUESTION_TYPE_OPTIONS.find((x) => x.value === question.question_type)
                                ?.label
                            }
                          </span>

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
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateQuestion(index)}
                            className="rounded-xl border px-3 py-2 text-sm"
                          >
                            Duplicate
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteQuestion(index)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Question Title</label>
                        <input
                          disabled={readOnly}
                          className="w-full rounded-xl border border-border px-4 py-3 text-sm"
                          placeholder="Question title"
                          value={question.question_title}
                          onChange={(e) => updateQuestion(index, "question_title", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Description <span className="text-muted-foreground">(optional)</span>
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
                          <label className="mb-2 block text-sm font-medium">Question Type</label>
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
                          <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm">
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

                      <div className="rounded-2xl border border-border bg-muted/10">
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

                      {isMultiOptionType(question.question_type) ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
                          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-700">
                            Options are displayed to students exactly in the order shown below. You
                            can add, edit or remove options at any time.
                          </div>

                          <div className="space-y-3">
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
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
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
                      ) : null}
                    </div>
                  )}

                  <div className="border-t border-border bg-slate-50 p-6 lg:border-l lg:border-t-0">
                    <button
                      type="button"
                      onClick={() => togglePreview(index)}
                      className="mb-4 w-full rounded-xl border border-border bg-white px-4 py-3 text-left text-sm font-medium hover:bg-muted"
                    >
                      {previewVisible ? "▲ Hide Student Preview" : "▼ Show Student Preview"}
                    </button>

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
