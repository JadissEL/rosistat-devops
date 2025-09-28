import React, { useEffect, useState } from "react";
import { apiHealth, API_BASE } from "@/lib/api";

type Status = "idle" | "ok" | "down";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("idle");

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

  const color = status === "ok" ? "bg-green-500" : status === "down" ? "bg-red-500" : "bg-gray-400";
  const text = status === "ok" ? "API OK" : status === "down" ? "API DOWN" : "API";

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      <div className="flex items-center gap-2 rounded-full bg-black/60 text-white px-3 py-1 text-xs shadow">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}></span>
        <span>{text}</span>
        {API_BASE && (
          <span className="text-[10px] text-gray-300 hidden sm:inline">{API_BASE}</span>
        )}
      </div>
    </div>
  );
}


