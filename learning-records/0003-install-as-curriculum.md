# Feedback: tooling must be taught, not prescribed — install as you go

On 31 July 2026 Fouad pushed back on the bootcamp's setup step. The original design opened with a single `sudo apt install` line covering six packages. His objection, in his own framing: he never understood *why* school made him install XAMPP, what PHP actually is, or why Apache, MySQL and Perl were all involved — and a six-package command he can't justify reproduces exactly that problem.

**He is right, and this is a teaching principle rather than a one-off request.** A prescribed toolchain is pedagogically identical to a bundle: the learner operates it without a model, and when it breaks they have no way to reason, only "reinstall it".

**What changed in response:**
- New **Lesson 0000 — What Am I Actually Installing?**, placed before 0001. Decodes XAMPP letter by letter (including that the second P is Perl, vestigial from 2002), explains PHP-on-disk as binary + extensions + ini, and introduces **SAPIs** — evidenced live from `apt-cache`, which lists `php8.5-cli`, `-fpm`, `-cgi`, `libapache2-mod-php8.5` and `phpdbg` as separate packages: one engine, five front doors.
- New reusable widgets in `assets/stackbuilder.js`: an **XAMPP decoder** and a **stack builder** where ticking a goal reveals the minimum package set, the install command, and what stays crossed out.
- Installation restructured into a **six-rung ladder** with checkpoints at the point of need: rung 1 (`php-cli`) in Lesson 0000, rung 2 (`mbstring`/`curl`/`sqlite3`) in 0009, rung 3 (MariaDB, framed as a genuine choice against SQLite) in 0016, rung 4 (nginx + FPM, optional) in 0007.
- `START-HERE.html` now leads with the ladder instead of a monolithic command.

**The verified fact the lesson is built on:** `php8.5-cli` has no web-server dependency whatsoever — its Depends are libedit, media-types, php-common, php-readline, tzdata, ucf and C libraries. Combined with `php -S` (built in since PHP 5.4, 2012), this means **one 12 MB package is a complete dynamic-web development environment**. That single fact dismantles most of XAMPP's rationale for a learner and is the lesson's central reveal.

**Implications for all future teaching:**
- Never prescribe a tool without stating the problem it solves and what breaks without it.
- Introduce dependencies at the moment of need, so the learner *feels* the gap first. The missing-capability error (`call to undefined function`, `could not find driver`) is a teaching opportunity, not an obstacle to pre-empt.
- Apply the same treatment to Composer, Docker, Xdebug and any future bundle. The three questions to model every time: what problem was this solving, is that still my problem, which pieces do I actually use?
- This generalises beyond tooling — it is the same instinct as the bootcamp's existing rule of teaching mechanism before syntax.
