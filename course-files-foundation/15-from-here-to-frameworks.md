# 15 — From Here to Frameworks

The stated goal was not to write PHP applications from memory. It was to understand the technology well enough that Laravel, Symfony, WordPress and Shopware become legible rather than magical — and that building your own is conceivable.

This chapter closes that loop.

## What you built, and what it is called

Every piece of the small application maps onto something with a formal name and a framework equivalent.

| What you wrote | The concept | Laravel | Symfony |
|---|---|---|---|
| `index.php` as the only entry point | Front controller | `public/index.php` | `public/index.php` |
| `$routes` array | Route table | `routes/web.php` | `config/routes.yaml`, attributes |
| `routeToController()` | Dispatcher | `Illuminate\Routing\Router` | `HttpKernel` |
| `controllers/*.php` | Controllers | `app/Http/Controllers` | `src/Controller` |
| `views/*.view.php` | Views / templates | Blade | Twig |
| `views/partials/*.php` | Partials, includes | `@include` | `{% include %}` |
| `$heading` passed to a view | View data | `view('x', ['heading' => ...])` | `render('x.twig', [...])` |
| `functions.php` | Helpers | `Illuminate\Support\helpers` | services |
| `Database` class | Connection wrapper | `Illuminate\Database` | Doctrine DBAL |
| `config.php` returning an array | Configuration | `config/*.php` | `config/packages/*.yaml` |
| `abort(404)` | Error handling | `abort(404)` — the same name | `throw new NotFoundHttpException` |
| `Response::FORBIDDEN` | Status constants | `Response::HTTP_FORBIDDEN` | `Response::HTTP_FORBIDDEN` |
| `$_GET['id']` bound to a query | Request input | `$request->input('id')` | `$request->query->get('id')` |
| Ownership check before rendering | Authorization | Policies, gates | Voters, `#[IsGranted]` |

Nothing in the left column is a toy version of the right column. It is the same idea with fewer features.

## What frameworks add on top

Given that the skeleton is the same, what are they actually giving you?

**Route parameters.** `/notes/{id}` instead of `/note?id=17`. This requires pattern-matching URIs rather than exact-matching them — regular expressions, plus a compiled and cached route table so the matching stays fast.

**HTTP method routing.** `GET /notes` lists; `POST /notes` creates; `DELETE /notes/17` removes. Your router only ever considered the path, never the method.

**Middleware.** A pipeline of layers each request passes through before reaching a controller, and each response passes back through: authentication, CSRF checking, rate limiting, logging, compression. Structurally, this is the callback pattern from Chapter 06 arranged as a chain.

**Dependency injection containers.** Instead of `$db` being visible through shared scope, a controller declares what it needs and the container constructs and supplies it. This is what makes code testable, because you can substitute a fake.

**ORM.** Query builders and object–relational mappers turn `SELECT * FROM notes WHERE user_id = ?` into `Note::where('user_id', $id)->get()`, returning objects rather than arrays. Eloquent and Doctrine differ substantially in philosophy — Active Record versus Data Mapper — and the difference is worth understanding before choosing.

**Migrations.** Schema changes as versioned, executable code, so every environment's database can be rebuilt from source rather than hand-edited in a GUI.

**Template engines.** Blade and Twig add inheritance, components, and — critically — escaping by default, which closes the XSS hole from Chapter 12 automatically.

**Validation.** Declarative rules for incoming data with structured error messages.

**Autoloading via Composer.** No more `require` for classes. PSR-4 maps namespaces to directories, and classes load on first use.

Every one of those is a solution to a problem you can now name, because you have either hit it or been shown where it lies.

---

## WordPress and Shopware specifically

These two are different from Laravel and Symfony in a way worth understanding, because you will encounter both.

**WordPress** predates most modern PHP conventions and carries that history. It is not MVC. Its request cycle goes through a query parser and a **template hierarchy** — a fixed set of rules deciding which template file renders a given URL. Its extensibility comes from **hooks**: actions and filters, which are callbacks (Chapter 06) registered against named events. Its database layer is a global `$wpdb` object wrapping direct SQL, with `$wpdb->prepare()` playing the role Chapter 12 described.

