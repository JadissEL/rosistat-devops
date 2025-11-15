import React, { useEffect, useState } from "react";
import { apiHealth, getApiBase, setApiBaseOverride } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Status = "idle" | "ok" | "down" | "checking";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [apiBase, setApiBase] = useState<string>(getApiBase());

  const checkHealth = async () => {
    setStatus("checking");
    try {
      await apiHealth();
      setStatus("ok");
    } catch {
      setStatus("down");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await apiHealth();
        if (mounted) setStatus("ok");
      } catch {
        if (mounted) setStatus("down");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const color = status === "ok" ? "bg-green-500" : status === "down" ? "bg-red-500" : status === "checking" ? "bg-yellow-500" : "bg-gray-400";
  const text = status === "ok" ? "API OK" : status === "down" ? "API DOWN" : status === "checking" ? "CHECKING" : "API";

  const handleSave = () => {
    setApiBaseOverride(apiBase);
    // re-check health using new base
    checkHealth();
    setOpen(false);
  };

  const handleReset = () => {
    setApiBase("");
    setApiBaseOverride("");
    checkHealth();
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      <div className="flex items-center gap-2 rounded-full bg-black/60 text-white px-3 py-1 text-xs shadow">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}></span>
        <span>{text}</span>
        <span className="text-[10px] text-gray-300 hidden sm:inline">{getApiBase() || "(relative)"}</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="ml-2">API</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Base Settings</DialogTitle>
              <DialogDescription>
                Configure the API base URL used by the frontend. Leave empty to use relative paths or the build-time env.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-1">
                <label className="text-sm text-muted-foreground">Current Base</label>
                <Input value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="https://rosistat.localtest.me" />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={handleReset}>Reset</Button>
                <Button variant="ghost" onClick={checkHealth}>Check Health</Button>
              </div>
            </div>
            <DialogFooter>
              <span className="text-xs text-muted-foreground">Health: {text}</span>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


