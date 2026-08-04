# 14 — The Full Request Cycle

Every piece is now in place. This chapter assembles them into a working feature and, in doing so, makes the cycle explicit — because that cycle is what every framework you will ever use is organised around.

## Adding the navigation link

`views/partials/nav.php`, after the About link:

```php
<a href="/notes" class="<?= urlIs('/notes') ? 'text-white' : 'text-gray-400' ?>">Notes</a>
```

Click it and you get your own 404 page, correctly, because no route is registered.

## Registering the route

`router.php`:

```php
$routes = [
    '/' => 'controllers/index.php',
    '/about' => 'controllers/about.php',
    '/contact' => 'controllers/contact.php',
    '/notes' => 'controllers/notes.php',
];
```

Then `controllers/notes.php`, and `views/notes.view.php` to go with it. Duplicating `about.php` and `about.view.php` as a starting point is fine.

---

> **Foundation — The request cycle, stated plainly**
>
> Pause here, because you have just performed the loop you will perform for the rest of your career:
>
> 1. **A route is registered.** *When someone requests this URI, this file handles it.* Think of it as a listener.
> 2. **The request arrives.** The front controller reads the URI and finds the match.
> 3. **The controller runs.** It gathers whatever data is needed — from a database, an API, a session — and makes decisions: is this allowed, does it exist, what should happen.
> 4. **The controller loads a view**, having defined the variables the view needs.
> 5. **The view renders.** No decisions, only presentation.
> 6. **The response goes back** to the browser with a status code.
>
> Register a route → write a controller → write a view. That rhythm is identical in Laravel, Symfony, Rails and Django. The syntax differs; the shape does not.
>
> This is roughly the **MVC** pattern — Model, View, Controller. The Model layer is the piece this course has not formalised: the objects representing your domain data. Right now, raw arrays from the database play that role. In a framework, a `Note` class would.
>
> One honest caveat: purists point out that a view being "the HTML" is a loose reading of the original MVC definition, where the view was a richer object. The loose reading is what web frameworks actually use, and it is the right one to hold for now.

---

## Making the database available

The controller needs a database connection, but `index.php` currently requires the router *before* anything creates one. Dump `$db` inside the controller and you get *undefined variable* — the connection does not exist yet.

Fix the order in `index.php`:

```php
<?php

require 'functions.php';
require 'Database.php';

$config = require 'config.php';

$db = new Database($config['database']);

require 'router.php';
```

Now, by the time the router requires a controller, `$db` exists. And because `require` shares scope (Chapter 07), the controller can see it.

> **Foundation — Bootstrapping, and the limits of this approach**
>
> The sequence in `index.php` — load helpers, load classes, read config, build shared services, then dispatch — is the application's **bootstrap**. Every framework has one, and it does exactly these things in exactly this order.
>
> Passing `$db` around through shared scope works and does not scale. Every controller silently depends on a variable it never declared, and there is no way to see that dependency by reading the controller.
>
> The mature solution is **dependency injection**: a component declares what it needs (usually as constructor parameters), and a **container** supplies it. That is what Laravel's service container and Symfony's dependency injection component do, and understanding why they exist is much easier having felt the limitation of the shared-variable approach first.

---

## Listing the notes

`controllers/notes.php`:

```php
<?php

$heading = 'My Notes';

$notes = $db->query('SELECT * FROM notes WHERE user_id = 1')->fetchAll();

require 'views/notes.view.php';
```

`fetchAll` because you want every matching row.

The `1` is a placeholder for the currently logged-in user. Authentication — sessions, login, password hashing — is a topic in its own right and is not covered here. For now, assume user 1 is signed in.

`views/notes.view.php`:

```php
<ul>
    <?php foreach ($notes as $note): ?>
        <li>
            <a href="/note?id=<?= $note['id'] ?>">
                <?= $note['body'] ?>
            </a>
        </li>
    <?php endforeach; ?>
</ul>
```

Nothing here is new — it is the `foreach` from Chapter 05 over data from Chapter 11.

Add a row to the `notes` table in your database client and refresh. It appears. That is your first genuinely dynamic page: the content came from storage, not from source code.

> **Note on escaping.** `<?= $note['body'] ?>` outputs raw user content. As Chapter 12 flagged, that is an XSS vulnerability. The correct form is `<?= htmlspecialchars($note['body']) ?>`. Get into the habit now.

