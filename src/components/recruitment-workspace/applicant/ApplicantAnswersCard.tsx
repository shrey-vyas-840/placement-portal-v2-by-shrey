interface ApplicantAnswer {
  questionId: string;
  questionTitle: string;
  questionType: string;
  answer: any;
}

interface Props {
  answers: ApplicantAnswer[];
}

function formatAnswer(value: any): string {
  if (value == null) return "-";

  if (typeof value === "string") return value;

  if (typeof value === "number") return value.toString();

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    if ("value" in value) {
      return formatAnswer(value.value);
    }

    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function ApplicantAnswersCard({
  answers,
}: Props) {
  return (
    <div className="rounded-2xl border p-5">

      <h3 className="mb-4 text-lg font-semibold">
        Application Answers
      </h3>

      {answers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No application answers found.
        </div>
      ) : (
        <div className="space-y-5">

          {answers.map((item) => (

            <div
              key={item.questionId}
              className="rounded-xl bg-muted p-4"
            >

              <div className="text-sm font-semibold">
                {item.questionTitle}
              </div>

              <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {formatAnswer(item.answer)}
              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  );
}