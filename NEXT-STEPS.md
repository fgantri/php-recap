# NEXT-STEPS.md

**Written:** 30 July 2026, at the end of building the bootcamp
**For:** the follow-up sessions, roughly mid-August 2026, after two more weeks of the PHP course

This is the handoff document. It records what the weekend covered, what it deliberately did not, and what the next block of teaching should be built from. Add your own notes to the sections marked **← your input** before we resume — those are the parts I cannot know without you.

---

## 1. What the bootcamp actually covered

Twenty-four lessons and four projects, grouped in three days.

| Day | Block | Lessons | The through-line |
|---|---|---|---|
| Fri | The machine and the wire | 0001–0007 | Processes, files, sockets, HTTP, the server/runtime split |
| Sat | The language and the structure | 0008–0015 | PHP as a machine: opcodes, memory, hash maps, the stack, templating, routing |
| Sun | Data, danger, frameworks | 0016–0024 | Storage, SQL, indexes, PDO, injection, integrity, state, the ecosystem map |

**Design principle used throughout:** never teach a PHP feature as syntax. Teach the mechanism underneath it (the call stack behind functions, the hash map behind arrays, the opcode array behind the file), then name the framework equivalent. That principle should continue.

### Beyond the source course

The original `course-files-foundation/` chapters were the floor. These were added because the course named them as gaps or skipped them entirely:

- Sockets and the accept loop from first principles (0004) — the course started at `php -S`
- The full DNS → TCP → TLS → render pipeline (0006)
- nginx / PHP-FPM / FastCGI and the CGI origin of `$_SERVER` (0007)
- PHP's compile-to-opcode model, OPcache, and the request lifecycle (0008)
- Copy-on-write, zvals, object handles (0009)
- Packed vs hashed arrays and operation costs (0011)
- Output buffering as the mechanism of every template engine (0013)
- Route parameters and HTTP method matching (0014) — the course explicitly deferred both
- Error hierarchy, global handlers, promoting warnings to exceptions (0015)
- B-trees, EXPLAIN, the leftmost prefix rule (0018)
- Modern PHP: constructor promotion, `readonly`, enums, `strict_types` (0019)
- **Cookies, sessions, POST, PRG, CSRF, password hashing (0023)** — the single biggest gap in the original
- The full ecosystem map including the JavaScript world (0024)

---

## 2. What was deliberately left out

These were *chosen* omissions, not oversights. Each is a candidate for the next block.

### High priority — needed soonest

| Topic | Why it was skipped | Why it matters next |
|---|---|---|
| **Composer, PSR-4, autoloading** | Would have meant `require` disappearing before the mechanism was understood | The doorway to the entire ecosystem. Nothing modern works without it |
| **Namespaces** | Only meaningful once Composer exists | Prerequisite for reading any real codebase |
| **Testing (Pest / PHPUnit)** | Project 4 touched it with a hand-rolled harness | The single largest step-change in code quality. Most people delay it far too long |
| **Exceptions in depth** | Lesson 0015 covered the hierarchy but not custom exception design | Where to catch, what to throw, and how to model failure |
| **File uploads** | Needs `$_FILES`, MIME validation, storage outside the web root | Every real app has them, and they are a common vulnerability |

### Medium priority — deepens what exists

| Topic | Builds on |
|---|---|
| **Deeper OOP** — interfaces, abstract classes, traits, static, and *when composition beats inheritance* | 0019 |
| **Transactions and isolation levels** | 0016, 0021 |
| **Advanced SQL** — subqueries, CTEs, window functions, `EXPLAIN ANALYZE` | 0017, 0018 |
| **Caching** — OPcache tuning, Redis, HTTP caching, cache invalidation | 0006, 0008 |
| **Character encoding in depth** — UTF-8, collations, normalisation | 0009, 0019 |
| **HTTP in depth** — content negotiation, CORS, conditional requests, designing a REST API | 0005 |

### Lower priority — worthwhile later

