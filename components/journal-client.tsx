"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { AlertTriangle, ImagePlus, Link2, Save, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { loadJournalAction, loadWeeklyPlanAction, loadWeeklyReviewAction, saveJournalAction, saveWeeklyPlanAction, saveWeeklyReviewAction } from "@/app/(app)/journal/actions";
import { TradeTable } from "@/components/trade-table";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { DailyJournalAttachment, DailyJournalRecord, TradeRecord, TradingAccount, WeeklyPlanBias, WeeklyPlanRecord, WeeklyPlanWatchlistRow, WeeklyReviewRecord } from "@/lib/types";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const moods = [
  { label: "Calm", icon: "??" },
  { label: "Focused", icon: "??" },
  { label: "Tired", icon: "??" },
  { label: "Anxious", icon: "??" },
  { label: "Locked", icon: "??" }
];
const marketConditions = ["Trending", "Range", "Volatile", "News Day"] as const;
const planBiasOptions: WeeklyPlanBias[] = ["Bullish", "Bearish", "Range", "Neutral"];
const checklistItems = [
  ["biasClear", "Bias clear"],
  ["inZone", "In zone"],
  ["liquiditySweep", "Liquidity sweep"],
  ["weakPullback", "Weak pullback"],
  ["volumeConfirms", "Volume confirms"],
  ["aPlusSetup", "A+ setup"],
  ["rrMinimum", "RR minimum 1:2"]
] as const;

function emptyWatchlistRow(): WeeklyPlanWatchlistRow {
  return {
    id: crypto.randomUUID(),
    symbol: "",
    bias: "Neutral",
    keyLevels: "",
    mainSetup: "",
    riskPlan: "",
    notes: ""
  };
}

function emptyWeeklyPlan(weekStartDate: string, accountId: string | null): WeeklyPlanRecord {
  return {
    id: "",
    userId: "",
    accountId,
    weekStartDate,
    mainGoal: "",
    maxWeeklyRisk: "",
    dailyMaxLoss: "",
    psychologyFocus: "",
    rulesForWeek: "",
    allowedSetups: "",
    setupsToAvoid: "",
    stopTradingConditions: "",
    watchlist: []
  };
}
function emptyWeeklyReview(weekStartDate: string, accountId: string | null): WeeklyReviewRecord {
  return {
    id: "",
    userId: "",
    accountId,
    weekStartDate,
    bestTrade: "",
    worstTrade: "",
    bestSetup: "",
    worstMistake: "",
    emotionalState: "",
    disciplineGrade: "",
    executionGrade: "",
    whatWorked: "",
    whatFailed: "",
    needsImprovement: "",
    followedPlan: "",
    forcedTrades: "",
    improveNextWeek: ""
  };
}

