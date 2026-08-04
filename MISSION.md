# Mission: Low-level web development, from the machine up

## Why

Fouad is partway through a PHP-from-scratch course and wants to return to it on **Monday 3 August 2026** with foundations deep enough that nothing in it — or in Laravel, Next.js, WordPress, Shopware or Cloudflare later — reads as magic. The goal is not to memorise how Laravel does routing; it is to know what a socket, a process, a request, a template and an index *are*, so that every framework becomes a recognisable arrangement of known parts.

The concrete outcome: be the developer who can open an unfamiliar stack and say "this is a front controller, that is a template engine, that cache is doing X" — the kind of engineer who has known the tech since the 1990s, without having lived through the 1990s.

## Success looks like

- Explaining, unprompted and correctly, every hop between typing a URL and pixels appearing — DNS, TCP, TLS, HTTP, web server, app runtime, database, template, response, render.
- Writing a working HTTP server from raw sockets, with no framework and no library.
- Building a front controller + router + controllers + views by hand, then naming which Laravel/Symfony class does each job.
- Demonstrating a SQL injection against own code, then closing it, and stating the general law it belongs to.
- Reading an unfamiliar framework's request lifecycle and mapping it onto the hand-built version within minutes.
- Four milestone commits on a public GitHub repo that read as a portfolio narrative, each code-reviewed.

## Constraints

- **Hard deadline:** bootcamp runs Fri 31 Jul – Sun 2 Aug 2026, ~8h/day (24h total). Course resumes Mon 3 Aug.
- Learns by doing — every lesson must end in something typed, run, or broken on purpose.
- Environment: WSL2 (Ubuntu) on Windows, VS Code, native `apt` PHP + MariaDB. No Docker.
- Prefers interactive HTML over prose: charts, quizzes, simulators, labs.
- Wants explicit bridges to the wider ecosystem (Next, Vite, Vercel, React/Vue, WordPress, Shopware/Shopify, Cloudflare) rather than PHP in isolation.
- A follow-up markdown is produced at the end, to seed deeper lessons roughly two weeks later.

## Out of scope

- Framework tutorials. No Laravel/Symfony code this weekend — only the mapping onto hand-built equivalents.
- Front-end craft: CSS design, component libraries, animation.
- DevOps depth: Kubernetes, CI pipelines, infrastructure-as-code.
- Language breadth. PHP is the vehicle; Go/Rust/Python comparisons only where they illuminate the mechanism.