- Queues and background jobs (why not everything belongs in the request cycle)
- WebSockets and server-sent events (what happens when you *don't* close the socket)
- Docker, and what a container actually is at the kernel level (namespaces, cgroups)
- CI/CD pipelines built on exit codes (Lesson 0003 with consequences)
- Observability — structured logging, metrics, tracing
- Build-your-own-framework, continued: route caching, autowiring via reflection, an event dispatcher

---

## 3. Proposed structure for the next block

Three modules, each roughly a weekend or several evenings. **Module A should come first regardless** — everything else is easier afterwards.

### Module A — Joining the ecosystem
*Composer, PSR-4, namespaces, autoloading, semantic versioning, the lockfile, `composer audit`.*
Ends with: the Project 3 notes app converted to Composer + namespaces, every `require` for a class deleted.

### Module B — Testing and design
*Pest or PHPUnit. Unit vs integration vs feature. Test doubles and why the container from Project 4 makes them possible. Then interfaces, composition over inheritance, and refactoring toward testability.*
Ends with: a real test suite over the notes app, running in GitHub Actions on every push.

### Module C — Production concerns
*Transactions, caching layers and invalidation, queues, structured logging, deployment (atomic symlink releases + OPcache reset), environment management, monitoring.*
Ends with: the notes app deployed somewhere real, with a rollback that works.

---

## 4. Open threads from the weekend

Things explicitly promised or flagged as "later":

- **Xdebug is not installed.** Lesson 0015 treats it as a to-do. `sudo apt install php-xdebug` plus VS Code config — worth an hour with help.
- **nginx + PHP-FPM never installed locally.** Lesson 0007 taught it conceptually; wiring it up by hand in WSL is a strong exercise.
- **No ORM has been touched.** Deliberate — the SQL had to come first. Eloquent (Active Record) vs Doctrine (Data Mapper) is the natural next comparison, and matters directly for Shopware.
- **Shopware and Shopify were named in the mission but only sketched** in Lesson 0024. Shopware is reachable through Symfony; Shopify is a different model (hosted, Liquid) and needs its own treatment if it becomes relevant.
- **`RESOURCES.md` has a `## Gaps` section** listing missing resources — worth revisiting.
- **No community has been joined.** `RESOURCES.md` lists candidates (r/PHP, phpc.social, Laracasts Discuss). Never pushed, and it should stay that way unless you raise it.

---

## 5. ← Your input: fill this in before we resume

The sections below are the ones I cannot write for you. A few sentences each is plenty, and they will shape the next block more than anything above.

### 5.1 What actually stuck?

After two weeks of course work, which of these can you still explain *without looking*? Be honest — the ones that faded are the most valuable information here, because they tell us what needs spacing and interleaving rather than re-teaching.

- [ ] The four syscalls that make a TCP server, and why `accept()` returns a new socket
- [ ] Why a parse error blanks the whole page but a runtime error doesn't
- [ ] Copy-on-write, and why objects behave differently
- [ ] Why `in_array` is O(n) but `array_key_exists` is O(1)
- [ ] What `try_files … /index.php` accomplishes
- [ ] Why prepared statements are safe, without using the word "escape"
- [ ] Why an index on `(user_id, created_at)` can't serve a filter on `created_at` alone
- [ ] Why CSRF works even over HTTPS with a strong password
- [ ] The 404-vs-403 trade-off and what decides it

### 5.2 What did the course cover in these two weeks?

*(so the next block builds on it rather than repeating it)*

>

### 5.3 What confused you, in the course or in the bootcamp?

*(confusion is the highest-value signal available — it points directly at what to teach next)*

>

### 5.4 Has the mission changed?

`MISSION.md` currently says: understand the whole pipeline low-level so that frameworks become legible, aimed at appreciating Laravel / Next / WordPress / Shopware / Cloudflare. Still right? Narrower? Broader? Has a specific job, project or deadline appeared that should steer this?

>

### 5.5 Which projects got built, and did any get reviewed?

>

---

## 6. Notes for whoever teaches the next block

- **Fouad learns by doing.** Every lesson must end in something typed, run, or broken on purpose. Pure-prose lessons will not land.
- **Interactive over static.** The widget library in `assets/` is reusable — `quiz`, `recall`, `terminal`, `serverloop`, `httplab`, `sqlplay` (which exposes `window.SqlEngine` for custom labs). Build on it rather than starting fresh.
- **Always name the framework equivalent.** The mission is ecosystem legibility, not PHP fluency. A lesson that teaches a mechanism without saying "this is what Laravel calls X" has done half the job.
- **Spacing and interleaving matter now.** The bootcamp was necessarily massed practice — 24 lessons in three days. That builds fluency, not retention. The next block should *deliberately* revisit weekend material in new contexts rather than only adding new topics. Section 5.1 above is the instrument for finding out what needs it.
- **Code review was explicitly requested** for each milestone. Do it as a real review — security first on Project 3 — not as encouragement.