function weekKey(date: Date | string) {
  return format(startOfWeek(typeof date === "string" ? parseISO(date) : date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

function buildWeeklyStats(trades: TradeRecord[], weekStartDate: string) {
  const weekStart = parseISO(weekStartDate);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekTrades = trades.filter((trade) => trade.date >= weekStartDate && trade.date <= format(weekEnd, "yyyy-MM-dd"));
  const wins = weekTrades.filter((trade) => trade.resultUsd > 0).length;
  const weeklyPnl = weekTrades.reduce((sum, trade) => sum + trade.resultUsd, 0);
  const dayMap = new Map<string, number>();
  const setupMap = new Map<string, number>();

  for (const trade of weekTrades) {
    dayMap.set(trade.date, (dayMap.get(trade.date) ?? 0) + trade.resultUsd);
    setupMap.set(trade.setup, (setupMap.get(trade.setup) ?? 0) + trade.resultUsd);
  }

  const days = [...dayMap.entries()].sort((left, right) => right[1] - left[1]);
  const setupsByPnl = [...setupMap.entries()].sort((left, right) => right[1] - left[1]);

  return {
    weeklyPnl,
    totalTrades: weekTrades.length,
    winRate: weekTrades.length ? (wins / weekTrades.length) * 100 : 0,
    bestDay: days[0] ? `${format(parseISO(days[0][0]), "EEE MMM d")} (${formatCurrency(days[0][1])})` : "No trades",
    worstDay: days.at(-1) ? `${format(parseISO(days.at(-1)![0]), "EEE MMM d")} (${formatCurrency(days.at(-1)![1])})` : "No trades",
    bestSetup: setupsByPnl[0]?.[0] ?? "No setup"
  };
}
function emptyJournal(journalDate: string): DailyJournalRecord {
  return {
    id: "",
    userId: "",
    journalDate,
    mood: "Focused",
    sleepHours: "",
    marketConditions: "Trending",
    notes: "",
    checklist: Object.fromEntries(checklistItems.map(([key]) => [key, false])) as DailyJournalRecord["checklist"],
    checklistScore: 0,
    tradeStatus: "NO TRADE",
    attachments: [],
    todaysFocus: [],
    playbooks: []
  };
}

export function JournalClient({
  initialJournal,
  trades,
  accounts,
  selectedAccountId,
  setups,
  isDemo
}: {
  initialJournal: DailyJournalRecord | null;
  trades: TradeRecord[];
  accounts: TradingAccount[];
  selectedAccountId: string;
  setups: string[];
  isDemo: boolean;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialJournal?.journalDate ?? format(new Date(), "yyyy-MM-dd"));
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(parseISO(selectedDate)));
  const [journal, setJournal] = useState<DailyJournalRecord>(initialJournal ?? emptyJournal(selectedDate));
  const [tradingViewLink, setTradingViewLink] = useState("");
  const [focusInput, setFocusInput] = useState("");
  const [saveState, setSaveState] = useState(isDemo ? "Demo mode" : "Ready");
  const [tradeWarning, setTradeWarning] = useState("");
  const [journalMode, setJournalMode] = useState<"daily" | "weekly" | "plan">("daily");
  const [selectedWeekStart, setSelectedWeekStart] = useState(weekKey(new Date()));
  const [weeklySelectedAccountId, setWeeklySelectedAccountId] = useState(selectedAccountId);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReviewRecord>(emptyWeeklyReview(weekKey(new Date()), selectedAccountId === "all" ? null : selectedAccountId));
  const [weeklySaveState, setWeeklySaveState] = useState(isDemo ? "Demo mode" : "Ready");
  const [planSelectedAccountId, setPlanSelectedAccountId] = useState(selectedAccountId);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanRecord>(emptyWeeklyPlan(weekKey(new Date()), selectedAccountId === "all" ? null : selectedAccountId));
  const [planSaveState, setPlanSaveState] = useState(isDemo ? "Demo mode" : "Ready");
  const [isPending, startTransition] = useTransition();

  const checklistScore = useMemo(
    () => checklistItems.filter(([key]) => journal.checklist[key]).length,
    [journal.checklist]
  );
  const tradeStatus = checklistScore === checklistItems.length ? "A+ TRADE READY" : "NO TRADE";
  const filteredTrades = useMemo(() => selectedAccountId === "all" ? trades : trades.filter((trade) => trade.tradingAccountId === selectedAccountId), [selectedAccountId, trades]);
  const selectedDayTrades = useMemo(() => filteredTrades.filter((trade) => trade.date === selectedDate), [filteredTrades, selectedDate]);
  const weeklyAccountId = weeklySelectedAccountId === "all" ? null : weeklySelectedAccountId;
  const weeklyFilteredTrades = useMemo(() => weeklySelectedAccountId === "all" ? trades : trades.filter((trade) => trade.tradingAccountId === weeklySelectedAccountId), [trades, weeklySelectedAccountId]);
  const weeklyStats = useMemo(() => buildWeeklyStats(weeklyFilteredTrades, selectedWeekStart), [weeklyFilteredTrades, selectedWeekStart]);
  const planAccountId = planSelectedAccountId === "all" ? null : planSelectedAccountId;
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })
    });
  }, [visibleMonth]);

  useEffect(() => {
    startTransition(async () => {
      const loaded = await loadWeeklyPlanAction(selectedWeekStart, planAccountId);
      setWeeklyPlan(loaded ?? emptyWeeklyPlan(selectedWeekStart, planAccountId));
      setPlanSaveState(isDemo ? "Demo mode" : loaded ? "Loaded" : "New plan");
    });
  }, [isDemo, selectedWeekStart, planAccountId]);

  useEffect(() => {
    if (isDemo || journalMode !== "plan") {
      return;
    }

    const handle = window.setTimeout(() => {
      setPlanSaveState("Saving...");
      startTransition(async () => {
        const result = await saveWeeklyPlanAction(weeklyPlan);
        setPlanSaveState(result.ok ? "Saved" : result.message);
      });
    }, 700);

    return () => window.clearTimeout(handle);
  }, [isDemo, journalMode, weeklyPlan]);
  useEffect(() => {
    startTransition(async () => {
      const loaded = await loadWeeklyReviewAction(selectedWeekStart, weeklyAccountId);
      setWeeklyReview(loaded ?? emptyWeeklyReview(selectedWeekStart, weeklyAccountId));
      setWeeklySaveState(isDemo ? "Demo mode" : loaded ? "Loaded" : "New review");
    });
  }, [isDemo, selectedWeekStart, weeklyAccountId]);

  useEffect(() => {
    if (isDemo || journalMode !== "weekly") {
      return;
    }

    const handle = window.setTimeout(() => {
      setWeeklySaveState("Saving...");
      startTransition(async () => {
        const result = await saveWeeklyReviewAction(weeklyReview);
        setWeeklySaveState(result.ok ? "Saved" : result.message);
      });
    }, 700);

    return () => window.clearTimeout(handle);
  }, [isDemo, journalMode, weeklyReview]);
  useEffect(() => {
    startTransition(async () => {
      const loaded = await loadJournalAction(selectedDate);
      setJournal(loaded ?? emptyJournal(selectedDate));
      setSaveState(isDemo ? "Demo mode" : loaded ? "Loaded" : "New entry");
      setTradeWarning("");
    });
  }, [isDemo, selectedDate]);

  useEffect(() => {
    setJournal((current) => ({ ...current, checklistScore, tradeStatus }));
  }, [checklistScore, tradeStatus]);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    const handle = window.setTimeout(() => {
      setSaveState("Saving...");
      startTransition(async () => {
        const result = await saveJournalAction({ ...journal, checklistScore, tradeStatus });
        setSaveState(result.ok ? "Saved" : result.message);
      });
    }, 700);

    return () => window.clearTimeout(handle);
  }, [checklistScore, isDemo, journal, tradeStatus]);

  function updateJournal(patch: Partial<DailyJournalRecord>) {
    setJournal((current) => ({ ...current, ...patch }));
  }

  function updateWeeklyReview(patch: Partial<WeeklyReviewRecord>) {
    setWeeklyReview((current) => ({
      ...current,
      ...patch,
      weekStartDate: selectedWeekStart,
      accountId: weeklyAccountId
    }));
  }

  function updateWeeklyPlan(patch: Partial<WeeklyPlanRecord>) {
    setWeeklyPlan((current) => ({
      ...current,
      ...patch,
      weekStartDate: selectedWeekStart,
      accountId: planAccountId
    }));
  }

  function updateWatchlistRow(rowId: string, patch: Partial<WeeklyPlanWatchlistRow>) {
    updateWeeklyPlan({
      watchlist: weeklyPlan.watchlist.map((row) => row.id === rowId ? { ...row, ...patch } : row)
    });
  }

  function addWatchlistRow() {
    updateWeeklyPlan({ watchlist: [...weeklyPlan.watchlist, emptyWatchlistRow()] });
  }

  function removeWatchlistRow(rowId: string) {
    updateWeeklyPlan({ watchlist: weeklyPlan.watchlist.filter((row) => row.id !== rowId) });
  }

  function addTradingViewLink() {
    const url = tradingViewLink.trim();
    if (!url) return;
    updateJournal({
      attachments: [...journal.attachments, { id: crypto.randomUUID(), type: "tradingview", label: "TradingView idea", url }]
    });
    setTradingViewLink("");
  }

  function addImageFiles(files: FileList | null) {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: DailyJournalAttachment = {
          id: crypto.randomUUID(),
          type: "image",
          label: file.name,
          url: String(reader.result)
        };
        setJournal((current) => ({ ...current, attachments: [...current.attachments, attachment] }));
      };
      reader.readAsDataURL(file);
    });
  }

  function addFocusTag() {
    const tag = focusInput.trim();
    if (!tag || journal.todaysFocus.includes(tag)) return;
    updateJournal({ todaysFocus: [...journal.todaysFocus, tag] });
    setFocusInput("");
  }

  function togglePlaybook(setup: string) {
    updateJournal({
      playbooks: journal.playbooks.includes(setup)
        ? journal.playbooks.filter((item) => item !== setup)
        : [...journal.playbooks, setup]
    });
  }

  function handleLogTrade() {
    if (checklistScore < checklistItems.length) {
      setTradeWarning("Finish every checklist condition before logging an A+ trade.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Daily journal</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Plan the day. Grade the setup.</h1>
            <p className="mt-3 text-slate-400">One page for mindset, market context, screenshots, and selected-day trades.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["daily", "weekly", "plan"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setJournalMode(mode)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    journalMode === mode
                      ? "border-emerald-300 bg-emerald-400 text-slate-950"
                      : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-emerald-400/40 hover:bg-emerald-400/10"
                  )}
                >
                  {mode === "daily" ? "Daily Journal" : mode === "weekly" ? "Weekly Review" : "Weekly Plan"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="sr-only" htmlFor="journal-account">Account</label>
              <select
                id="journal-account"
                className="field h-11 min-w-56"
                value={selectedAccountId}
                onChange={(event) => router.push(event.target.value === "all" ? "/journal" : `/journal?account=${event.target.value}`)}
              >
                <option value="all">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.accountName}</option>
                ))}
              </select>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Save className="h-4 w-4 text-emerald-300" />
              {isPending ? "Syncing..." : saveState}
            </span>
            {checklistScore === checklistItems.length ? (
              <Link href={`/trades/new?date=${selectedDate}${selectedAccountId !== "all" ? `&account=${selectedAccountId}` : ""}`} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950">
                Log trade
              </Link>
            ) : (
              <button onClick={handleLogTrade} className="rounded-full border border-rose-300/30 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100">
                Log trade
              </button>
            )}
          </div>
        </div>
        {tradeWarning ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            <AlertTriangle className="h-4 w-4" />
            {tradeWarning}
          </div>
        ) : null}
      </section>

      {journalMode === "daily" ? (
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="panel h-fit p-5">
          <div className="flex items-center justify-between gap-3">
            <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm" onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}>Previous</button>
            <h2 className="text-xl font-semibold">{format(visibleMonth, "MMMM yyyy")}</h2>
            <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>Next</button>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {weekdays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTrades = filteredTrades.filter((trade) => trade.date === dateKey).length;
              const selected = isSameDay(day, parseISO(selectedDate));
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`min-h-16 rounded-2xl border px-2 py-2 text-left transition ${
                    selected
                      ? "border-emerald-300 bg-emerald-400/15 text-white"
                      : isSameMonth(day, visibleMonth)
                        ? "border-white/10 bg-white/[0.04] text-slate-200 hover:border-emerald-400/30"
                        : "border-white/[0.05] bg-slate-950/30 text-slate-600"
                  }`}
                >
                  <span className="block text-sm font-semibold">{format(day, "d")}</span>
                  <span className="mt-2 block text-[11px] uppercase tracking-[0.16em] text-slate-500">{dayTrades}T</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="label">Selected date</p>
                <h2 className="text-3xl font-semibold tracking-tight">{format(parseISO(selectedDate), "EEEE, MMMM d")}</h2>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${tradeStatus === "A+ TRADE READY" ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-100"}`}>
                {tradeStatus}
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              <div>
                <label className="label">Mood</label>
                <div className="grid grid-cols-5 gap-2">
                  {moods.map((mood) => (
                    <button key={mood.label} onClick={() => updateJournal({ mood: mood.label })} className={`rounded-2xl border px-2 py-3 text-sm font-semibold ${journal.mood === mood.label ? "border-emerald-300 bg-emerald-400/15 text-white" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                      <span className="block text-lg">{mood.icon}</span>
                      <span className="mt-1 block text-[11px]">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Sleep hours</label>
                <input className="field" type="number" min="0" max="16" step="0.5" value={journal.sleepHours} onChange={(event) => updateJournal({ sleepHours: event.target.value })} />
              </div>
              <div>
                <label className="label">Market conditions</label>
                <select className="field" value={journal.marketConditions} onChange={(event) => updateJournal({ marketConditions: event.target.value as DailyJournalRecord["marketConditions"] })}>
                  {marketConditions.map((condition) => <option key={condition}>{condition}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="panel p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">Pre-trade checklist</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${checklistScore === 7 ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-100"}`}>
                  {checklistScore}/7
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {checklistItems.map(([key, label]) => {
                  const checked = journal.checklist[key];
                  return (
                    <label key={key} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${checked ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-rose-300/25 bg-rose-400/10 text-rose-100"}`}>
                      <span>{label}</span>
                      <input type="checkbox" checked={checked} onChange={() => updateJournal({ checklist: { ...journal.checklist, [key]: !checked } })} className="h-4 w-4 accent-emerald-400" />
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="panel p-6">
              <h3 className="text-xl font-semibold">Notes / reflection</h3>
              <textarea className="field mt-5 min-h-72" value={journal.notes} onChange={(event) => updateJournal({ notes: event.target.value })} placeholder="What mattered today? What did price do around your zone? What did you execute well?" />
            </section>
          </div>

          <section className="panel p-6">
            <h3 className="text-xl font-semibold">Focus and playbooks</h3>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <label className="label">Today&apos;s focus</label>
                <div className="flex gap-2">
                  <input className="field" value={focusInput} onChange={(event) => setFocusInput(event.target.value)} placeholder="Patience, NQ only, wait for sweep" />
                  <button className="rounded-2xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950" onClick={addFocusTag}>Add</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {journal.todaysFocus.map((tag) => (
                    <button key={tag} onClick={() => updateJournal({ todaysFocus: journal.todaysFocus.filter((item) => item !== tag) })} className="rounded-full bg-white/[0.08] px-3 py-1 text-xs text-slate-200">
                      {tag} x
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Playbooks / setups</label>
                <div className="flex flex-wrap gap-2">
                  {setups.map((setup) => (
                    <button key={setup} onClick={() => togglePlaybook(setup)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${journal.playbooks.includes(setup) ? "border-emerald-300 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                      {setup}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h3 className="text-xl font-semibold">Attachments</h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
              <input className="field" value={tradingViewLink} onChange={(event) => setTradingViewLink(event.target.value)} placeholder="TradingView link" />
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold" onClick={addTradingViewLink}>
                <Link2 className="h-4 w-4 text-emerald-300" />
                Add link
              </button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold">
                <ImagePlus className="h-4 w-4 text-emerald-300" />
                Upload image
                <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => addImageFiles(event.target.files)} />
              </label>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {journal.attachments.map((attachment) => (
                <div key={attachment.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <a className="truncate text-sm font-semibold text-slate-100" href={attachment.url} target="_blank" rel="noreferrer">{attachment.label}</a>
                    <button onClick={() => updateJournal({ attachments: journal.attachments.filter((item) => item.id !== attachment.id) })}><X className="h-4 w-4 text-slate-400" /></button>
                  </div>
                  {attachment.type === "image" ? <img src={attachment.url} alt={attachment.label} className="mt-3 max-h-52 w-full rounded-2xl object-cover" /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Trades for selected day</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">{selectedDayTrades.length} trades</span>
            </div>
            {selectedDayTrades.length ? (
              <TradeTable trades={selectedDayTrades} />
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                No trades logged for {selectedDate}.
              </div>
            )}
          </section>
        </section>
      </div>
      ) : journalMode === "weekly" ? (
        <WeeklyReviewPanel
          accounts={accounts}
          selectedAccountId={weeklySelectedAccountId}
          selectedWeekStart={selectedWeekStart}
          weeklyReview={weeklyReview}
          weeklySaveState={weeklySaveState}
          weeklyStats={weeklyStats}
          isPending={isPending}
          onAccountChange={setWeeklySelectedAccountId}
          onPreviousWeek={() => setSelectedWeekStart(weekKey(subWeeks(parseISO(selectedWeekStart), 1)))}
          onNextWeek={() => setSelectedWeekStart(weekKey(addWeeks(parseISO(selectedWeekStart), 1)))}
          onWeekChange={(date) => setSelectedWeekStart(weekKey(date))}
          onUpdate={updateWeeklyReview}
        />
      ) : (
        <WeeklyPlanPanel
          accounts={accounts}
          selectedAccountId={planSelectedAccountId}
          selectedWeekStart={selectedWeekStart}
          weeklyPlan={weeklyPlan}
          planSaveState={planSaveState}
          isPending={isPending}
          onAccountChange={setPlanSelectedAccountId}
          onPreviousWeek={() => setSelectedWeekStart(weekKey(subWeeks(parseISO(selectedWeekStart), 1)))}
          onNextWeek={() => setSelectedWeekStart(weekKey(addWeeks(parseISO(selectedWeekStart), 1)))}
          onWeekChange={(date) => setSelectedWeekStart(weekKey(date))}
          onUpdate={updateWeeklyPlan}
          onAddWatchlistRow={addWatchlistRow}
          onUpdateWatchlistRow={updateWatchlistRow}
          onRemoveWatchlistRow={removeWatchlistRow}
        />
      )}
    </div>
  );
}
type WeeklyStats = ReturnType<typeof buildWeeklyStats>;

type WeeklyReviewPanelProps = {
  accounts: TradingAccount[];
  selectedAccountId: string;
  selectedWeekStart: string;
  weeklyReview: WeeklyReviewRecord;
  weeklySaveState: string;
  weeklyStats: WeeklyStats;
  isPending: boolean;
  onAccountChange: (accountId: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onWeekChange: (date: string) => void;
  onUpdate: (patch: Partial<WeeklyReviewRecord>) => void;
};

const performanceFields: { key: keyof WeeklyReviewRecord; label: string; textarea?: boolean }[] = [
  { key: "bestTrade", label: "Best Trade" },
  { key: "worstTrade", label: "Worst Trade" },
  { key: "bestSetup", label: "Best Setup" },
  { key: "worstMistake", label: "Worst Mistake" },
  { key: "emotionalState", label: "Emotional State" },
  { key: "disciplineGrade", label: "Discipline Grade" },
  { key: "executionGrade", label: "Execution Grade" }
];

const questionFields: { key: keyof WeeklyReviewRecord; label: string }[] = [
  { key: "whatWorked", label: "What worked this week?" },
  { key: "whatFailed", label: "What failed?" },
  { key: "needsImprovement", label: "What needs improvement?" },
  { key: "followedPlan", label: "Did I follow my plan?" },
  { key: "forcedTrades", label: "Did I force trades?" },
  { key: "improveNextWeek", label: "What can I improve next week?" }
];

function WeeklyReviewPanel({
  accounts,
  selectedAccountId,
  selectedWeekStart,
  weeklyReview,
  weeklySaveState,
  weeklyStats,
  isPending,
  onAccountChange,
  onPreviousWeek,
  onNextWeek,
  onWeekChange,
  onUpdate
}: WeeklyReviewPanelProps) {
  const weekEnd = format(endOfWeek(parseISO(selectedWeekStart), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Weekly review</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{format(parseISO(selectedWeekStart), "MMM d")} - {format(parseISO(weekEnd), "MMM d, yyyy")}</h2>
            <p className="mt-3 text-slate-400">Review the week, grade execution, and set a better plan for next week.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="field h-11 min-w-56" value={selectedAccountId} onChange={(event) => onAccountChange(event.target.value)}>
              <option value="all">All Accounts</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}
            </select>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Save className="h-4 w-4 text-emerald-300" />
              {isPending ? "Syncing..." : weeklySaveState}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm" onClick={onPreviousWeek}>Previous week</button>
          <input className="field max-w-56" type="date" value={selectedWeekStart} onChange={(event) => onWeekChange(event.target.value)} />
          <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm" onClick={onNextWeek}>Next week</button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <WeeklyStatCard label="Weekly P/L" value={formatCurrency(weeklyStats.weeklyPnl)} tone={weeklyStats.weeklyPnl > 0 ? "profit" : weeklyStats.weeklyPnl < 0 ? "loss" : "neutral"} />
        <WeeklyStatCard label="Total trades" value={weeklyStats.totalTrades.toString()} />
        <WeeklyStatCard label="Win rate" value={formatPercent(weeklyStats.winRate)} />
        <WeeklyStatCard label="Best day" value={weeklyStats.bestDay} />
        <WeeklyStatCard label="Worst day" value={weeklyStats.worstDay} />
        <WeeklyStatCard label="Best setup" value={weeklyStats.bestSetup} />
      </section>

      <section className="panel p-6">
        <h3 className="text-xl font-semibold">Performance Review</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {performanceFields.map((field) => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <input className="field" value={String(weeklyReview[field.key] ?? "")} onChange={(event) => onUpdate({ [field.key]: event.target.value } as Partial<WeeklyReviewRecord>)} />
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="text-xl font-semibold">Questions</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {questionFields.map((field) => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <textarea className="field min-h-32" value={String(weeklyReview[field.key] ?? "")} onChange={(event) => onUpdate({ [field.key]: event.target.value } as Partial<WeeklyReviewRecord>)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WeeklyStatCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "profit" | "loss" | "neutral" }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={cn("mt-2 text-lg font-semibold", tone === "profit" && "text-emerald-300", tone === "loss" && "text-rose-300")}>{value}</p>
    </div>
  );
}
type WeeklyPlanPanelProps = {
  accounts: TradingAccount[];
  selectedAccountId: string;
  selectedWeekStart: string;
  weeklyPlan: WeeklyPlanRecord;
  planSaveState: string;
  isPending: boolean;
  onAccountChange: (accountId: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onWeekChange: (date: string) => void;
  onUpdate: (patch: Partial<WeeklyPlanRecord>) => void;
  onAddWatchlistRow: () => void;
  onUpdateWatchlistRow: (rowId: string, patch: Partial<WeeklyPlanWatchlistRow>) => void;
  onRemoveWatchlistRow: (rowId: string) => void;
};

const weeklyPlanFields: { key: keyof WeeklyPlanRecord; label: string; textarea?: boolean }[] = [
  { key: "mainGoal", label: "Main goal of the week" },
  { key: "maxWeeklyRisk", label: "Max weekly risk" },
  { key: "dailyMaxLoss", label: "Daily max loss" },
  { key: "psychologyFocus", label: "Psychology focus" },
  { key: "rulesForWeek", label: "Rules for the week", textarea: true },
  { key: "allowedSetups", label: "Allowed setups", textarea: true },
  { key: "setupsToAvoid", label: "Setups to avoid", textarea: true },
  { key: "stopTradingConditions", label: "What would make me stop trading this week?", textarea: true }
];

function WeeklyPlanPanel({
  accounts,
  selectedAccountId,
  selectedWeekStart,
  weeklyPlan,
  planSaveState,
  isPending,
  onAccountChange,
  onPreviousWeek,
  onNextWeek,
  onWeekChange,
  onUpdate,
  onAddWatchlistRow,
  onUpdateWatchlistRow,
  onRemoveWatchlistRow
}: WeeklyPlanPanelProps) {
  const weekEnd = format(endOfWeek(parseISO(selectedWeekStart), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const focusAssets = weeklyPlan.watchlist.map((row) => row.symbol.trim()).filter(Boolean).slice(0, 4).join(", ") || "No assets yet";
  const mainSetup = weeklyPlan.watchlist.find((row) => row.mainSetup.trim())?.mainSetup || weeklyPlan.allowedSetups || "Not set";

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Weekly plan</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{format(parseISO(selectedWeekStart), "MMM d")} - {format(parseISO(weekEnd), "MMM d, yyyy")}</h2>
            <p className="mt-3 text-slate-400">Set the plan before the week starts, then trade inside the lines.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="field h-11 min-w-56" value={selectedAccountId} onChange={(event) => onAccountChange(event.target.value)}>
              <option value="all">All Accounts</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}
            </select>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Save className="h-4 w-4 text-emerald-300" />
              {isPending ? "Syncing..." : planSaveState}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm" onClick={onPreviousWeek}>Previous week</button>
          <input className="field max-w-56" type="date" value={selectedWeekStart} onChange={(event) => onWeekChange(event.target.value)} />
          <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm" onClick={onNextWeek}>Next week</button>
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="text-xl font-semibold">Weekly Plan Summary</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <PlanSummaryItem label="Goal" value={weeklyPlan.mainGoal || "Not set"} />
          <PlanSummaryItem label="Focus assets" value={focusAssets} />
          <PlanSummaryItem label="Main setup" value={mainSetup} />
          <PlanSummaryItem label="Max risk" value={weeklyPlan.maxWeeklyRisk || "Not set"} />
          <PlanSummaryItem label="Psychology focus" value={weeklyPlan.psychologyFocus || "Not set"} />
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="text-xl font-semibold">Plan fields</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {weeklyPlanFields.map((field) => (
            <div key={field.key} className={field.textarea ? "md:col-span-2" : undefined}>
              <label className="label">{field.label}</label>
              {field.textarea ? (
                <textarea className="field min-h-32" value={String(weeklyPlan[field.key] ?? "")} onChange={(event) => onUpdate({ [field.key]: event.target.value } as Partial<WeeklyPlanRecord>)} />
              ) : (
                <input className="field" value={String(weeklyPlan[field.key] ?? "")} onChange={(event) => onUpdate({ [field.key]: event.target.value } as Partial<WeeklyPlanRecord>)} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">Weekly Watchlist</h3>
            <p className="mt-2 text-sm text-slate-400">Assets, bias, zones, setup, and risk plan for the selected week.</p>
          </div>
          <button type="button" className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950" onClick={onAddWatchlistRow}>+ Add Asset</button>
        </div>

        {weeklyPlan.watchlist.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-3 font-semibold">Asset / Symbol</th>
                  <th className="py-3 pr-3 font-semibold">Bias</th>
                  <th className="py-3 pr-3 font-semibold">Key Levels / Zones</th>
                  <th className="py-3 pr-3 font-semibold">Main Setup</th>
                  <th className="py-3 pr-3 font-semibold">Risk Plan</th>
                  <th className="py-3 pr-3 font-semibold">Notes</th>
                  <th className="py-3 pr-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {weeklyPlan.watchlist.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-3"><input className="field min-w-32" value={row.symbol} onChange={(event) => onUpdateWatchlistRow(row.id, { symbol: event.target.value })} /></td>
                    <td className="py-3 pr-3">
                      <select className="field min-w-32" value={row.bias} onChange={(event) => onUpdateWatchlistRow(row.id, { bias: event.target.value as WeeklyPlanBias })}>
                        {planBiasOptions.map((bias) => <option key={bias} value={bias}>{bias}</option>)}
                      </select>
                    </td>
                    <td className="py-3 pr-3"><textarea className="field min-h-20 min-w-44" value={row.keyLevels} onChange={(event) => onUpdateWatchlistRow(row.id, { keyLevels: event.target.value })} /></td>
                    <td className="py-3 pr-3"><input className="field min-w-40" value={row.mainSetup} onChange={(event) => onUpdateWatchlistRow(row.id, { mainSetup: event.target.value })} /></td>
                    <td className="py-3 pr-3"><textarea className="field min-h-20 min-w-44" value={row.riskPlan} onChange={(event) => onUpdateWatchlistRow(row.id, { riskPlan: event.target.value })} /></td>
                    <td className="py-3 pr-3"><textarea className="field min-h-20 min-w-44" value={row.notes} onChange={(event) => onUpdateWatchlistRow(row.id, { notes: event.target.value })} /></td>
                    <td className="py-3 pr-3">
                      <button type="button" className="rounded-full border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100" onClick={() => onRemoveWatchlistRow(row.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
            No watchlist assets yet. Add the first asset to build this week&apos;s plan.
          </div>
        )}
      </section>
    </div>
  );
}

function PlanSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}