---

## The single-note page

Each note should link to its own page. Your router matches whole URIs, so dynamic segments like `/notes/17` are not possible yet. Use the query string instead:

```
/note?id=17
```

Notice the `<?= $note['id'] ?>` inside the `href` in the view above — each link now carries the ID of its own note. View the page source and you can see the IDs differ per link.

Register the route:

```php
'/note' => 'controllers/note.php',
```

`controllers/note.php`:

```php
<?php

$heading = 'Note';

$note = $db->query('SELECT * FROM notes WHERE id = :id', [
    'id' => $_GET['id'],
])->fetch();

require 'views/note.view.php';
```

Three things to notice:

**The parameter is bound, not interpolated.** Chapter 12. This is user input arriving from a query string.

**`fetch`, not `fetchAll`.** You want a single row. Using `fetchAll` here still "works" — you get an array containing one array — and then the view fails confusingly when it treats a list as a record. That confusion is genuinely instructive if you trigger it once on purpose.

**No intermediate variable.** You could write `$id = $_GET['id'];` first, but the value is used exactly once. As a general guideline, a variable referenced in a single place is often better inlined. (There is a real exception, and it appears later in this chapter.)

`views/note.view.php` displays the body and a link back to `/notes`.

---

## Authorization

There is a serious problem. Change the ID in the address bar to a note belonging to somebody else and you can read it.

> **Foundation — Authentication vs. authorization**
>
> Two words that get used interchangeably and mean different things.
>
> **Authentication** — *who are you?* Login, sessions, tokens, password verification.
>
> **Authorization** — *are you allowed to do this?* Permissions, ownership, roles.
>
> They are separate and both required. A correctly authenticated user is still not entitled to everything.
>
> The vulnerability you just found has a name: **insecure direct object reference** (IDOR). The application exposes a database ID in the URL and does not verify that the requester is entitled to the object behind it. Change the number, see somebody else's data.
>
> It is one of the most common vulnerabilities in real applications, precisely because the working version and the broken version look nearly identical. The fix is never obscuring the ID. The fix is checking ownership on every single request.

### Approach one — filter in the query

```php
$note = $db->query('SELECT * FROM notes WHERE user_id = :user_id AND id = :id', [
    'user_id' => 1,
    'id' => $_GET['id'],
])->fetch();
```

Now a note belonging to someone else simply is not found.

Refresh with a foreign ID and something breaks in a confusing way: the view errors out trying to use `$note` as an array.

Dump it:

```php
dd($note);
```

`false`.

> **Foundation — Why `fetch` returns `false`**
>
> `fetch()` returns the next row, or `false` when there is no row.
>
> That is a return value carrying two different meanings in two different types — a row (array) or a failure signal (boolean). PHP's dynamic typing (Chapter 03) lets it pass silently until something downstream tries to use it, at which point you get an error several lines away from the actual cause.
>
> This is why explicit checks beat truthiness. `if (! $note)` works here, but `if ($note === false)` states the intent precisely.
>
> Handling the failure case immediately, at the point where it can occur, is the general lesson. Errors that travel before surfacing are the expensive ones.

Handle it:

```php
if (! $note) {
    abort();
}
```

Your `abort()` from Chapter 09 sets a 404 and renders the error view.

### The problem with approach one

It works, and it conflates two different situations.

- The note does not exist → **404 Not Found** is correct.
- The note exists but belongs to someone else → **404 is a lie.** It was found. You are simply not allowed to see it.

That difference matters for debugging, for logging, for API consumers, and for being honest about what happened.

### Approach two — separate the two checks

```php
<?php

$currentUserId = 1;

$note = $db->query('SELECT * FROM notes WHERE id = :id', [
    'id' => $_GET['id'],
])->fetch();

if (! $note) {
    abort(404);
}

if ($note['user_id'] !== $currentUserId) {
    abort(403);
}

$heading = 'Note';

require 'views/note.view.php';
```

Now each failure gets its accurate answer:

- No such note → `404 Not Found`
- Not yours → `403 Forbidden`

Create `views/403.php` by copying `views/404.php` and changing the heading to *Unauthorized*, or better: *You are not authorized to view this page*. Being explicit costs nothing and saves a support ticket.

Test all three paths: your own note, someone else's note, and an ID that does not exist.

