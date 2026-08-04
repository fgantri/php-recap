# 07 — Separating Logic from Presentation

Right now you have one file containing everything: data, filtering, functions, loops, and all the HTML. The ability to mix PHP and HTML in one file is genuinely a feature — it is a large part of why PHP became what it is. It is also how files grow into something nobody can reason about.

The habit to build, starting now: **the code that gathers data and the code that displays it belong in different places.**

## Step 1 — Move the logic to the top

Before splitting files, just stop interleaving. Cut every PHP block out of the middle of the document and put it above the HTML:

```php
<?php

$books = [ /* ... */ ];

$filteredBooks = array_filter($books, fn ($book) => $book['author'] === 'Andy Weir');

?>
<!DOCTYPE html>
<html>
...
```

Nothing functional changed. What changed is that the file now announces its structure: logic first, presentation second.

The loop that builds the `<li>` elements stays in the HTML. That is not an inconsistency — it is the distinction that matters. That loop is not *deciding* anything. It walks a collection and renders markup. It is, in the common phrasing, **dumb**: it has data and it displays it.

## Step 2 — Two files

Create `index.view.php`. Move the entire HTML document into it, including the loop, and delete the logic from the top.

Then strip `index.php` down to logic only:

```php
<?php

$books = [ /* ... */ ];

$filteredBooks = array_filter($books, fn ($book) => $book['author'] === 'Andy Weir');
```

> **Foundation — Why the closing `?>` is gone**
>
> In a file that contains only PHP, omit the closing tag. Almost everyone follows this, and there is a concrete reason: anything after `?>` — including a stray newline or space — is output to the browser.
>
> That matters because HTTP headers must be sent before any body content. A single invisible whitespace after `?>` in an included file produces the notorious *headers already sent* error, and it is miserable to track down. Omitting the tag makes the problem impossible.
>
> Corollary: indenting the whole file because it opens with `<?php` is also unnecessary. Put the tag on its own line, leave a blank line after it, and write at column zero.

### Naming

The convention here is a choice among several. `index.template.php`, `index.html.php`, `index.view.php` all communicate the same idea. This guide uses **view**, because that is the word you will meet constantly once you open a framework, and it is better to be fluent in it early.

**View**, **template**, and *the HTML layer* are used interchangeably in practice.

## Step 3 — Load the view

Refresh and you get a blank page — nothing connects the two files yet.

```php
<?php

$books = [ /* ... */ ];
$filteredBooks = array_filter($books, fn ($book) => $book['author'] === 'Andy Weir');

require 'index.view.php';
```

> **Foundation — `require` and `include`, and what they actually do**
>
> Both take the contents of another file and execute them at that point, as if the code had been written there. The easiest accurate mental model is **paste the file here**.
>
> Two important properties follow:
>
> **1. Variables carry across.** Anything defined before the `require` is visible inside the required file, because it is all one execution with one scope. This is why `index.view.php` can use `$filteredBooks` without being handed it explicitly.
>
> **2. It happens at runtime, not compile time.** The path can be a variable, and the `require` can sit inside an `if`. This is the mechanism the entire router in Chapter 09 is built on.
>
> The four variants:
>
> | | Missing file | Repeat calls |
> |---|---|---|
> | `include` | warning, execution continues | loads again |
> | `require` | fatal error, execution stops | loads again |
> | `include_once` | warning, continues | loads at most once |
> | `require_once` | fatal error, stops | loads at most once |
>
> Use `require` for anything your program cannot run without — which is nearly everything. Use the `_once` variants for files that define functions or classes, for the reason in the next section.

Now the separation is real. `index.php` is where you would query a database, or call an external API for the top 20 books from some service. Once it has assembled the data, it loads the view that presents it.

## Why this matters

Need to change the logic? Open `index.php`. Need to switch the presentation from a `<ul>` to `<div>`s or a definition list? Open the view. Neither change requires reading the other file.

That is the whole payoff, and it does not sound like much until you are working in a file of eight hundred lines.

> **Foundation — A PhpStorm quirk worth knowing**
>
> PhpStorm may underline `$filteredBooks` in the view as undefined. PHP runs it fine. The IDE simply does not follow `require` statements when tracking variables by default.
>
> Fix: `Preferences → Editor → Inspections → PHP → Undefined → Undefined variable`, and enable *Search for variable definitions outside the current file*.
>
> The general lesson is more useful than the setting: editor warnings come from a separate static analysis, not from PHP. Sometimes the analyser is the one that is wrong. Knowing which is which is part of the job.

---

---

## A note on the markup itself

From here on, the example uses a proper HTML skeleton rather than a bare `<h1>` — a page shell with a navigation bar, a banner and a content area, styled with Tailwind CSS pulled in from a CDN.

None of that is the subject. It exists so there is something realistic to restructure and something reasonable to look at while you work. Tailwind is imported by adding a `<script>` or `<link>` tag from its documentation and then putting utility classes (`h-full`, `text-white`, `text-gray-400`) directly on elements.

You will not be tested on any of it. If you would rather use plain CSS, or no CSS at all, everything in the remaining chapters works identically — only the class attributes change.

---

## Multiple pages, and the duplication that follows

Add an about page. `about.php` gathers data (nothing yet) and loads `about.view.php`. To create the view quickly you duplicate `index.view.php`.

Alarm bells should be ringing. What happens at twenty pages? Change one navigation link and you are editing twenty files. Miss one and the site is subtly broken. This is the shape of problem that makes projects unmaintainable.

Do it once — deliberately, to feel it — then fix it.

### PHP's built-in server and file names

