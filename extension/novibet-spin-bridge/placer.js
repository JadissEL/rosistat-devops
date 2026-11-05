/**
 * Places a confirmed multi-spot plan by clicking chips + table spots.
 * Best-effort heuristics for Evolution-style DOM. Human must confirm in RoSiStrat first.
 */
(function () {
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function click(el) {
    if (!el) return false;
    el.scrollIntoView({ block: "center", inline: "center" });
    const opts = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new PointerEvent("pointerdown", opts));
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    el.dispatchEvent(new PointerEvent("pointerup", opts));
    el.dispatchEvent(new MouseEvent("mouseup", opts));
    el.dispatchEvent(new MouseEvent("click", opts));
    return true;
  }

  function findByHints(hints) {
    const nodes = Array.from(
      document.querySelectorAll("button, div, span, td, th, label"),
    );
    for (const hint of hints) {
      const h = hint.toLowerCase();
      for (const el of nodes) {
        const t = (el.innerText || el.getAttribute("aria-label") || "")
          .trim()
          .toLowerCase();
        if (!t) continue;
        if (t === h || t.includes(h)) {
          const r = el.getBoundingClientRect();
          if (r.width > 8 && r.height > 8) return el;
        }
      }
    }
    return null;
  }

  function findChip(denom) {
    const label = String(denom);
    const alt =
      denom >= 1 && Number.isInteger(denom) ? String(Math.floor(denom)) : label;
    return (
      findByHints([label, `€${label}`, `${label}€`, alt, `€${alt}`]) || null
    );
  }

  function chipBreakdown(amount, denoms) {
    let left = Math.round(amount * 100);
    const ordered = [...denoms]
      .map((d) => Math.round(Number(d) * 100))
      .filter((d) => d > 0)
      .sort((a, b) => b - a);
    const clicks = [];
    for (const d of ordered) {
      while (left >= d) {
        clicks.push(d / 100);
        left -= d;
      }
    }
    return clicks;
  }

  async function placePlan(plan) {
    const denoms = plan.chipDenoms || [500, 100, 25, 5, 1, 0.2];
    const report = [];
    for (const spot of plan.spots || []) {
      if (!spot.amount || spot.amount <= 0) continue;
      const chips = chipBreakdown(spot.amount, denoms);
      const target = findByHints(spot.spotHints || [spot.label, spot.id]);
      if (!target) {
        report.push({ id: spot.id, ok: false, reason: "spot_not_found" });
        continue;
      }
      let ok = true;
      for (const chip of chips) {
        const chipEl = findChip(chip);
        if (!chipEl) {
          ok = false;
          report.push({ id: spot.id, ok: false, reason: `chip_${chip}_missing` });
          break;
        }
        click(chipEl);
        await sleep(80);
        click(target);
        await sleep(100);
      }
      if (ok) report.push({ id: spot.id, ok: true, chips: chips.length });
    }
    return report;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== "place-plan") return;
    placePlan(msg.plan || {})
      .then((report) => sendResponse({ ok: true, report }))
      .catch((err) =>
        sendResponse({ ok: false, error: String(err && err.message) }),
      );
    return true;
  });
})();
