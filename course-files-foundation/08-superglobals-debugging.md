# 08 — Superglobals and Debugging

To route requests you first have to see them. This chapter is about inspection — the single most-used skill in day-to-day development.

## `echo` is not enough

```php
echo 'gibberish';        // fine
echo ['gibberish'];      // Warning: Array to string conversion
```

`echo` expects a string. Handing it an array produces a warning and the useless output `Array`. Good to know — but you frequently *do* need to inspect an array or an object.

## `var_dump`

```php
var_dump($books);
```

`var_dump` — *variable dump* — prints the structure of any value: its type, its size, its keys, its nested contents, recursively.

The output is dense and unformatted in a browser, because it is emitted as plain text and HTML collapses whitespace. Wrap it:

```php
echo '<pre>';
var_dump($books);
echo '</pre>';
```

The `<pre>` tag preserves whitespace, and the dump becomes readable.

> **Foundation — The debugging toolkit**
>
> `var_dump` is one of several inspection functions, and knowing the differences saves time:
>
> - **`var_dump`** — types, lengths, structure. The most informative and the ugliest.
> - **`print_r`** — readable structure without type information. Nicer for large nested arrays.
> - **`var_export`** — outputs valid PHP source. Useful for copying a structure into code.
> - **`gettype`** — the type name of a single value.
>
> Beyond these sits a **step debugger** — Xdebug for PHP — which pauses execution at a chosen line and lets you inspect everything, step forward instruction by instruction, and walk up the call stack. It is unambiguously the more powerful tool, and worth installing once the basics are comfortable.
>
> Dump-based debugging survives anyway, because it is instant, needs no setup, and works identically in every environment.

## `die`

```php
echo '<pre>';
var_dump($books);
echo '</pre>';
die();
```

`die` terminates execution immediately. Nothing after it runs — not the rest of the file, not any view.

The word is the literal programming term for it. `exit()` is a synonym; they are interchangeable.

This matters because dumping without dying means your dump gets buried under the rest of the page, or overwritten by a redirect, or lost inside markup. Dump-and-die gives you a clean page containing only what you asked for.

## Build the tool once

You will do this dozens of times a day, so make it a function. In `functions.php`:

```php
function dd($value)
{
    echo '<pre>';
    var_dump($value);
    echo '</pre>';

    die();
}
```

`dd` is *dump and die*. The name is a widely used convention — Laravel ships exactly this function, and now you know precisely what it does.

```php
dd($books);
dd($heading);
```

This is a small function and it is the one you will call most. Note what happened structurally: a repeated four-line pattern became one named verb. Same refactor as Chapter 06, applied to your own workflow.

---

## Superglobals

```php
dd($_SERVER);
```

> **Foundation — What a superglobal is**
>
> A **superglobal** is a variable PHP creates for you and makes available in every scope — inside functions, inside required files, everywhere — without being passed in and without the `global` keyword.
>
> They exist because information about the request has to reach any code that might need it, and threading it through every function call would be intolerable. So PHP breaks its own scoping rules for a fixed, documented set:
>
> | Superglobal | Contains |
> |---|---|
> | `$_SERVER` | Request and server information — the URI, method, headers, paths |
> | `$_GET` | Query string parameters |
> | `$_POST` | Form body parameters |
> | `$_REQUEST` | GET, POST and cookies merged — avoid it, the ambiguity causes bugs |
> | `$_COOKIE` | Cookies sent by the browser |
> | `$_SESSION` | Server-side session data (once a session is started) |
> | `$_FILES` | Uploaded files |
> | `$_ENV` | Environment variables |
>
> Every one of them except `$_SESSION` and `$_ENV` is filled from data the client sent. **Treat all of it as hostile until proven otherwise.** Chapter 12 shows exactly what happens when you do not.
>
> Frameworks wrap these in a Request object rather than reading them directly, which makes code testable — you can construct a fake request without a real HTTP server. But underneath, that object is reading these arrays.

## Reading the current URL

Inside the `$_SERVER` dump, find `REQUEST_URI`.

```php
echo $_SERVER['REQUEST_URI'];
```

On the home page this is `/`. On the about page, `/about.php`. It is the path portion of the URL the browser asked for.

That single value is enough to build a router, which is the next chapter. First, use it for something smaller.

---

## Conditionally styling the active navigation link

Your navigation should highlight the page you are on. You now have everything needed.

In `views/partials/nav.php`:

```php
<a href="/" class="<?php if ($_SERVER['REQUEST_URI'] === '/') { echo 'text-white'; } else { echo 'text-gray-400'; } ?>">
    Home
</a>
```

It works, and it is unreadable. An `if/else` whose only job is to choose between two strings is exactly the case the ternary exists for (Chapter 04):

```php
<a href="/" class="<?= $_SERVER['REQUEST_URI'] === '/' ? 'text-white' : 'text-gray-400' ?>">
    Home
</a>
```

Better. Repeat it for each link, changing only the URI being tested:

```php
<a href="/about" class="<?= $_SERVER['REQUEST_URI'] === '/about' ? 'text-white' : 'text-gray-400' ?>">
    About
</a>
```

Still cumbersome — `$_SERVER['REQUEST_URI'] === '...'` is a lot of noise to repeat, and it exposes an implementation detail in the middle of a template.

## Extract a helper

In `functions.php`:

```php
function urlIs($value)
{
    return $_SERVER['REQUEST_URI'] === $value;
}
```

The function returns a boolean — true or false — which is all the ternary needs:

```php
<a href="/" class="<?= urlIs('/') ? 'text-white' : 'text-gray-400' ?>">Home</a>
<a href="/about" class="<?= urlIs('/about') ? 'text-white' : 'text-gray-400' ?>">About</a>
<a href="/contact" class="<?= urlIs('/contact') ? 'text-white' : 'text-gray-400' ?>">Contact</a>
```

> **Foundation — Why this small change is worth making**
>
> The improvement looks trivial, and it is. Call it a micro-improvement. But an enormous portion of a programming career consists of exactly these: small, cheap changes that each make the code slightly clearer, accumulating into a codebase that is pleasant rather than exhausting to work in.
>
> There are two substantive wins hiding in this one.
>
> **Naming.** `urlIs('/about')` states intent. `$_SERVER['REQUEST_URI'] === '/about'` states mechanism. Templates should read as intent.
>
> **A single point of change.** If you later need to strip query strings, handle trailing slashes, or normalise case, you change one function rather than every template. That property — one concept, one place — is the entire reason to extract anything.
>
> Note also that the helper reads `$_SERVER` from inside a function without it being passed in. That is superglobal behaviour, and it is the one place where breaking scope is normal.

## The scope problem returns

Define `urlIs` in `index.php` and the home page works while `/about` and `/contact` fail with *undefined function*. Of course — the function only exists in the file that declared it.

Copying it into all three controllers is the duplication problem again. Instead, `functions.php` holds it and each controller requires that file:

```php
require 'functions.php';
```

This is exactly the situation that produces *Cannot redeclare* when two files both require it (Chapter 07). The next chapter's single entry point solves it structurally, by making sure `functions.php` is required exactly once, at the top of the one file every request passes through.

---

## Where you stand

- `var_dump` shows you structure; `die` stops execution; `dd()` combines them into the tool you will use constantly.
- `$_SERVER` and `$_GET` are superglobals — PHP-provided, available everywhere, filled with data from the client.
- `$_SERVER['REQUEST_URI']` tells you which page was requested, which is the raw material for routing.
- Repeated conditions belong behind a named helper.

**Next:** [09 — Routing and the front controller](09-routing.md)
