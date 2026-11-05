import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiGetLiveSpins, apiPostLiveSpins } from "@/lib/api";
import {
  createNovibetLiveSession,
  generateSpins,
  NOVIBET_COMPOUND_STRATEGIES,
  NOVIBET_EUROPEAN_TABLE,
  NOVIBET_ROBUST_DEFAULTS,
  runNovibetCompoundSimulation,
  stepNovibetLiveSession,
  type NovibetLiveSession,
  type NovibetSpinRow,
} from "./index/novibetCompoundEngine";
import { parseSpinNumbers } from "./index/spinFeed";
import { Play, RotateCcw, Radio } from "lucide-react";

const EUR = new Intl.NumberFormat("en-EU", {
  style: "currency",
  currency: "EUR",
});

const DEFAULT_TABLE = "novibet-european-default";

type Mode = "live" | "backtest";

export default function NovibetCompound() {
  const [mode, setMode] = useState<Mode>("backtest");
  const [startingCredit, setStartingCredit] = useState(1000);
  const [spinCount, setSpinCount] = useState(500);
  const [paste, setPaste] = useState("");
  const [tableId, setTableId] = useState(DEFAULT_TABLE);
  const [rows, setRows] = useState<NovibetSpinRow[]>([]);
  const [running, setRunning] = useState(false);
  const [liveOn, setLiveOn] = useState(false);
  const [liveStatus, setLiveStatus] = useState("Idle");
  const [lastFeedId, setLastFeedId] = useState(0);
  const sessionRef = useRef<NovibetLiveSession | null>(null);

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const last = rows[rows.length - 1];
    const hitMaxSpins = rows.filter((r) => r.hitMaxIds.length > 0).length;
    const pausedSpins = rows.filter((r) => r.skippedIds.length > 0).length;
    const wiped = last.portfolio < NOVIBET_EUROPEAN_TABLE.minBet;
    const maxDd = rows.reduce((m, r) => {
      const dd = r.peak - r.portfolio;
      return dd > m ? dd : m;
    }, 0);
    return {
      finalPortfolio: last.portfolio,
      finalPnl: last.cumulativeEarnings,
      floor: last.floor,
      peak: last.peak,
      hitMaxSpins,
      pausedSpins,
      maxDd,
      wiped,
      lastNumber: last.drawnNumber,
      lastBets: last.bets,
    };
  }, [rows]);

  const resetSession = useCallback(() => {
    sessionRef.current = createNovibetLiveSession({
      startingCredit: Math.max(0, Number(startingCredit) || 0),
      robust: NOVIBET_ROBUST_DEFAULTS,
    });
    setRows([]);
    setLastFeedId(0);
    setLiveStatus("Session reset");
  }, [startingCredit]);

  const runBacktest = () => {
    setRunning(true);
    const credit = Math.max(0, Number(startingCredit) || 0);
    let numbers: number[] = [];
    if (paste.trim()) {
      const parsed = parseSpinNumbers(paste);
      if (parsed.error) {
        setLiveStatus(parsed.error);
        setRunning(false);
        return;
      }
      numbers = parsed.numbers;
      void apiPostLiveSpins(
        numbers.map((number) => ({
          tableId,
          number,
          source: "csv" as const,
          ts: new Date().toISOString(),
        })),
      ).catch(() => {
        /* offline ok */
      });
    } else {
      const n = Math.min(5000, Math.max(1, Math.floor(Number(spinCount) || 500)));
      numbers = generateSpins(n);
    }
    const result = runNovibetCompoundSimulation({
      spins: numbers,
      startingCredit: credit,
      robust: NOVIBET_ROBUST_DEFAULTS,
    });
    setRows(result);
    setLiveStatus(
      paste.trim()
        ? `Backtest on ${numbers.length} pasted/real spins`
        : `Simulated ${numbers.length} PRNG spins`,
    );
    setRunning(false);
  };

  // Live poll
  useEffect(() => {
    if (!liveOn || mode !== "live") return;

    if (!sessionRef.current) {
      sessionRef.current = createNovibetLiveSession({
        startingCredit: Math.max(0, Number(startingCredit) || 0),
        robust: NOVIBET_ROBUST_DEFAULTS,
      });
    }

    let cancelled = false;
    const tick = async () => {
      try {
        const events = await apiGetLiveSpins({
          tableId,
          afterId: lastFeedId,
          limit: 50,
        });
        if (cancelled || !events.length) {
          setLiveStatus(
            `Listening ${tableId} · lastId=${lastFeedId} (paper trade only)`,
          );
          return;
        }
        const session = sessionRef.current!;
        const newRows: NovibetSpinRow[] = [];
        let maxId = lastFeedId;
        for (const ev of events) {
          if (ev.id <= lastFeedId) continue;
          newRows.push(stepNovibetLiveSession(session, ev.number));
          maxId = Math.max(maxId, ev.id);
        }
        if (newRows.length) {
          setRows([...session.rows]);
          setLastFeedId(maxId);
          setLiveStatus(
            `Applied ${newRows.length} real strike(s) · last #${newRows[newRows.length - 1].drawnNumber}`,
          );
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "poll failed";
        setLiveStatus(`Feed error: ${msg} — is backend on :8080?`);
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [liveOn, mode, tableId, lastFeedId, startingCredit]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div>
          <p className="text-sm text-slate-400">
            <Link to="/" className="underline hover:text-white">
              ← All strategies
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Novibet Compound · Robust (EUR)
          </h1>
          <p className="mt-1 text-sm text-amber-200/90 max-w-2xl border border-amber-700/40 bg-amber-950/30 rounded-md px-3 py-2">
            Paper trade only — RoSiStrat never places bets on Novibet. Live mode
            consumes strike numbers from POST /api/spins (DevTools capture or
            paste).
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Simulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={mode === "backtest" ? "default" : "outline"}
                onClick={() => {
                  setMode("backtest");
                  setLiveOn(false);
                }}
              >
                Backtest
              </Button>
              <Button
                variant={mode === "live" ? "default" : "outline"}
                onClick={() => setMode("live")}
              >
                <Radio className="mr-2 h-4 w-4" />
                Live paper-trade
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="credit">Starting credit (EUR)</Label>
                <Input
                  id="credit"
                  type="number"
                  min={0}
                  step={1}
                  value={startingCredit}
                  onChange={(e) => setStartingCredit(Number(e.target.value))}
                  className="bg-slate-950 border-slate-700"
                  disabled={liveOn}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table">Table id</Label>
                <Input
                  id="table"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="bg-slate-950 border-slate-700"
                />
              </div>
            </div>

            {mode === "backtest" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="spins">PRNG spin count (if paste empty)</Label>
                  <Input
                    id="spins"
                    type="number"
                    min={1}
                    max={5000}
                    value={spinCount}
                    onChange={(e) => setSpinCount(Number(e.target.value))}
                    className="bg-slate-950 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paste">
                    Real spins paste / CSV (optional)
                  </Label>
                  <Textarea
                    id="paste"
                    placeholder="0, 32, 15, 19, 4 …"
                    value={paste}
                    onChange={(e) => setPaste(e.target.value)}
                    className="bg-slate-950 border-slate-700 min-h-[80px]"
                  />
                </div>
              </>
            )}

            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 space-y-1">
              <p>
                Base layout:{" "}
                {NOVIBET_COMPOUND_STRATEGIES.map(
                  (s) => `${s.name} €${s.initialBet}`,
                ).join(" · ")}
                .
              </p>
              <p>
                Robust: 1.5× · streak {NOVIBET_ROBUST_DEFAULTS.maxLossStreak} ·
                safety {NOVIBET_ROBUST_DEFAULTS.safetyRatio}× · risk{" "}
                {(NOVIBET_ROBUST_DEFAULTS.riskBudgetPct * 100).toFixed(0)}% ·
                chip €{NOVIBET_EUROPEAN_TABLE.minChip}.
              </p>
              <p className="text-slate-300">{liveStatus}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {mode === "backtest" ? (
                <Button
                  onClick={runBacktest}
                  disabled={running}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {running ? "Running…" : "Run backtest"}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      if (!liveOn) resetSession();
                      setLiveOn((v) => !v);
                    }}
                    className={
                      liveOn
                        ? "bg-red-700 hover:bg-red-600"
                        : "bg-emerald-600 hover:bg-emerald-500"
                    }
                  >
                    <Radio className="mr-2 h-4 w-4" />
                    {liveOn ? "Stop live" : "Start live"}
                  </Button>
                  <Button variant="outline" onClick={resetSession}>
                    New session
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setLiveOn(false);
                  setRows([]);
                  sessionRef.current = null;
                }}
                disabled={!rows.length && !liveOn}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {summary && (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">Portfolio</p>
                <p className="text-lg font-semibold">
                  {EUR.format(summary.finalPortfolio)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">Net P/L</p>
                <p
                  className={`text-lg font-semibold ${
                    summary.finalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {EUR.format(summary.finalPnl)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">Locked floor</p>
                <p className="text-lg font-semibold">
                  {EUR.format(summary.floor)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">Last strike</p>
                <p className="text-lg font-semibold">{summary.lastNumber}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">Max drawdown</p>
                <p className="text-lg font-semibold">
                  {EUR.format(summary.maxDd)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">Status</p>
                <p className="text-lg font-semibold">
                  {summary.wiped ? "Below min" : "Protected"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {summary?.lastBets && Object.keys(summary.lastBets).length > 0 && (
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Last paper bets (not placed on Novibet)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 flex flex-wrap gap-3">
              {Object.entries(summary.lastBets).map(([id, amt]) =>
                amt > 0 ? (
                  <span key={id}>
                    {id}: {EUR.format(amt)}
                  </span>
                ) : null,
              )}
            </CardContent>
          </Card>
        )}

        {rows.length > 0 && (
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Spin results · {rows.length} · pauses{" "}
                {summary?.pausedSpins ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Spin</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Staked</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.spin}>
                        <TableCell>{r.spin}</TableCell>
                        <TableCell>{r.drawnNumber}</TableCell>
                        <TableCell>{EUR.format(r.totalStaked)}</TableCell>
                        <TableCell
                          className={
                            r.spinNetResult >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {EUR.format(r.spinNetResult)}
                        </TableCell>
                        <TableCell>{EUR.format(r.portfolio)}</TableCell>
                        <TableCell className="text-slate-400">
                          {EUR.format(r.floor)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {r.hitMaxIds.length
                            ? `max:${r.hitMaxIds.join(",")}`
                            : ""}
                          {r.skippedIds.length
                            ? ` skip:${r.skippedIds.join(",")}`
                            : ""}
                          {!r.hitMaxIds.length && !r.skippedIds.length
                            ? "—"
                            : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
