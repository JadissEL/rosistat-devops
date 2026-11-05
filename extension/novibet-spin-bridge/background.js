/**
 * 1) Receives result ribbons → POST /api/spins
 * 2) Polls pending human-confirmed bet plans → asks content script to place chips once
 */
const API = "http://127.0.0.1:8080";
const TABLE = "novibet-european-default";

let lastSignature = "";
let primed = false;
let placing = false;

function extractNew(prev, next) {
  if (!prev.length || !next.length) return [];
  if (
    next.length >= prev.length &&
    next.slice(next.length - prev.length).every((n, i) => n === prev[i])
  ) {
    return next.slice(0, next.length - prev.length).slice().reverse();
  }
  if (next.slice(0, prev.length).every((n, i) => n === prev[i])) {
    return next.slice(prev.length);
  }
  if (next.length === prev.length && next[1] === prev[0]) return [next[0]];
  if (
    next.length === prev.length &&
    next[next.length - 2] === prev[prev.length - 1]
  ) {
    return [next[next.length - 1]];
  }
  return [];
}

async function postNumber(number) {
  const body = {
    number,
    tableId: TABLE,
    source: "devtools",
    ts: new Date().toISOString(),
    roundId: `ext-${Date.now()}-${number}-${Math.random().toString(36).slice(2, 7)}`,
  };
  const res = await fetch(`${API}/api/spins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.warn("[rosistrat-bridge] POST spin failed", res.status);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "ribbon" || !Array.isArray(msg.numbers)) return;
  const numbers = msg.numbers.filter(
    (n) => Number.isInteger(n) && n >= 0 && n <= 36,
  );
  if (numbers.length < 5) return;

  const signature = numbers.join(",");
  if (signature === lastSignature) {
    sendResponse({ ok: true, posted: 0 });
    return;
  }
  const prev = lastSignature ? lastSignature.split(",").map(Number) : [];
  lastSignature = signature;
  if (!primed) {
    primed = true;
    sendResponse({ ok: true, posted: 0, primed: true });
    return;
  }
  const fresh = extractNew(prev, numbers);
  (async () => {
    for (const n of fresh) {
      try {
        await postNumber(n);
      } catch (err) {
        console.warn("[rosistrat-bridge] backend unreachable", err);
      }
    }
    sendResponse({ ok: true, posted: fresh.length, numbers: fresh });
  })();
  return true;
});

async function pollPendingPlan() {
  if (placing) return;
  try {
    const res = await fetch(
      `${API}/api/bet-plans/pending?tableId=${encodeURIComponent(TABLE)}`,
    );
    if (!res.ok) return;
    const row = await res.json();
    if (!row) return;

    const plan = row.payload && typeof row.payload === "object" ? row.payload : row;
    if (!plan || !plan.id || !Array.isArray(plan.spots)) return;

    placing = true;
    await fetch(`${API}/api/bet-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "placing" }),
    });

    const tabs = await chrome.tabs.query({
      url: [
        "*://*.novibet.com/*",
        "*://*.novibet.gr/*",
        "*://*.evo-games.com/*",
        "*://*.evolutiongaming.com/*",
      ],
    });
    let placed = false;
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: "place-plan",
          plan,
        });
        if (response && response.ok) {
          placed = true;
          break;
        }
      } catch {
        /* frame without placer */
      }
    }

    await fetch(`${API}/api/bet-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: placed ? "done" : "cancelled" }),
    });
  } catch (err) {
    console.warn("[rosistrat-bridge] plan poll failed", err);
  } finally {
    placing = false;
  }
}

setInterval(() => {
  void pollPendingPlan();
}, 700);
