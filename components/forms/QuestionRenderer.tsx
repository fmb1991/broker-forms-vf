"use client";

import { useMemo } from "react";

/**
 * Generic types your RPC returns
 */
export type TableSchemaField = {
  key: string;
  type: "text" | "boolean" | "number" | "date" | "currency";
  label?: Record<string, string>;
  required?: boolean;
};

export type Option = { value: string; label: string; order: number };
export type TableRow = { row_index: number; row: Record<string, any> };

export type Question = {
  code: string;
  type:
    | "boolean"
    | "single_select"
    | "multi_select"
    | "date"
    | "currency"
    | "text"
    | "number"
    | "attachment"
    | "table";
  label: string;
  help?: string;
  config?: {
    currency?: string;
    decimals?: number;
    table_schema?: TableSchemaField[];
  };
  options?: Option[];
  answer: any;
  table_rows?: TableRow[];
};

export function QuestionCard({
  q,
  lang,
  locked,
  onSaveAnswer,
  onSaveTableRow,
}: {
  q: Question;
  lang: string;
  locked: boolean;
  onSaveAnswer: (code: string, value: any) => Promise<void>;
  onSaveTableRow: (code: string, rowIndex: number, row: any) => Promise<void>;
}) {
  const label = (
    <div className="mb-2">
      <div className="font-semibold">{q.label}</div>
      {!!q.help && <div className="text-sm text-muted-foreground">{q.help}</div>}
    </div>
  );

  // ---- Renderers for each type ----
  function renderBoolean() {
    return (
      <div className="space-x-6">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            disabled={locked}
            checked={q.answer === true}
            onChange={async () => !locked && (await onSaveAnswer(q.code, true))}
          />
          <span>Sim</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            disabled={locked}
            checked={q.answer === false}
            onChange={async () => !locked && (await onSaveAnswer(q.code, false))}
          />
          <span>Não</span>
        </label>
      </div>
    );
  }

  function renderSingleSelect() {
    return (
      <select
        className="border rounded p-2 w-full"
        disabled={locked}
        value={q.answer ?? ""}
        onChange={async (e) => !locked && (await onSaveAnswer(q.code, e.target.value))}
      >
        <option value="" disabled>
          Selecione
        </option>
        {(q.options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  function renderMultiSelect() {
    const current = Array.isArray(q.answer) ? new Set(q.answer) : new Set<string>();
    return (
      <div className="flex flex-wrap gap-4">
        {(q.options || []).map((o) => {
          const checked = current.has(o.value);
          return (
            <label key={o.value} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                disabled={locked}
                checked={checked}
                onChange={async (e) => {
                  const next = new Set(current);
                  if (e.target.checked) next.add(o.value);
                  else next.delete(o.value);
                  await onSaveAnswer(q.code, Array.from(next));
                }}
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  function renderDate() {
    return (
      <input
        type="date"
        className="border rounded p-2"
        disabled={locked}
        value={(q.answer as string) || ""}
        onChange={async (e) => !locked && (await onSaveAnswer(q.code, e.target.value))}
      />
    );
  }

  function renderCurrency() {
    const decimals = q.config?.decimals ?? 2;
    const currency = q.config?.currency ?? "BRL";
    const cents = q.answer?.amount_cents ?? null;
    const display = cents != null ? (cents / 100).toFixed(decimals) : "";
    return (
      <div className="flex items-center gap-2">
        <span>{currency === "BRL" ? "R$" : currency}</span>
        <input
          className="border rounded p-2"
          placeholder={(0).toFixed(decimals)}
          disabled={locked}
          value={display}
          onChange={async (e) => {
            if (locked) return;
            const clean = e.target.value.replace(/\./g, "").replace(",", ".");
            const num = Number.isFinite(Number(clean)) ? Number(clean) : 0;
            await onSaveAnswer(q.code, {
              amount_cents: Math.round(num * 10 ** decimals),
              currency,
            });
          }}
        />
      </div>
    );
  }

  function renderText() {
    return (
      <textarea
        className="border rounded p-2 w-full min-h-[96px]"
        disabled={locked}
        value={(q.answer as string) || ""}
        onChange={async (e) => !locked && (await onSaveAnswer(q.code, e.target.value))}
      />
    );
  }

  function renderNumber() {
    return (
      <input
        type="number"
        className="border rounded p-2"
        disabled={locked}
        value={q.answer ?? ""}
        onChange={async (e) => {
          if (locked) return;
          const n = e.target.value === "" ? null : Number(e.target.value);
          await onSaveAnswer(q.code, n);
        }}
      />
    );
  }

  function renderAttachment() {
    // UI only for now; wire to Supabase Storage later
    return (
      <div className="space-y-2">
        <input type="file" className="block w-full" disabled />
        <div className="text-sm text-muted-foreground">
          Upload seguro via URL assinada (em breve). Por enquanto, campo desabilitado.
        </div>
      </div>
    );
  }

  function fieldLabel(f: TableSchemaField) {
    if (!f.label) return f.key;
    return f.label[lang] || f.label["pt-BR"] || f.label["en"] || f.key;
  }

  function renderTable() {
    const schema = q.config?.table_schema || [];
    const rows = q.table_rows || [];

    async function addRow() {
      if (locked) return;
      const nextIndex = rows.length ? Math.max(...rows.map((r) => r.row_index)) + 1 : 0;
      await onSaveTableRow(q.code, nextIndex, {});
    }

    async function updateCell(rowIndex: number, key: string, val: any) {
      if (locked) return;
      const current = rows.find((r) => r.row_index === rowIndex)?.row || {};
      await onSaveTableRow(q.code, rowIndex, { ...current, [key]: val });
    }

    return (
      <div className="space-y-3">
        {/* header */}
        <div
          className="grid font-semibold"
          style={{ gridTemplateColumns: `repeat(${schema.length}, minmax(0,1fr))`, gap: 12 }}
        >
          {schema.map((f) => (
            <div key={`hdr-${f.key}`}>{fieldLabel(f)}</div>
          ))}
        </div>

        {/* rows */}
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.row_index}
              className="grid"
              style={{ gridTemplateColumns: `repeat(${schema.length}, minmax(0,1fr))`, gap: 12 }}
            >
              {schema.map((f) => {
                const v = r.row?.[f.key];
                if (f.type === "boolean") {
                  return (
                    <label key={`${r.row_index}-${f.key}`} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={!!v}
                        onChange={async (e) => updateCell(r.row_index, f.key, e.target.checked)}
                      />
                      <span>{fieldLabel(f)}</span>
                    </label>
                  );
                }
                if (f.type === "number") {
                  return (
                    <input
                      key={`${r.row_index}-${f.key}`}
                      className="border rounded p-2"
                      type="number"
                      disabled={locked}
                      value={v ?? ""}
                      onChange={async (e) =>
                        updateCell(r.row_index, f.key, e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  );
                }
                if (f.type === "date") {
                  return (
                    <input
                      key={`${r.row_index}-${f.key}`}
                      className="border rounded p-2"
                      type="date"
                      disabled={locked}
                      value={(v as string) || ""}
                      onChange={async (e) => updateCell(r.row_index, f.key, e.target.value)}
                    />
                  );
                }
                // default text
                return (
                  <input
                    key={`${r.row_index}-${f.key}`}
                    className="border rounded p-2"
                    disabled={locked}
                    value={v ?? ""}
                    onChange={async (e) => updateCell(r.row_index, f.key, e.target.value)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {!locked && (
          <div className="pt-2">
            <button className="px-3 py-2 rounded border" onClick={addRow}>
              Adicionar linha
            </button>
          </div>
        )}
      </div>
    );
  }

  function inner() {
    switch (q.type) {
      case "boolean":
        return renderBoolean();
      case "single_select":
        return renderSingleSelect();
      case "multi_select":
        return renderMultiSelect();
      case "date":
        return renderDate();
      case "currency":
        return renderCurrency();
      case "text":
        return renderText();
      case "number":
        return renderNumber();
      case "attachment":
        return renderAttachment();
      case "table":
        return renderTable();
      default:
        return <div className="text-sm text-muted-foreground">Tipo não suportado: {q.type}</div>;
    }
  }

  return (
    <div className="rounded-lg border p-4 bg-card">
      {label}
      {inner()}
    </div>
  );
}