If WordPress has previously felt arbitrary, that is because its conventions predate the ones this course taught. Knowing both makes the differences legible rather than confusing.

**Shopware 6** is built on Symfony, which means everything in the Symfony column above applies directly: its controllers are Symfony controllers, its templates are Twig, its dependency injection is Symfony's container. On top of that sits its own domain layer — the DAL, entity definitions, and an event system. Learning Symfony fundamentals is the fastest route into Shopware.

---

## What to learn next, roughly in order

The gaps this course leaves, ordered by how soon you will need them.

**1. Forms and `POST` requests.** Everything so far has been `GET`. Reading `$_POST`, the post-redirect-get pattern, and CSRF tokens — what they prevent and why they are necessary.

**2. Sessions and authentication.** How the server remembers a user across stateless requests. Session storage, cookies, `password_hash()` and `password_verify()`, and why you must never store or hash passwords yourself with anything else.

**3. Escaping output.** `htmlspecialchars()` everywhere user content is rendered. This is a small topic with large consequences and should arguably come first.

**4. Exceptions and error handling.** `try`/`catch`, custom exception classes, a global handler, and the distinction between errors shown to users and errors written to logs.

**5. Composer and autoloading.** The package manager, `composer.json`, PSR-4, semantic versioning, and the lockfile. This is the doorway to the wider ecosystem.

**6. Namespaces.** How PHP avoids class name collisions, and how namespaces map to directories under PSR-4.

**7. Deeper object orientation.** Inheritance, interfaces, abstract classes, traits, static members, and — more valuable than any of them — *when composition beats inheritance*.

**8. Testing.** PHPUnit or Pest. Unit versus integration versus feature tests. This is the single largest step-change in the quality of code you produce, and most people delay it far too long.

**9. Deeper SQL.** `JOIN` in its several forms, aggregates with `GROUP BY`, subqueries, transactions, `EXPLAIN` for reading query plans, and index design.

**10. HTTP in detail.** Caching headers, content negotiation, cookies, CORS, and how to design a REST API that does not fight the protocol.

## For the underlying computer science

The stated ambition was understanding the technology from the ground up, so:

- **How a request reaches PHP.** Nginx or Apache, PHP-FPM, the FastCGI protocol, worker processes. PHP's shared-nothing model — a fresh state for every request — and why that shaped the whole language.
- **Networking.** TCP, TLS, DNS resolution, and what actually happens between typing a URL and receiving bytes.
- **Character encoding.** UTF-8 in detail. Half of all mysterious text bugs are encoding bugs.
- **Databases internally.** B-tree indexes, query planning, transaction isolation levels, write-ahead logging.
- **Caching.** Opcode caching (OPcache), object caching (Redis), HTTP caching. What is safe to cache and what is not.

---

## Building your own framework

If the goal is genuinely to build one rather than only to use one, the honest sequence is:

1. Take the application from this course and add route parameters — pattern matching with capture groups.
2. Add HTTP method matching.
3. Wrap `$_SERVER`, `$_GET` and `$_POST` in a `Request` object, and the status code, headers and body in a `Response` object. Everything becomes testable.
4. Add a middleware pipeline. Each middleware receives the request and the next handler.
5. Add a dependency injection container, starting with a simple map of names to factory closures.
6. Add Composer and autoloading, and delete every `require` for a class.
7. Read Symfony's HttpKernel component. It is small, it is well documented, and it is the code most of the PHP world ultimately runs on.

You will not produce a competitor to Laravel, and that is not the point. You will produce something whose every line you understand, and afterwards no framework will look like magic.

---

## The thing to keep

If one habit is worth carrying out of all fifteen chapters, it is the one that appeared in almost every one of them:

**Code that works is the first draft.**

Every chapter here followed the same rhythm — write the naive version, run it, then improve it. Hardcoded values became variables. Repeated logic became functions. Duplicated markup became partials. Chained conditionals became a lookup table. Loose scripts became classes. Configuration moved out of code and up into the environment. Magic numbers became named constants.

None of those steps changed what the user saw. All of them changed how much the code cost to work with.

That is the discipline. Everything else is syntax.
