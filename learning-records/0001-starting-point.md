# Starting point: mid-course PHP, wants the layer underneath

Fouad is partway through a "PHP from scratch" video course and has produced a rewritten, expanded transcript of its first fifteen chapters (`course-files-foundation/`). That document already covers, at a working level: shell basics, `php -S`, HTTP request/response shape, PHP syntax through functions and closures, views and partials, superglobals, a front-controller router, SQL basics, PDO, prepared statements, foreign keys, and a full request cycle with authorization.

**Depth claimed: exposure, not mastery.** The material has been read and rewritten but not systematically practised, and the course was followed rather than built independently. Treat the fifteen chapters as *recognisable* rather than *owned* — the bootcamp's job is converting recognition into retrieval.

**The stated dissatisfaction is the key signal.** Fouad does not want more PHP; he wants the layer the course assumed — processes, sockets, filesystems, rendering, templating as a mechanism — and explicit bridges from those to Next, Vite, Vercel, Laravel, React/Vue, WordPress, Shopware and Cloudflare. Lessons that teach PHP without naming the general mechanism underneath will miss the mission.

**Implications for teaching:**
- Do not re-teach syntax as syntax. Teach the machine behaviour that makes the syntax make sense (call stack behind functions, hash maps behind arrays, opcodes behind `.php`).
- The course's own gaps are fair game and were explicitly invited: POST/forms, sessions/cookies, CSRF, output escaping, exceptions, transactions, caching, encoding.
- Assume comfort with a terminal and with git — but not with sockets, process models, or how a web server hands a request to a runtime.
- PHP and MariaDB were absent from the machine at the start of the bootcamp, which confirms the course was followed rather than practised locally.
