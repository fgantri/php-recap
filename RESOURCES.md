# Low-level web development — Resources

Verified reachable 30 July 2026. Two entries return `403` to automated checks (anti-bot, not dead) and are marked.

## Knowledge — the wire and the protocol

- [MDN Web Docs: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
  The reference the industry actually uses. Use for: any question about methods, headers, status codes, caching, CORS, cookies. Start here before the RFCs.
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
  The normative definition of methods, status codes and header fields. Use for: settling arguments, and for reading how a spec is written. Dense but surprisingly readable.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/)
  The canonical, free, thirty-year-old introduction to sockets in C. Use for: understanding `socket / bind / listen / accept` before you meet PHP's wrapper around them. Lesson 0004 leans on this.
- [alex/what-happens-when](https://github.com/alex/what-happens-when)
  Community-maintained, obsessively detailed answer to "what happens when you type google.com and press enter". Use for: Lesson 0006, and as a lifelong checklist of things you don't yet know.
- [web.dev — The Critical Rendering Path](https://web.dev/articles/critical-rendering-path)
  Google's account of how bytes become pixels: HTML → DOM, CSS → CSSOM, layout, paint. Use for: the browser half of the pipeline, which most back-end material skips.

## Knowledge — servers and runtimes

- [nginx documentation](https://nginx.org/en/docs/)
  Use for: what a real web server does that `php -S` does not — `try_files`, rewrites, upstreams, static file serving.
- [Apache HTTP Server documentation](https://httpd.apache.org/docs/)
  Use for: `.htaccess`, `mod_rewrite`, and understanding the shared-hosting world WordPress grew up in.
- [PHP Manual: FastCGI Process Manager (FPM)](https://www.php.net/manual/en/install.fpm.php)
  Use for: the missing link between nginx and PHP. The single most under-explained piece of the LEMP stack.

## Knowledge — PHP itself

- [PHP Manual](https://www.php.net/manual/en/)
  The primary source, and unusually good. Use for: function signatures, and especially the user-contributed notes on older pages. Always prefer this over blog posts.
- [PHP The Right Way](https://phptherightway.com/)
  Community-maintained guide to modern practice, explicitly written against the bad tutorials of the 2000s. Use for: sanity-checking that a pattern you saw is still current.
- [PHP-FIG — PSR standards](https://www.php-fig.org/psr/)
  Use for: PSR-4 autoloading (why `Database.php` must be named that), PSR-7 HTTP messages, PSR-12 style. This is the shared vocabulary of the whole ecosystem.

## Knowledge — data

- [Use The Index, Luke!](https://use-the-index-luke.com/)
  Markus Winand's free book on SQL indexing and performance. Use for: B-trees, why an index helps, why it sometimes doesn't, and how to read an execution plan. Lessons 0017–0018 draw on it. Best single SQL resource in existence.
- [MySQL Reference Manual](https://dev.mysql.com/doc/) *(403s to bots; opens fine in a browser)*
  Use for: exact syntax, data types, storage-engine behaviour. MariaDB is a drop-in fork — this manual applies to what you installed.

## Knowledge — security

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
  The industry's consensus list of what actually breaks applications. Use for: knowing which classes of bug are worth being paranoid about.
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
  Practical, per-topic defensive guidance — SQL injection, XSS, CSRF, session management, password storage. Use for: the *how* once the Top Ten tells you the *what*. Lesson 0020 and 0023 cite it directly.

## Knowledge — configuration and deployment

- [The Twelve-Factor App](https://12factor.net)
  Twelve short chapters that explain why config lives in the environment, why processes are stateless, and why builds are separate from releases. Use for: Lesson 0022. Explains a great deal of Vercel, Heroku and Cloudflare's design in about 40 minutes of reading.

## Knowledge — the bridge to frameworks

- [Symfony HttpKernel component](https://symfony.com/doc/current/components/http_kernel.html)
  The request→response engine most of the PHP world ultimately runs on, including Drupal and Shopware. Use for: seeing your hand-built front controller written properly. Small enough to read in full.
- [Laravel documentation](https://laravel.com/docs)
  Use for: the mapping table in Lesson 0024. Read the "Request Lifecycle" and "Service Container" pages specifically — they describe exactly what you build by hand this weekend.
- [Next.js documentation](https://nextjs.org/docs)
  Use for: SSR / SSG / ISR / streaming as *rendering strategies*, which is the JavaScript world's answer to the same question PHP answered in 1995.
- [Vite — Why Vite](https://vite.dev/guide/why)
  Use for: the clearest existing explanation of why front-end build tools exist at all. Directly relevant to why PHP needs no build step.
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
  Use for: what "the edge" means, and how a request/response handler looks when the server is not a machine you own.

## Knowledge — general craft

- [Julia Evans — wizard zines](https://wizardzines.com/)
  Short illustrated zines on exactly the layer this mission targets: DNS, HTTP, bash, debugging, containers. Use for: making a concept stick after a lesson. The free comics alone are worth the visit.
- [Dan Luu's blog](https://danluu.com/)
  Long-form, evidence-heavy writing on how computers actually behave versus how we assume they do. Use for: developing the scepticism that separates senior engineers from confident ones.

## Wisdom — communities

- [r/PHP](https://www.reddit.com/r/PHP/) *(403s to bots; opens fine in a browser)*
  Moderated against beginner spam, which means the signal is high. Use for: "is this pattern still current", architecture critique, ecosystem news.
- [Laracasts Discuss](https://laracasts.com/discuss)
  The forum attached to the course world Fouad is already in. Use for: PHP and Laravel questions where you want a working answer rather than a debate.
- [phpc.social](https://phpc.social/)
  The PHP community's Mastodon instance — where a lot of core contributors and library maintainers actually post. Use for: following the people who write the tools, and asking questions in public.
- Stack Overflow — `[php]`, `[mysql]`, `[http]` tags
  Use for: specific error messages. Search before asking; the answer almost always exists.

## Gaps

- **No high-trust interactive SQL practice site is listed yet.** Lesson 0017 ships a browser SQL playground instead. Worth replacing with a real graded resource before the follow-up sessions.
- **Nothing here on Shopware or Shopify internals.** Both were named in the mission. Shopware's docs are Symfony-derived and can be reached through the HttpKernel entry; Shopify is a hosted platform with a different model (Liquid templating, hosted admin) and needs its own resource once it becomes relevant.
- **No book-length text on operating systems.** The process/filesystem/socket layer is taught here from first principles; if it lands well, *Operating Systems: Three Easy Pieces* (free online) is the natural next step and should be added after the bootcamp.

## Community preferences

Not yet discussed with Fouad. Do not assume willingness to post publicly — offer, don't push.