> **Foundation — Information disclosure, an honest complication**
>
> There is a real security argument on the other side. Returning `403` tells an attacker that a note with that ID *exists*. Returning `404` for both cases reveals nothing.
>
> Which is right depends on what you are protecting. For a note-taking app, `403` is clearer and the leak is trivial. For anything where the mere existence of a record is sensitive — medical records, private repositories, HR files — return `404` for both and log the distinction internally.
>
> GitHub does exactly this: a private repository you cannot access returns 404, not 403.
>
> This is worth internalising as a pattern of thinking. Correct is not always a single answer. It depends on the threat model, and knowing that a trade-off exists is what lets you make it deliberately.

---

## Magic numbers

Look at what the controller now contains: `1` and `403`. Both are **magic numbers** — literal values whose meaning is not stated anywhere.

> **Foundation — Why magic numbers are a problem**
>
> A magic number is a bare literal whose significance is implicit. You know today that the `1` means "the current user". In six months, or to a colleague, or in a codebase running for five years, it is just a number.
>
> This happens constantly. You read old code and find a `3` or a `0.85` and have no idea what it represents or whether changing it is safe.
>
> The fix is to attach a name. Two forms, and choosing between them is the interesting part.

### For the user ID — a variable

```php
$currentUserId = 1;

// ...

if ($note['user_id'] !== $currentUserId) {
```

Note that this deliberately breaks the guideline from earlier in the chapter about inlining single-use variables. The guideline is real; so is the exception. A variable can exist purely to name a value, and here the name is doing all of the work. Guidelines are heuristics, and knowing when one does not apply is more valuable than following it.

### For the status code — a class constant

`403` is different. You will abort with it in many places, and assigning `$forbidden = 403;` in each of them would be silly.

When you need a name available everywhere, create one place for it.

**`Response.php`**

```php
<?php

class Response
{
    const NOT_FOUND = 404;
    const FORBIDDEN = 403;
    const UNAUTHORIZED = 401;
    const SERVER_ERROR = 500;
}
```

Constants (Chapter 11): fixed values belonging to the class, accessed with `::`, written in uppercase to distinguish them from properties.

```php
require 'Response.php';

if (! $note) {
    abort(Response::NOT_FOUND);
}

if ($note['user_id'] !== $currentUserId) {
    abort(Response::FORBIDDEN);
}
```

> **Foundation — On creating files, and the smallness of good refactors**
>
> A small but real point: newcomers often hesitate to create a new file, as though there were a limit or a ceremony involved. There is not. You need a new file, you create one. That hesitation is a genuine roadblock and it is worth naming so you can drop it.
>
> The larger point is the size of the improvement. `abort(403)` became `abort(Response::FORBIDDEN)`. The behaviour is byte-for-byte identical. All that changed is that a reader no longer needs outside knowledge to understand the line.
>
> This is what most of programming looks like. Not grand redesigns — a long accumulation of small changes, each one making something slightly clearer. Codebases that are a pleasure to work in got that way one of these at a time.
>
> And the judgement remains yours. If everyone on your team reads `403` fluently, keep it. This is give and take, not doctrine. Deciding what needs clarifying and what does not is the skill.

---

## The finished controller

```php
<?php

require 'Response.php';

$currentUserId = 1;

$note = $db->query('SELECT * FROM notes WHERE id = :id', [
    'id' => $_GET['id'],
])->fetch();

if (! $note) {
    abort(Response::NOT_FOUND);
}

if ($note['user_id'] !== $currentUserId) {
    abort(Response::FORBIDDEN);
}

$heading = 'Note';

require 'views/note.view.php';
```

Read it as prose: find the note whose ID matches the query string. If there is none, abort with not found. If there is one but it was created by somebody else, abort with forbidden. Only if it exists *and* belongs to the current user does execution continue to the view.

That readability is the product of every refactor in this chapter, and the code does exactly what it did in its first ugly version.

## What is still missing

Honestly: quite a lot. Real authentication and sessions. Handling `POST` requests and forms. Creating, editing and deleting notes. Validation. CSRF protection. Escaping output. Pagination. Flash messages.

But the skeleton is complete and correct, and everything above is an addition to it rather than a change of shape.

**Next:** [15 — From here to frameworks](15-from-here-to-frameworks.md)
