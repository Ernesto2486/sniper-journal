"use client";

import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { importTradesAction } from "@/app/(app)/import/actions";
import type { TradingAccount } from "@/lib/types";

type ImportColumnKey =
  | "date"
  | "time"
  | "market"
  | "instrument"
  | "direction"
  | "entryPrice"
  | "exitPrice"
  | "stopLoss"
  | "takeProfit"
  | "size"
  | "fees"
  | "resultUsd"
  | "account"
  | "setup"
  | "notes";

type CsvRow = Record<string, string>;

type ImportResult = Awaited<ReturnType<typeof importTradesAction>>;

const fields: Array<{ key: ImportColumnKey; label: string; required?: boolean; aliases: string[] }> = [
  { key: "date", label: "Date", required: true, aliases: ["date", "trade date", "opened", "entry date"] },
  { key: "time", label: "Time", aliases: ["time", "entry time", "opened time"] },
  { key: "market", label: "Market", required: true, aliases: ["market", "asset class", "type"] },
  { key: "instrument", label: "Instrument / Ticker", required: true, aliases: ["instrument", "ticker", "symbol", "contract"] },
  { key: "direction", label: "Direction", required: true, aliases: ["direction", "side", "buy/sell", "long/short"] },
  { key: "entryPrice", label: "Entry price", required: true, aliases: ["entry", "entry price", "open price", "avg entry"] },
  { key: "exitPrice", label: "Exit price", required: true, aliases: ["exit", "exit price", "close price", "avg exit"] },
  { key: "stopLoss", label: "Stop loss", required: true, aliases: ["stop", "stop loss", "sl"] },
  { key: "takeProfit", label: "Take profit", required: true, aliases: ["target", "take profit", "tp"] },
  { key: "size", label: "Size / Contracts", required: true, aliases: ["size", "contracts", "qty", "quantity", "shares"] },
  { key: "fees", label: "Fees", aliases: ["fees", "commission", "commissions"] },
  { key: "resultUsd", label: "P/L", required: true, aliases: ["p/l", "pl", "pnl", "profit", "profit loss", "realized p/l", "net pnl"] },
  { key: "account", label: "Account", aliases: ["account", "account name", "brokerage account"] },
  { key: "setup", label: "Setup", aliases: ["setup", "strategy", "playbook"] },
  { key: "notes", label: "Notes", aliases: ["notes", "comment", "comments", "review"] }
];

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = rows[0] ?? [];
  const data = rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));

  return { headers, data };
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function autoDetect(headers: string[]) {
  const mapping: Partial<Record<ImportColumnKey, string>> = {};
  const normalized = headers.map((header) => ({ raw: header, clean: normalizeHeader(header) }));

  for (const field of fields) {
    const exact = normalized.find((header) => field.aliases.includes(header.clean));
    const partial = normalized.find((header) => field.aliases.some((alias) => header.clean.includes(alias) || alias.includes(header.clean)));
    mapping[field.key] = exact?.raw ?? partial?.raw ?? "";
  }

  return mapping;
}

