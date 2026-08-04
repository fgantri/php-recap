# 09 — Routing and the Front Controller

Until now the URL and the filesystem have been the same thing: `/about.php` in the address bar loads `about.php` on disk. This chapter breaks that link and puts you in charge of the mapping.

## Why break it?

Direct mapping seems simple, and it costs you a lot:

- URLs are forced to expose file names and extensions.
- Anything that should happen on *every* request — loading helpers, opening a database connection, starting a session, checking authentication — has to be repeated in every file.
- Dynamic URLs like `/notes/17` are impossible, because there is no file called `17`.
- Every publicly reachable `.php` file is an entry point into your application, which is a security surface.

The alternative is a **single point of entry**.

> **Foundation — The front controller pattern**
>
> Every request, whatever the URL, is handled by one file. That file bootstraps the application, examines the requested URI, and decides which piece of code should handle it.
>
> This is called the **front controller pattern**, and it is universal in modern web development. Laravel has `public/index.php`. Symfony has `public/index.php`. Django has a URL configuration module. Express has an app object. All the same idea.
>
> In production, a rewrite rule tells the web server to send everything to that one file — `.htaccess` with `mod_rewrite` on Apache, a `try_files` directive on Nginx. PHP's built-in development server does something close enough by default: it serves a file if one matches the path, and otherwise falls back to `index.php`. That fallback is what makes this chapter work without server configuration.
>
> The pattern also gives you one place to put anything that must happen on every request. That single property is worth the restructure on its own.

---

## Step 1 — Move controllers out of the web root

```
demo/
├── index.php            ← the only entry point
├── functions.php
├── router.php
├── controllers/
│   ├── index.php
│   ├── about.php
│   └── contact.php
└── views/
```

Move `index.php`, `about.php` and `contact.php` into `controllers/`, then create a fresh `index.php` at the root.

Test that the fallback works: put `echo 'hello there';` in the new root `index.php` and visit any path. It loads. Even a nonsense path loads it.

## Step 2 — Read the URI

```php
<?php

require 'functions.php';

dd($_SERVER['REQUEST_URI']);
```

Visit `/contact` and you see `/contact`. The value you need is right there.

Note that `functions.php` is now required exactly once, in the one file every request passes through. The *Cannot redeclare* problem from Chapter 07 is gone, and every controller can now delete its own `require 'functions.php'` line. Structural fixes beat workarounds.

## Step 3 — Match and dispatch

```php
<?php

require 'functions.php';

$uri = $_SERVER['REQUEST_URI'];

if ($uri === '/') {
    require 'controllers/index.php';
} elseif ($uri === '/about') {
    require 'controllers/about.php';
} elseif ($uri === '/contact') {
    require 'controllers/contact.php';
}
```

Update the navigation to drop the `.php` extensions — `/about`, `/contact` — since the URLs no longer correspond to files.

Home, about, contact. All working, and the URLs are clean.

## Step 4 — The query string problem

Visit `/contact?name=jeffrey`.

Nothing happens. Dump `$uri` and you see why: `REQUEST_URI` is the *full* path including the query string, so it is `/contact?name=jeffrey`, which matches none of your conditions.

> **Foundation — Anatomy of a URL**
>
> ```
> https://example.com:443/notes/17?sort=desc&page=2#comments
> \___/   \_________/ \_/\_______/ \______________/\_______/
>   |          |       |     |            |            |
> scheme     host    port   path        query      fragment
> ```
>
> - **scheme** — the protocol. `https`, `http`, `mailto`.
> - **host** — which machine (Chapter 02).
> - **port** — which listening program. Implied by the scheme when omitted.
> - **path** — which resource on that server.
> - **query string** — everything after `?`. `key=value` pairs joined by `&`. This is what fills `$_GET`.
> - **fragment** — everything after `#`. **Never sent to the server.** It is handled entirely by the browser, which is why you cannot read it in PHP.
>
> Routing decisions are made on the **path**. The query string carries parameters *to* the route, not part of its identity.

PHP has a function for the split:

```php
$uri = parse_url($_SERVER['REQUEST_URI'])['path'];
```

`parse_url` returns an associative array with `path`, `query`, and whatever other components are present. Dump it once to see the shape. Taking `['path']` gives you `/contact` regardless of what follows the `?`.

Now `/contact?name=jeffrey` routes correctly.

---

## Step 5 — Refactor: the routes map

Look at what the `if/elseif` chain actually expresses: *if the path is X, load Y.* That is a mapping — a key and a value. Chapter 05 gave you the structure for exactly that.

```php
$routes = [
    '/' => 'controllers/index.php',
    '/about' => 'controllers/about.php',
    '/contact' => 'controllers/contact.php',
];
```

A **lookup table**. Adding a route is now one line rather than a new branch.

To dispatch, check whether the current URI is one of the keys:

```php
if (array_key_exists($uri, $routes)) {
    require $routes[$uri];
}
```

`array_key_exists($key, $array)` does exactly what its name says: it reports whether the array has that key. If it does, `$routes[$uri]` is the controller path, and `require` accepts a variable.

That last point deserves emphasis. **`require` takes a runtime value.** Your program is now deciding, while running, which code to execute. That is the entire concept of dispatch, and it is what every router does.

> **Foundation — `array_key_exists` vs `isset`**
>
> Two ways to test for a key, with a difference that matters:
>
> ```php
> $data = ['name' => null];
>
> array_key_exists('name', $data);   // true  — the key is there
> isset($data['name']);              // false — the value is null
> ```
>
> `isset` returns false for a key whose value is `null`. `array_key_exists` only cares about the key.
>
> Use `array_key_exists` when the question is *does this route exist*. Use `isset` when the question is *do I have a usable value*. Choosing wrongly produces bugs that appear only for null values, which is to say bugs that appear in production.