Visit `/about` and you get the home page. Visit `/about.php` and it works.

The built-in server maps request paths directly to files. When it cannot match a path, it falls back to the default — `index.php`. That is the same `index` convention from Chapter 02, and it is why the wrong page appeared rather than an error.

For now, link with the extension: `/about.php`. Chapter 09 removes it properly.

---

## Organising the files

Once you have more than a handful of files in one directory it stops being navigable. Create a `views` directory and move every `*.view.php` into it, then update the `require` paths:

```php
require 'views/index.view.php';
```

```
demo/
├── index.php
├── about.php
├── contact.php
└── views/
    ├── index.view.php
    ├── about.view.php
    └── contact.view.php
```

## Partials

Now attack the duplicated HTML. Create `views/partials/` and start pulling shared markup out.

**`views/partials/nav.php`** — cut the entire navigation block into it, then in each view:

```php
<?php require 'views/partials/nav.php'; ?>
```

Refresh. The navigation is back, now defined once.

Do the same for the rest:

- **`head.php`** — from the doctype through everything before the navigation
- **`footer.php`** — the closing markup
- **`banner.php`** — the page heading block

Each view collapses to something like:

```php
<?php require 'views/partials/head.php'; ?>
<?php require 'views/partials/nav.php'; ?>
<?php require 'views/partials/banner.php'; ?>

<main>
    <!-- the part that is actually unique to this page -->
</main>

<?php require 'views/partials/footer.php'; ?>
```

Adding a navigation link is now one edit instead of twenty.

> **Foundation — DRY, and its limits**
>
> The principle is *Don't Repeat Yourself*: every piece of knowledge should have a single authoritative representation. The word for the operation you just performed is **extraction** — pulling something out into its own named unit, which applies equally to variables, functions, files and classes.
>
> The counter-principle matters too, and gets less airtime. Extracting too early — before you have seen enough cases to know what actually varies — produces abstractions with awkward seams, full of flags and special cases. Two similar-looking things are not necessarily the same thing.
>
> A reasonable working rule: duplicate once without guilt. On the third occurrence, extract. By then you can see the shape of what varies.

---

## The new problem: partials need to vary

The banner now says the same thing on every page, because the text is hardcoded inside the partial. You need a piece of a partial to be dynamic.

The answer is already in your hands. `require` shares scope. So the file doing the requiring can define a variable, and the partial can use it.

In `about.php`:

```php
<?php

$heading = 'About Us';

require 'views/about.view.php';
```

In `views/partials/banner.php`:

```php
<h1><?= $heading ?></h1>
```

Every page sets its own `$heading`; the partial renders whatever it is given.

## Controllers

That change is worth naming, because you have just built something with a formal identity.

`index.php`, `about.php` and `contact.php` are now **controllers**.

> **Foundation — What a controller is**
>
> A controller is responsible for **accepting an incoming request and producing a response**.
>
> "Request" means exactly what it sounds like: a user visiting the about page is a request to see the about page. Your controller accepts it, does whatever preparation is necessary — reading a database, calling a service, checking permissions — and hands the assembled data to a view, which renders the response.
>
> Like *view*, this is an adopted term rather than a language feature. But it is the same term Laravel, Symfony, Rails and every other MVC framework uses, for the same job. What you have built by hand here is structurally the thing those frameworks give you.
>
> The pairing is worth stating plainly:
>
> - **Controller** — decides *what* the user gets. Gathers data. Contains logic.
> - **View** — decides *how* it looks. Contains markup. Contains no decisions.
>
> Keeping the second one dumb is the discipline. The moment a view starts making decisions, the separation stops paying for itself.

You could create a `controllers/` directory now. Hold off — Chapter 09 does it as part of a larger restructure where it makes more sense.

---

## Shared functions, and a fatal error worth understanding

Suppose you write a helper function and need it on every page. Copying it into each controller is the same duplication problem in a new costume. Extract it:

**`functions.php`**

```php
<?php

function dd($value)
{
    // Chapter 08 fills this in
}
```

Then in each controller:

```php
require 'functions.php';
```

This produces a specific and initially confusing failure, and it is worth meeting deliberately:

```
Fatal error: Cannot redeclare dd()
```

> **Foundation — Why redeclaration is fatal**
>
> Remember that `require` means *paste the file here*. If `index.php` requires `functions.php`, and then requires a controller that also requires `functions.php`, the function definition is pasted in twice.
>
> PHP will not allow two functions with the same name in the same namespace. There would be no way to decide which one to call. So it stops.
>
> Two fixes:
>
> 1. `require_once` — PHP tracks which files it has already loaded and silently skips repeats.
> 2. Require the file exactly once, at the single entry point, and never again.
>
> The second is what Chapter 09 arrives at, and it is the better structure. But `require_once` for anything defining functions or classes is a sound habit regardless, because you will not always control the load order.

---

## Where you stand

```
demo/
├── index.php          ← controller
├── about.php          ← controller
├── contact.php        ← controller
├── functions.php      ← shared helpers
└── views/
    ├── index.view.php
    ├── about.view.php
    ├── contact.view.php
    └── partials/
        ├── head.php
        ├── nav.php
        ├── banner.php
        └── footer.php
```

Three concepts are now in place, and they are the same three every web framework is organised around: **controllers** accept requests, **views** render responses, **partials** eliminate duplication within views.

What is still missing is a single place that decides which controller runs. That is the next chapter but one — first you need to be able to see what the browser is actually sending you.

**Next:** [08 — Superglobals and debugging](08-superglobals-debugging.md)
