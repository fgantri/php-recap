# Bootcamp built and delivered; retention is now the open question

The full three-day workspace was authored on 30 July 2026, ahead of the 31 Jul – 2 Aug bootcamp: 24 interactive lessons, 4 milestone projects, 6 reference documents, and a shared widget library (`assets/`). Every widget was verified working in a real browser before the lessons were built on it — three genuine bugs were found and fixed that way (terminal task-completion resetting, `which -a` unsupported, and a SQL parser that read `WHERE` as a table alias, silently disabling all filtering).

**This record captures coverage, not learning.** Nothing here is evidence that Fouad has learned anything — the material was written, not yet worked through. The next record should be written only after the weekend, based on what he can actually retrieve.

**The instrument for that already exists:** `NEXT-STEPS.md` §5.1 is a nine-item self-check list of the weekend's load-bearing ideas. Its purpose is to find what *faded*, because the bootcamp is by design massed practice — 24 lessons in three days — which reliably builds fluency and unreliably builds retention. Whatever survives two weeks of course work is genuinely owned; whatever doesn't needs spacing and interleaving rather than re-teaching.

**Implications for the next block:**
- Do not assume any weekend topic is retained. Probe first (§5.1), then decide.
- Module A (Composer / PSR-4 / namespaces) should come first regardless of the probe results — it is the prerequisite for reading real codebases and was the largest deliberate omission.
- Revisit weekend material in *new contexts* rather than only adding topics. Interleaving is now the priority, not coverage.
- The `assets/` widget library is reusable and `sqlplay.js` exposes `window.SqlEngine` specifically so future lessons can build custom database labs without rewriting the engine.
