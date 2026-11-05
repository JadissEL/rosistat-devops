/**
 * Watches the live results ribbon in this frame and reports the number row.
 * First snapshot is a baseline (not posted). Later changes post immediately.
 */
(function rosistatBridge() {
  if (window.__rosistatSpinBridge) return;
  window.__rosistatSpinBridge = true;

  function collectRibbon() {
    const chips = [];
    const nodes = document.querySelectorAll("span, div, li, button");
    for (const el of nodes) {
      if (el.childElementCount > 3) continue;
      const text = (el.innerText || "").trim();
      if (!/^(?:[0-9]|[1-2][0-9]|3[0-6])$/.test(text)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.width > 70 || rect.height < 10 || rect.height > 70) {
        continue;
      }
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      chips.push({ n: Number(text), x: rect.x, y: rect.y });
    }
    if (chips.length < 5) return [];

    const buckets = new Map();
    for (const chip of chips) {
      const key = Math.round(chip.y / 12);
      const list = buckets.get(key) || [];
      list.push(chip);
      buckets.set(key, list);
    }

    let best = [];
    for (const list of buckets.values()) {
      if (list.length > best.length) best = list;
    }
    if (best.length < 5) return [];

    best.sort((a, b) => a.x - b.x);
    const deduped = [];
    for (const chip of best) {
      const last = deduped[deduped.length - 1];
      if (last && Math.abs(last.x - chip.x) < 8) continue;
      deduped.push(chip);
    }
    return deduped.map((c) => c.n);
  }

  let lastSent = "";

  function tick() {
    const numbers = collectRibbon();
    if (numbers.length < 5) return;
    const signature = numbers.join(",");
    if (signature === lastSent) return;
    lastSent = signature;
    chrome.runtime.sendMessage({ type: "ribbon", numbers });
  }

  const observer = new MutationObserver(() => tick());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  setInterval(tick, 400);
  tick();
})();