export function TradeImportClient({
  accounts,
  defaultAccountId,
  isDemo
}: {
  accounts: TradingAccount[];
  defaultAccountId: string;
  isDemo: boolean;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportColumnKey, string>>>({});
  const [fallbackAccountId, setFallbackAccountId] = useState(defaultAccountId);
  const [createMissingAccounts, setCreateMissingAccounts] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);
  const missingRequired = fields.filter((field) => field.required && !mapping[field.key]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setResult(null);

    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.headers.length || !parsed.data.length) {
      setError("No CSV rows found. Check that the file has a header row and trade rows.");
      return;
    }

    setHeaders(parsed.headers);
    setRows(parsed.data);
    setMapping(autoDetect(parsed.headers));
  }

  function updateMapping(key: ImportColumnKey, value: string) {
    setMapping((current) => ({ ...current, [key]: value }));
  }

  function submitImport() {
    setError("");
    setResult(null);

    if (isDemo) {
      setError("Demo mode is read-only. Connect Supabase to import trades.");
      return;
    }

    if (!rows.length) {
      setError("Upload a CSV before importing.");
      return;
    }

    if (missingRequired.length) {
      setError(`Map required columns first: ${missingRequired.map((field) => field.label).join(", ")}.`);
      return;
    }

    startTransition(async () => {
      const response = await importTradesAction({
        rows,
        mapping,
        fallbackAccountId,
        createMissingAccounts
      });
      setResult(response);
      if (!response.ok) setError(response.message);
    });
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Import trades</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Upload CSV, map columns, import safely.</h1>
            <p className="mt-3 max-w-3xl text-slate-400">Preview every file before importing. Duplicate checks use date, time, instrument, direction, size, entry, exit, and P/L.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-right">
            <p className="label">Rows loaded</p>
            <p className="text-3xl font-semibold">{rows.length}</p>
          </div>
        </div>
      </section>

      <section className="panel grid gap-5 p-6 lg:grid-cols-[1fr_340px]">
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center transition hover:border-emerald-400/40 hover:bg-emerald-400/5">
          <UploadCloud className="h-10 w-10 text-emerald-300" />
          <span className="mt-4 text-lg font-semibold">Choose CSV file</span>
          <span className="mt-2 text-sm text-slate-400">Comma-separated exports from brokers, spreadsheets, or trackers.</span>
          <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>

        <div className="space-y-4">
          <div>
            <label className="label">Default import account</label>
            <select className="field" value={fallbackAccountId} onChange={(event) => setFallbackAccountId(event.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.accountName}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
            <span>Create missing CSV accounts</span>
            <input type="checkbox" className="h-4 w-4 accent-emerald-400" checked={createMissingAccounts} onChange={() => setCreateMissingAccounts((current) => !current)} />
          </label>
          <button onClick={submitImport} disabled={isPending || !rows.length || isDemo} className="w-full rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
            {isPending ? "Importing..." : "Import trades"}
          </button>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      {result ? (
        <section className="grid gap-4 md:grid-cols-4">
          <ResultCard label="Total rows" value={result.totalRows} />
          <ResultCard label="Imported" value={result.importedRows} tone="profit" />
          <ResultCard label="Skipped duplicates" value={result.skippedDuplicates} />
          <ResultCard label="Failed rows" value={result.failedRows} tone={result.failedRows ? "loss" : "neutral"} />
        </section>
      ) : null}

      {headers.length ? (
        <section className="panel p-6">
          <div className="mb-5 flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold tracking-tight">Column mapping</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="label">{field.label}{field.required ? " *" : ""}</label>
                <select className="field" value={mapping[field.key] ?? ""} onChange={(event) => updateMapping(field.key, event.target.value)}>
                  <option value="">Not mapped</option>
                  {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {previewRows.length ? (
        <section className="panel p-0">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-semibold tracking-tight">Preview</h2>
            <p className="mt-2 text-sm text-slate-400">Showing the first {previewRows.length} rows before import.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-4 py-3">{header}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/40">
                {previewRows.map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => <td key={header} className="whitespace-nowrap px-4 py-3 text-slate-300">{row[header]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result?.failures.length ? (
        <section className="panel p-6">
          <h2 className="text-xl font-semibold tracking-tight">Failed rows</h2>
          <div className="mt-4 space-y-2 text-sm text-rose-100">
            {result.failures.slice(0, 20).map((failure) => (
              <p key={`${failure.rowNumber}-${failure.reason}`} className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3">
                Row {failure.rowNumber}: {failure.reason}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ResultCard({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "profit" | "loss" | "neutral" }) {
  return (
    <div className="panel p-5">
      <p className="label">{label}</p>
      <p className={`text-3xl font-semibold ${tone === "profit" ? "text-emerald-300" : tone === "loss" ? "text-rose-300" : ""}`}>{value}</p>
    </div>
  );
}
