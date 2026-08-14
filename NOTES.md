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
- **Closer "return to my position" zoom** — tapping the position button now zooms
  in tight (dogwalk 18, heathrow/bledlow 17.8); full-route view unchanged.

---

## 🏢 Commercialisation readiness (if it goes to a pro dev/design team)

Honest assessment: the app is an **excellent, proven prototype** — the domain
logic (GPS confidence, hysteresis, route snapping, field logging, offline PWA) is
sound and the route config is cleanly separated. A competent team could follow
it, **but they'd most likely refactor rather than build on it directly.** Treat
the current codebase as a de-risked spec of exactly how the product should work.

**Strengths to keep:**

- Config-driven `ROUTES` object (data separated from logic).
- Route data externalised as GeoJSON; sensible service-worker caching.
- Clear, well-named functions.

**Gaps a professional handover would need addressing (in priority order):**

1. **Split the monolith** — `index.html` is ~8,000+ lines of inline HTML + CSS +
   JS. Two levels of effort here:
   - **A — Quick & low-risk (a tidy-up for "another day"):** extract the inline
     `<style>` → `styles.css` and `<script>` → `app.js`, then add both to the
     service worker's `APP_ASSETS`. Mostly mechanical; one device test pass.
   - **B — Full modularisation (bigger, riskier, do with the wider rebuild):**
     break `app.js` into ES modules (config/gps/route-math/map/field-log/ui).
     Real work because lots of shared global `let` state is read+written across
     what would become module boundaries — needs untangling + tests first.
   - **Decision (2026-07-08):** deferred. Too much risk mid-testing; priority is
     a reliable app for the event. Revisit A on a calm day; leave B for a pro
     rebuild alongside build tooling + tests.
2. **Add build tooling** — `package.json`, a bundler (Vite), ESLint + Prettier.
3. **Introduce TypeScript** for the GPS/route logic (type safety on the maths).
4. **Reduce global mutable state** — many module-level `let` vars; encapsulate.
5. **Add tests** — unit tests around core maths (`getRouteProgress`,
   `deriveGpsConfidenceState`); important for a safety-adjacent product.
6. **Component structure** — UI is hand-managed via `getElementById`/`innerHTML`;
   a team would likely rebuild in a framework (React/Vue/Svelte).
7. **Secrets/config** — proper env management for the Mapbox token in production.
8. **Docs** — `README.md` (setup/deploy) + `ARCHITECTURE.md`.

---

## 📌 Handy reminders

- **Before a real test walk:** use `index.html?route=bledlow&fieldLog=1`
  (or `index.html?fieldLog=1` for Heathrow), then tap **Clear local log** →
  **Start Walk**, so the export is clean.
- **After the walk:** **Share / Export** to save the JSON. Don't clear the log
  until you've confirmed the export saved.
- **Service worker:** bump `SERVICE_WORKER_VERSION` (in `index.html`) and
  `CACHE_NAME` (in `service-worker.js`) whenever shipping changes, so phones pick
  up the new version cleanly.
