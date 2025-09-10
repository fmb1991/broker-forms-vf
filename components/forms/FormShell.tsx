"use client";

import { Question, QuestionCard } from "./QuestionRenderer";

export type Payload = {
  form: { id: string; status: "draft" | "submitted"; company?: string; contact?: any };
  questions: Question[];
};

function percentComplete(questions: Question[]) {
  if (!questions?.length) return 0;
  const isAnswered = (q: Question) => {
    if (q.type === "multi_select") return Array.isArray(q.answer) && q.answer.length > 0;
    if (q.type === "table") return Array.isArray(q.table_rows) && q.table_rows.length > 0;
    return q.answer !== null && q.answer !== undefined && q.answer !== "";
  };
  const done = questions.filter(isAnswered).length;
  return Math.round((done / questions.length) * 100);
}

export function FormShell({
  payload,
  lang,
  submitting,
  onSaveAnswer,
  onSaveTableRow,
  onSubmitForm,
}: {
  payload: Payload;
  lang: string;
  submitting: boolean;
  onSaveAnswer: (code: string, value: any) => Promise<void>;
  onSaveTableRow: (code: string, rowIndex: number, row: any) => Promise<void>;
  onSubmitForm: () => Promise<void>;
}) {
  const locked = payload.form.status === "submitted";
  const pct = percentComplete(payload.questions);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Questionário</h1>
        <div className="text-muted-foreground">
          Empresa: {payload.form.company || "—"}{" "}
          {locked && <span className="text-emerald-600 font-semibold">— Enviado</span>}
        </div>

        {/* progress */}
        <div className="mt-2">
          <div className="h-2 rounded bg-muted overflow-hidden">
            <div
              className="h-2 bg-primary transition-all"
              style={{ width: `${pct}%` }}
              aria-label={`Progresso ${pct}%`}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{pct}% completo</div>
        </div>
      </header>

      {/* Questions */}
      <div className="space-y-4">
        {payload.questions.map((q) => (
          <QuestionCard
            key={q.code}
            q={q}
            lang={lang}
            locked={locked}
            onSaveAnswer={onSaveAnswer}
            onSaveTableRow={onSaveTableRow}
          />
        ))}
      </div>

      {/* Sticky Submit Bar */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t mt-4">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {locked ? "Formulário já enviado." : "Revise suas respostas antes de enviar."}
          </div>
          <button
            className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
            onClick={onSubmitForm}
            disabled={locked || submitting}
          >
            {locked ? "Enviado" : submitting ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
