# Working notes

## How Fouad wants to be taught

- **Interactive over prose.** Charts, quizzes, shell emulators, simulators, labs. If a concept can be a widget, make it a widget.
- **Deeper than the source material.** The `course-files-foundation/` chapters are the floor, not the ceiling. Where the course says "later in your learning", teach it now.
- **Build, break, fix.** Every milestone ends in code that runs. Vulnerabilities get exploited on purpose before they get patched.
- **Name the framework equivalent.** Every hand-built piece should be tagged with what Laravel / Symfony / Next / WordPress calls it. The mission is legibility of the ecosystem, not PHP fluency.
- **Code review is wanted.** Fouad explicitly asked for review of each milestone commit.
- **Never prescribe tooling — teach it.** Raised directly on 31 Jul: a `sudo apt install` line with six unexplained packages is the same failure as being handed XAMPP at school. Every tool must arrive with the problem it solves, and at the moment that problem is felt. See [[0003-install-as-curriculum]] and Lesson 0000. This generalises: apply it to Composer, Docker, Xdebug and any future bundle.

## Style preferences carried from the global CLAUDE.md

- `const` over `let` in all JS written for lessons and widgets.
- Self-explanatory code over comments. No narration comments in lesson source.
- No AI co-author trailers in commits. Git identity: `Fouad Gantri <gantri.fouad@gmail.com>`, GitHub user `fgantri`.
- Prefer official CLIs over hand-authored config.

## Environment facts (verified 30 Jul 2026)

- WSL2, Linux 6.18, bash. Project root: `/mnt/c/Users/fgantri/Desktop/recap-php`.
- Present: git 2.53, node 22.23, npm 10.9, python 3.14, curl 8.18, VS Code 1.130, Chrome (Windows side).
- Installed for the bootcamp: `php-cli`, `php-mysql`, `php-sqlite3`, `php-curl`, `php-mbstring`, `mariadb-server`.
- Absent by choice: Docker.
- Workspace lives on the Windows filesystem via `/mnt/c` — filesystem watching and `chmod` behave oddly there. Worth a mention when permissions come up in Lesson 0002.

## Schedule

| Day | Date | Block | Milestone project |
|---|---|---|---|
| Fri | 31 Jul 2026 | The machine and the wire (0001–0007) | `01-http-server` |
| Sat | 1 Aug 2026 | The language and the structure (0008–0015) | `02-mini-framework` |
| Sun | 2 Aug 2026 | Data, danger, frameworks (0016–0024) | `03-notes-app`, `04-request-response` |
| Mon | 3 Aug 2026 | — | Course resumes |

## Open threads

- Follow-up markdown (`NEXT-STEPS.md`) to be written Sunday evening, seeding deeper lessons ~mid-August.
- Xdebug not installed; Lesson 0015 covers it as a "install this when you're back" item rather than a live exercise.
