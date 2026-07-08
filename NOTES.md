# Walk the Route — Project Notes

A living document for ideas, planned features, and a record of what's shipped.
Add anything here as it comes up — no need to be formal.

---

## 💡 Ideas & Backlog (not yet built)

### Predictive ETA with rest-break buffer

Make the **Finish** time account for planned stops (designated rest-break areas,
traffic waits) so participants get a realistic "with breaks" arrival time from
the **start**, not just a reactive ETA.

- **Current behaviour:** Finish = `now + remaining walking minutes`. It slips
  later *while* someone is stopped, but assumes continuous walking once moving
  again — it does **not** pre-budget for breaks still to come.
- **Options discussed:**
  1. Add `X` minutes per planned rest stop still ahead (needs the number of rest
     areas + a typical stop length, e.g. 4 stops × 10 min).
  2. A simple flat buffer (a % or fixed minutes) for typical stopping.
- **Needed before building:** number of rest areas + typical stop length.
- **Where it lives in code:** `setRouteTimeStrip()` inside `updateDistanceDisplay()`
  in `index.html`.

---

## ✅ Recently shipped (2026-07-08)

- **High-accuracy GPS** enabled (uses the GPS chip; 5s max position age) —
  addresses accuracy degradation and false route jumps.
- **Progress tracking fixed** — removed a bug where progress always returned 0%
  once you moved >30m from the start.
- **GPS state hysteresis** — reduces rapid weak/locked flickering.
- **Automatic route-jump detection** — flags physically impossible GPS jumps
  (`auto-route-jump` events) so they no longer need logging by hand.
- **Progress ring fix** — the circular arc was stuck at 0%; now fills correctly.
- **Section vs. percentage** — top-left shows current **Section**, the ring and
  bar show overall route **percentage** (with a smooth sliding bar).
- **Distance smoothing** — distance rounds to cleaner steps (10m at range, 5m
  mid-range, exact on approach) so small GPS jitter doesn't flicker.
- **Live Finish ETA** — the Finish time now updates as `now + remaining`, so it
  responds when a walker stops or slows.

---

## 📌 Handy reminders

- **Before a real test walk:** open the field log (**Log issues**) → tap
  **Clear local log** → then **Start Walk**, so the export is clean.
- **After the walk:** **Share / Export** to save the JSON. Don't clear the log
  until you've confirmed the export saved.
- **Service worker:** bump `SERVICE_WORKER_VERSION` (in `index.html`) and
  `CACHE_NAME` (in `service-worker.js`) whenever shipping changes, so phones pick
  up the new version cleanly.
