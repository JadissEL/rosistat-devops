import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BackendSimulationsPreview() {
  const [sims, setSims] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiGet<any[]>("/api/simulations");
        if (mounted) setSims(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load simulations");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Backend Simulations</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-400">Error: {error}</div>
        )}
        {!error && sims === null && (
          <div className="text-sm text-slate-300">Loading simulations…</div>
        )}
        {!error && Array.isArray(sims) && (
          <>
            <div className="text-sm text-slate-300 mb-3">
              Found {sims.length} simulation{(sims.length || 0) !== 1 ? "s" : ""}
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">Total Spins</TableHead>
                    <TableHead className="text-right">Final Earnings</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sims.slice(0, 5).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.id}</TableCell>
                      <TableCell>{s.strategy}</TableCell>
                      <TableCell className="text-right">{s.totalSpins}</TableCell>
                      <TableCell className="text-right">{s.finalEarnings}</TableCell>
                      <TableCell className="text-right">
                        {s.timestamp ? new Date(s.timestamp).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {sims.length > 5 && (
              <div className="text-xs text-slate-400 mt-2">
                Showing first 5 of {sims.length}. Use the API for full details.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}