---

## Step 6 — Handle unknown URIs

Request a path that is not in the map and you get a completely blank page. Reason it through: you read the URI, you build the routes, the key does not exist, so nothing runs and nothing is output.

That white page is a real failure being reported as success, which is the worst possible combination.

> **Foundation — HTTP status codes**
>
> Every HTTP response carries a three-digit code stating what happened. Clients, caches, search engines and monitoring tools all act on it. The first digit gives the class:
>
> | Range | Meaning | Common members |
> |---|---|---|
> | 2xx | Success | `200 OK`, `201 Created`, `204 No Content` |
> | 3xx | Redirection | `301 Moved Permanently`, `302 Found`, `304 Not Modified` |
> | 4xx | Client error — you asked wrongly | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity` |
> | 5xx | Server error — we broke | `500 Internal Server Error`, `503 Service Unavailable` |
>
> The distinction between 4xx and 5xx is the one to internalise. **4xx means the request was wrong. 5xx means the server was wrong.** Returning `200 OK` with a page that says "not found" is a genuine bug: crawlers will index it and monitoring will never alert you.
>
> `401` versus `403` also trips people up. `401` means *you are not authenticated* — we do not know who you are. `403` means *you are authenticated and still not allowed*. Chapter 14 uses this distinction properly.

```php
if (array_key_exists($uri, $routes)) {
    require $routes[$uri];
} else {
    http_response_code(404);
    echo 'Sorry, not found.';
    die();
}
```

`http_response_code()` sets the status on the response. Verify it in your browser's developer tools: right-click → Inspect → Network tab → refresh. The response now reports 404 rather than 200.

## A real 404 page

Text on a blank page is honest but poor. Build a view:

**`views/404.php`** — duplicate an existing view, change the heading to *Sorry, page not found*, and add a link back home.

```php
} else {
    http_response_code(404);
    require 'views/404.php';
    die();
}
```

Refresh and you hit *Undefined variable $heading*. Of course — the banner partial expects a `$heading` that nothing set. The banner is not appropriate on an error page anyway, so remove the `require` for it from `views/404.php`.

## Extract `abort()`

Three lines that always travel together are asking to be a function. In `functions.php`:

```php
function abort($code = 404)
{
    http_response_code($code);

    require "views/{$code}.php";

    die();
}
```

Then the router reads:

```php
if (array_key_exists($uri, $routes)) {
    require $routes[$uri];
} else {
    abort();
}
```

Three things happened in that small function, and each is a technique you will reuse:

**The default parameter.** `$code = 404` (Chapter 06) makes `abort()` work with no argument while `abort(403)` remains possible.

**String interpolation to build a path.** `"views/{$code}.php"` uses double quotes, because single quotes would not evaluate the variable (Chapter 03). The braces isolate the variable name from the surrounding characters.

**A known limitation.** `abort(422)` will fatal, because `views/422.php` does not exist. In production code you would check for the file and fall back to a generic error page. It is left unhandled here deliberately — knowing where your own code is thin is more valuable than pretending it is not.

## Extract the routing logic

Wrap the dispatch in a function, and hit the scope rule from Chapter 06 immediately: inside a function, `$uri` and `$routes` are invisible. Pass them in.

```php
function routeToController($uri, $routes)
{
    if (array_key_exists($uri, $routes)) {
        require $routes[$uri];
    } else {
        abort();
    }
}

routeToController($uri, $routes);
```

## Step 7 — Extract `router.php`

Everything in `index.php` except the initial `require` is routing. Move it all to `router.php`:

**`index.php`**

```php
<?php

require 'functions.php';
require 'router.php';
```

**`router.php`**

```php
<?php

$routes = [
    '/' => 'controllers/index.php',
    '/about' => 'controllers/about.php',
    '/contact' => 'controllers/contact.php',
];

function routeToController($uri, $routes)
{
    if (array_key_exists($uri, $routes)) {
        require $routes[$uri];
    } else {
        abort();
    }
}

$uri = parse_url($_SERVER['REQUEST_URI'])['path'];

routeToController($uri, $routes);
```

> **Foundation — Why extracting to a file is a real refactor**
>
> In a project with no discipline, everything ends up in `index.php`. That file becomes a few hundred lines of unrelated concerns, and the informal name for the result is **spaghetti code** — logic tangled together with no clear boundaries, where any change risks breaking something unrelated.
>
> The countermeasure is that each file should have one reason to exist. `router.php` parses the request URI and dispatches to a controller. That is its entire job, and you can now find the routing logic by looking for the file called router.
>
> This is the same principle as extracting a variable, a function or a partial. Only the granularity changes. What stays constant: **one concept, one place, one name.**

---

## What you have built

```
demo/
├── index.php          ← front controller: the only entry point
├── router.php         ← URI → controller mapping
├── functions.php      ← shared helpers: dd, abort, urlIs
├── controllers/
├── views/
│   ├── 404.php
│   └── partials/
```

Every request enters through one file, gets bootstrapped, is matched against a route table, and is dispatched to a controller that loads a view. Unmatched requests get a proper 404 with a proper status code.

That is, structurally, what a web framework does. The versions in Laravel and Symfony add pattern matching for dynamic segments, HTTP method matching, named routes, middleware pipelines and route caching — but the skeleton is what you just wrote.

**Next:** [10 — Databases and SQL](10-databases-and-sql.md)
