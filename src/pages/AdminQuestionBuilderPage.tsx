import { useEffect, useMemo, useState } from "react";
import { adminQuestionService } from "@/services/adminQuestionService";

type Question = {
  question_id: string | null;
  question_title: string;
  question_type: string;
  is_required: boolean;
  validation?: any;
  options: string[];
};

export function AdminQuestionBuilderPage({
  opportunityId,
}: {
  opportunityId: string;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [original, setOriginal] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [opportunityId]);

  async function load() {
    setLoading(true);

    const data = await adminQuestionService.getQuestions(opportunityId);

    const formatted = (data || []).map((q: any) => ({
      question_id: q.question_id,
      question_title: q.question_title ?? "",
      question_type: q.question_type ?? "text",
      is_required: q.is_required ?? false,
      validation: q.validation ?? {},
      options:
        q.opportunity_question_options?.map((o: any) => o.option_text) || [],
    }));

    setQuestions(formatted);
    setOriginal(JSON.parse(JSON.stringify(formatted)));
    setLoading(false);
  }

  const hasChanges = useMemo(
    () => JSON.stringify(questions) !== JSON.stringify(original),
    [questions, original]
  );

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        question_id: null,
        question_title: "",
        question_type: "text",
        is_required: false,
        validation: {},
        options: [],
      },
    ]);

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }

  function updateQuestion(index: number, field: string, value: any) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function updateValidation(index: number, field: string, value: any) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        validation: {
          ...(copy[index].validation || {}),
          [field]: value,
        },
      };
      return copy;
    });
  }

  function duplicateQuestion(index: number) {
    const current = questions[index];
    if (!current) return;

    const cloned = {
      ...JSON.parse(JSON.stringify(current)),
      question_id: null,
      question_title: current.question_title ? `${current.question_title} Copy` : "Copy",
    };

    const copy = [...questions];
    copy.splice(index + 1, 0, cloned);
    setQuestions(copy);
  }

  function deleteQuestion(index: number) {
    if (!window.confirm("Delete this question?")) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addOption(index: number) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        options: [...(copy[index].options || []), ""],
      };
      return copy;
    });
  }

  function removeOption(index: number, optionIndex: number) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        options: (copy[index].options || []).filter(
          (_, i) => i !== optionIndex
        ),
      };
      return copy;
    });
  }

  async function saveQuestions() {
    if (saving) return;

    setSaving(true);

    try {
      for (const q of questions) {
        if (!q.question_title.trim()) {
          alert("Question title cannot be empty");
          return;
        }

        if (["dropdown", "mcq", "checkbox"].includes(q.question_type)) {
          if ((q.options || []).length < 2) {
            alert(`"${q.question_title}" requires minimum 2 options`);
            return;
          }

          if ((q.options || []).some((x) => !x.trim())) {
            alert("Option cannot be empty");
            return;
          }
        }

        if (q.question_type === "file") {
          const allowed = q.validation?.allowedExtensions || [];
          if (allowed.length === 0) {
            alert(`"${q.question_title}" file question needs at least one allowed file type`);
            return;
          }

          if (
            q.validation?.maxSizeMb !== undefined &&
            Number(q.validation?.maxSizeMb) <= 0
          ) {
            alert(`"${q.question_title}" maximum file size must be greater than 0`);
            return;
          }
        }
      }

      await adminQuestionService.saveQuestions(opportunityId, questions);
      await load();
      setOriginal(JSON.parse(JSON.stringify(questions)));
      alert("Questions saved successfully");
    } finally {
      setSaving(false);
    }
  }

  function resetChanges() {
    if (!window.confirm("Discard unsaved changes?")) return;
    setQuestions(JSON.parse(JSON.stringify(original)));
  }

  function renderValidationBuilder(q: Question, index: number) {
    if (q.question_type === "text") {
      return (
        <div className="mt-3 space-y-2">
          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Min Length"
            value={q.validation?.minLength || ""}
            onChange={(e) =>
              updateValidation(index, "minLength", e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Max Length"
            value={q.validation?.maxLength || ""}
            onChange={(e) =>
              updateValidation(index, "maxLength", e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <label className="block">
            <input
              type="checkbox"
              checked={q.validation?.alphaOnly || false}
              onChange={(e) =>
                updateValidation(index, "alphaOnly", e.target.checked)
              }
            />
            {" "}Only Alphabets
          </label>
        </div>
      );
    }

    if (q.question_type === "paragraph") {
      return (
        <div className="mt-3 space-y-2">
          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Min Length"
            value={q.validation?.minLength || ""}
            onChange={(e) =>
              updateValidation(index, "minLength", e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Max Length"
            value={q.validation?.maxLength || ""}
            onChange={(e) =>
              updateValidation(index, "maxLength", e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
      );
    }

    if (q.question_type === "number") {
      return (
        <div className="mt-3 space-y-2">
          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Minimum Value"
            value={q.validation?.min || ""}
            onChange={(e) =>
              updateValidation(index, "min", e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Maximum Value"
            value={q.validation?.max || ""}
            onChange={(e) =>
              updateValidation(index, "max", e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Minimum Digits"
            value={q.validation?.minDigits || ""}
            onChange={(e) =>
              updateValidation(index, "minDigits", e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Maximum Digits"
            value={q.validation?.maxDigits || ""}
            onChange={(e) =>
              updateValidation(index, "maxDigits", e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
      );
    }

    if (q.question_type === "date") {
      return (
        <div className="mt-3 space-y-2">
          <input
            className="border p-2 w-full"
            type="date"
            value={q.validation?.minDate || ""}
            onChange={(e) =>
              updateValidation(index, "minDate", e.target.value)
            }
          />

          <input
            className="border p-2 w-full"
            type="date"
            value={q.validation?.maxDate || ""}
            onChange={(e) =>
              updateValidation(index, "maxDate", e.target.value)
            }
          />
        </div>
      );
    }

    if (q.question_type === "checkbox") {
      return (
        <div className="mt-3 space-y-2">
          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Minimum Selections"
            value={q.validation?.minSelection || ""}
            onChange={(e) =>
              updateValidation(index, "minSelection", e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Maximum Selections"
            value={q.validation?.maxSelection || ""}
            onChange={(e) =>
              updateValidation(index, "maxSelection", e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
      );
    }

    if (q.question_type === "file") {
      const allowedExtensions: string[] = q.validation?.allowedExtensions || [];
      const toggleExtension = (ext: string, checked: boolean) => {
        const next = checked
          ? Array.from(new Set([...allowedExtensions, ext]))
          : allowedExtensions.filter((x) => x !== ext);
        updateValidation(index, "allowedExtensions", next);
      };

      return (
        <div className="mt-3 space-y-3 rounded border bg-slate-50 p-3">
          <div className="font-medium">Allowed File Types</div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("pdf")}
              onChange={(e) => toggleExtension("pdf", e.target.checked)}
            />
            PDF
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("doc")}
              onChange={(e) => toggleExtension("doc", e.target.checked)}
            />
            DOC
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("docx")}
              onChange={(e) => toggleExtension("docx", e.target.checked)}
            />
            DOCX
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("jpg")}
              onChange={(e) => toggleExtension("jpg", e.target.checked)}
            />
            JPG
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("jpeg")}
              onChange={(e) => toggleExtension("jpeg", e.target.checked)}
            />
            JPEG
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("png")}
              onChange={(e) => toggleExtension("png", e.target.checked)}
            />
            PNG
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("xls")}
              onChange={(e) => toggleExtension("xls", e.target.checked)}
            />
            XLS
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("xlsx")}
              onChange={(e) => toggleExtension("xlsx", e.target.checked)}
            />
            XLSX
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("zip")}
              onChange={(e) => toggleExtension("zip", e.target.checked)}
            />
            ZIP
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowedExtensions.includes("rar")}
              onChange={(e) => toggleExtension("rar", e.target.checked)}
            />
            RAR
          </label>

          <input
            className="border p-2 w-full"
            type="number"
            placeholder="Maximum File Size (MB)"
            value={q.validation?.maxSizeMb || ""}
            onChange={(e) =>
              updateValidation(index, "maxSizeMb", e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
      );
    }

    return null;
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="sticky top-0 z-50 mb-6 flex gap-3 border-b bg-white p-4">
        <button className="border px-4 py-2" onClick={addQuestion}>
          + Add Question
        </button>

        <button
          className="border px-4 py-2"
          disabled={!hasChanges || saving}
          onClick={saveQuestions}
        >
          {saving ? "Saving..." : "Save Questions"}
        </button>

        <button
          className="border px-4 py-2"
          disabled={!hasChanges}
          onClick={resetChanges}
        >
          Cancel Changes
        </button>
      </div>

      {questions.map((q, index) => (
        <div
          key={`${q.question_id}-${index}`}
          className="mb-6 rounded border p-5"
        >
          <h3 className="mb-4 font-semibold">Question {index + 1}</h3>

          <input
            className="w-full border p-3"
            placeholder="Question title"
            value={q.question_title}
            onChange={(e) =>
              updateQuestion(index, "question_title", e.target.value)
            }
          />

          <select
            className="mt-3 border p-2"
            value={q.question_type}
            onChange={(e) =>
              updateQuestion(index, "question_type", e.target.value)
            }
          >
            <option value="text">Short Answer</option>
            <option value="paragraph">Paragraph</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="dropdown">Dropdown</option>
            <option value="mcq">Multiple Choice</option>
            <option value="checkbox">Checkbox</option>
            <option value="file">File Upload</option>
          </select>

          {renderValidationBuilder(q, index)}

          {["dropdown", "mcq", "checkbox"].includes(q.question_type) && (
            <div className="mt-4">
              {q.options.map((option, optionIndex) => (
                <div key={optionIndex} className="mb-2 flex gap-2">
                  <input
                    className="flex-1 border p-2"
                    value={option}
                    placeholder={`Option ${optionIndex + 1}`}
                    onChange={(e) => {
                      const options = [...q.options];
                      options[optionIndex] = e.target.value;
                      updateQuestion(index, "options", options);
                    }}
                  />

                  <button
                    className="border px-3"
                    onClick={() => removeOption(index, optionIndex)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                className="border px-3 py-1"
                onClick={() => addOption(index)}
              >
                + Option
              </button>
            </div>
          )}

          <label className="mt-4 block">
            <input
              type="checkbox"
              checked={q.is_required}
              onChange={(e) =>
                updateQuestion(index, "is_required", e.target.checked)
              }
            />{" "}
            Required
          </label>

          <div className="mt-5 flex gap-3">
            <button
              className="border px-3 py-1"
              onClick={() => duplicateQuestion(index)}
            >
              Duplicate
            </button>

            <button
              className="border px-3 py-1"
              onClick={() => deleteQuestion(index)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
