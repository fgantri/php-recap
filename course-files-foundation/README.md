# PHP From Scratch — A Ground-Up Rebuild of the Transcript

This is your transcript, rewritten. Nothing was summarised away: every concept, every command, every warning and every "why" from the source material is here. What was removed is only the noise — the pauses, the "click here", the "cross your fingers", the repeated sentences, the on-screen navigation.

What was **added** is the layer the video assumed you already had. Whenever the original said *environment*, *shell*, *server*, *port*, *scope*, *instance*, *superglobal* or *status code* without stopping to define it, this version stops. Those additions are marked as blockquoted **Foundation** asides. They exist so that when you finish, you do not merely know how to write PHP — you know what the machine is doing underneath it, well enough to eventually write the framework rather than only use it.

---

## The path

Read in order. Each chapter assumes the previous one and nothing else.

| # | Chapter | What you walk away understanding |
|---|---------|----------------------------------|
| 01 | [The machine, the shell and the environment](01-machine-shell-environment.md) | What a program is, what an interpreter is, what the shell is doing, what "environment" means, how PHP got onto your machine |
| 02 | [HTTP, servers, and your first dynamic page](02-http-and-first-page.md) | Client/server, ports, `localhost`, static vs. dynamic, `php -S`, the `index` convention, PHP tags, `echo` |
| 03 | [Strings, variables and types](03-strings-variables-types.md) | Memory, identifiers, concatenation, single vs. double quotes, interpolation, refactoring |
| 04 | [Conditionals and booleans](04-conditionals-booleans.md) | Branching, truthiness, `=` vs `==` vs `===`, the ternary, alternative syntax |
| 05 | [Arrays and loops](05-arrays-and-loops.md) | Indexed and associative arrays, zero-based indexing, nesting, `foreach`, short echo tags |
| 06 | [Functions](06-functions.md) | Call stack, parameters vs. arguments, `return`, scope, anonymous functions, callbacks, `array_filter` |
| 07 | [Separating logic from presentation](07-logic-and-views.md) | Views, partials, controllers, `require` vs `include`, why duplication kills projects |
| 08 | [Superglobals and debugging](08-superglobals-debugging.md) | `$_SERVER`, `$_GET`, `var_dump`, `die`, building your own `dd()`, reading the request |
| 09 | [Routing and the front controller](09-routing.md) | Single entry point, route maps, `parse_url`, status codes, `abort()`, the 404 page |
| 10 | [Databases and SQL](10-databases-and-sql.md) | Why a database exists, tables, types, `NULL`, primary keys, `SELECT`, `WHERE` |
| 11 | [Objects, PDO, config and environments](11-objects-pdo-config.md) | Classes, instances, `$this`, constructors, visibility, constants, DSN, prepared statements, config files |
| 12 | [SQL injection and prepared statements](12-sql-injection.md) | The attack in full, why string-building is fatal, parameter binding |
| 13 | [Relationships and data integrity](13-relationships-integrity.md) | Foreign keys, unique indexes, cascades, orphan records |
| 14 | [The full request cycle](14-full-request-cycle.md) | Route → controller → model → view, authorization, 404 vs 403, magic numbers |
| 15 | [From here to frameworks](15-from-here-to-frameworks.md) | Exactly which piece of Laravel, Symfony, WordPress or Shopware corresponds to which thing you just built by hand |

---

## The mental model to carry through all of it

Every chapter is a piece of one sentence. Hold this sentence in your head from the beginning, and each new topic slots into it rather than floating free:

> A browser sends **text** over a network to a program that is listening on a port. That program hands the text to PHP. PHP runs your code top to bottom, possibly asking a database for data, and produces more **text**. That text goes back over the network, and the browser draws it.

That is the whole of web development. Frameworks are large because they answer *how* at every step, not because the sentence gets longer.

## How to work through this

Type the code. Do not copy-paste it. The muscle memory for `<?php ?>` is a real thing and it only comes from typing it badly a hundred times.

When something breaks, read the error message before changing anything. PHP's error messages name the file, the line, and usually the exact problem. Learning to read them is a larger skill than learning the syntax.

Refactor as you go. A running theme of the whole course: code that works is the first draft, not the last one.
