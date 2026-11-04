import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  generateSpins,
  NOVIBET_COMPOUND_STRATEGIES,
  NOVIBET_EUROPEAN_TABLE,
  runNovibetCompoundSimulation,
  type NovibetSpinRow,
} from "./index/novibetCompoundEngine";
import { Play, RotateCcw } from "lucide-react";

const EUR = new Intl.NumberFormat("en-EU", {
  style: "currency",
  currency: "EUR",
});

export default function NovibetCompound() {
  const [startingCredit, setStartingCredit] = useState(1000);
  const [spinCount, setSpinCount] = useState(500);
  const [rows, setRows] = useState<NovibetSpinRow[]>([]);
  const [running, setRunning] = useState(false);

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const last = rows[rows.length - 1];
    const hitMaxSpins = rows.filter((r) => r.hitMaxIds.length > 0).length;
    const wiped = last.portfolio < NOVIBET_EUROPEAN_TABLE.minBet;
    return {
      finalPortfolio: last.portfolio,
      finalPnl: last.cumulativeEarnings,
      hitMaxSpins,
      wiped,
    };
  }, [rows]);

  const run = () => {
    setRunning(true);
    const credit = Math.max(0, Number(startingCredit) || 0);
    const n = Math.min(5000, Math.max(1, Math.floor(Number(spinCount) || 500)));
    const spins = generateSpins(n);
    const result = runNovibetCompoundSimulation({
      spins,
      startingCredit: credit,
    });
    setRows(result);
    setRunning(false);
  };

  const reset = () => setRows([]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">
              <Link to="/" className="underline hover:text-white">
                ← All strategies
              </Link>
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Novibet Compound (EUR)
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-xl">
              European roulette · single zero · full loss on 0. Chip €
              {NOVIBET_EUROPEAN_TABLE.minChip} · straight max €
              {NOVIBET_EUROPEAN_TABLE.maxStraightUp} · dozen max €
              {NOVIBET_EUROPEAN_TABLE.maxDozen} · even-money max €
              {NOVIBET_EUROPEAN_TABLE.maxEvenMoney}.
            </p>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Simulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spins">Number of spins</Label>
                <Input
                  id="spins"
                  type="number"
                  min={1}
                  max={5000}
                  step={1}
                  value={spinCount}
                  onChange={(e) => setSpinCount(Number(e.target.value))}
                  className="bg-slate-950 border-slate-700"
                />
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
              Base layout per spin:{" "}
              {NOVIBET_COMPOUND_STRATEGIES.map(
                (s) => `${s.name} €${s.initialBet}`,
              ).join(" · ")}{" "}
              (≈ €
              {NOVIBET_COMPOUND_STRATEGIES.reduce(
                (a, s) => a + s.initialBet,
                0,
              )}{" "}
              before doubles). Currency fixed: EUR.
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={run}
                disabled={running}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Play className="mr-2 h-4 w-4" />
                {running ? "Running…" : "Run simulation"}
              </Button>
              <Button variant="outline" onClick={reset} disabled={!rows.length}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {summary && (
          <div className="grid gap-3 sm:grid-cols-4">
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">Final portfolio</p>
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
                <p className="text-xs text-slate-400">Spins hitting table max</p>
                <p className="text-lg font-semibold">{summary.hitMaxSpins}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">Status</p>
                <p className="text-lg font-semibold">
                  {summary.wiped ? "Below min bet" : "Active"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {rows.length > 0 && (
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spin results</CardTitle>
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
