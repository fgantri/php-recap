# 06 — Functions

If variables and arrays are the nouns of programming, **functions are the verbs**. Their job is to be called, to do something, and usually to hand a result back.

## The problem that motivates them

You have a repository of books. In real life that is hundreds or thousands of records, and the first thing any user wants is to narrow them down — by author, by release year, by category. Right now everything is hardcoded, so start with the crude version and improve it.

### First attempt: filter inside the loop

```php
<ul>
    <?php foreach ($books as $book): ?>
        <?php if ($book['author'] === 'Andy Weir'): ?>
            <li><?= $book['name'] ?></li>
        <?php endif; ?>
    <?php endforeach; ?>
</ul>
```

This works. Only Andy Weir's books render; *Do Androids Dream of Electric Sheep* is skipped.

(If you wrote `=` instead of `===` here, revisit Chapter 04 — that mistake silently rewrites your data rather than comparing it.)

It works, but the author's name is hardcoded in the middle of a template, and the template is now doing selection work rather than presentation work. Both are problems.

---

## Defining a function

```php
function filterByAuthor()
{
    // logic goes here
}
```

The keyword `function`, a name of your choosing, parentheses, then a block.

Notice the shape is the same as an `if`: a header, then a braced block that runs conditionally. The difference is the condition. An `if` block runs when its expression is truthy; a **function block runs when you call it**, and not before.

Calling it:

```php
filterByAuthor();
```

Name, parentheses, semicolon.

```php
<p><?= filterByAuthor() ?></p>
```

Refresh: nothing. Correct — the function does nothing and returns nothing, so there is nothing to echo.

## `return`

```php
function filterByAuthor()
{
    return 'gibberish';
}
```

Now the call produces a value.

> **Foundation — What happens when you call a function**
>
> A **call stack** is the structure the interpreter uses to track where it is. When you call a function:
>
> 1. The current position is pushed onto the stack.
> 2. A new **stack frame** is created — a fresh workspace holding the function's parameters and local variables.
> 3. The function body executes in that frame.
> 4. `return` ends execution immediately and produces a value.
> 5. The frame is discarded, the previous position is popped off the stack, and execution resumes there with the returned value in hand.
>
> Two consequences follow directly. First, **`return` exits the function immediately** — nothing after it runs. Second, variables created inside the function vanish when the frame is discarded, which is the mechanism behind scope, below.
>
> This is also what "stack trace" means in an error message: the list of frames that were open when things went wrong, newest first. Learning to read one is worth an afternoon.

---

## Parameters and arguments

The function needs the books to work on. Declare that requirement in the parentheses:

```php
function filterByAuthor($books)
{
    // ...
}
```

Call it without supplying them and PHP stops with a clear error: *Too few arguments to function filterByAuthor()*. The function declared what it needs, and you did not provide it.

```php
filterByAuthor($books);
```

> **Foundation — Parameter vs. argument**
>
> The **parameter** is the name in the definition — the placeholder. The **argument** is the actual value you pass at the call site.
>
> The pair `($books)` in the definition and `($books)` in the call happening to share a name is a coincidence of this example. They are separate things: the parameter is a local variable inside the function's own frame, initialised from whatever the caller supplied. Rename either one and nothing breaks.
>
> The list of parameters is called the function's **signature**. When you change a signature you change the contract with every caller, which is why signature changes ripple.

## Writing the filter

Deliberately naive first — PHP has a built-in for this, and you will get there at the end of the chapter, but writing it by hand is what makes the built-in comprehensible.

```php
function filterByAuthor($books)
{
    $filteredBooks = [];

    foreach ($books as $book) {
        if ($book['author'] === 'Andy Weir') {
            $filteredBooks[] = $book;
        }
    }

    return $filteredBooks;
}
```

Create an empty array. Walk the input. When a book matches, append it (the `[]` append syntax from Chapter 05). When it does not match, do nothing at all — no `else` needed. Return the result.

Use it in the template:

```php
<?php foreach (filterByAuthor($books) as $book): ?>
    <li><?= $book['name'] ?></li>
<?php endforeach; ?>
```

You are not looping over the function. You are looping over **what the function returned**, which is an array. The call is evaluated first; the loop then walks its result.

## Why this is an improvement

You took logic that was confusing to read and tucked it behind a name that describes what it does. Anyone reading the template sees `filterByAuthor($books)` and understands the intent without reading the implementation.

That is the core value of functions, and it scales without limit. The body could contain loops, conditionals, database queries, calls to external services — arbitrary complexity — and the call site stays one readable line.

## Making the author a parameter

Hardcoding `'Andy Weir'` inside the function is the obvious next weakness:

```php
function filterByAuthor($books, $author)
{
    $filteredBooks = [];

    foreach ($books as $book) {
        if ($book['author'] === $author) {
            $filteredBooks[] = $book;
        }
    }

    return $filteredBooks;
}

filterByAuthor($books, 'Andy Weir');
```

Change the signature and your editor immediately flags every call site that is now incomplete. That feedback loop is one of the reasons to work in an IDE.

> **Foundation — Scope**
>
> Variables defined inside a function exist only inside that function. Variables defined outside are **not** visible inside it — unlike some languages, PHP functions do not automatically see the enclosing scope.
>
> ```php
> $books = [...];
>
> function broken() {
>     return count($books);   // Undefined variable $books
> }
> ```
>
> The fix is to pass it in as a parameter, which is exactly what you just did. This looks like an inconvenience and is actually the point: a function whose behaviour depends only on its arguments can be understood, tested and moved without reading the rest of the program. A function that reaches out and grabs whatever happens to be lying around cannot.
>
> The same limitation bites in Chapter 09, when you extract routing logic into a function and it loses sight of `$uri` and `$routes` — with the same fix.
>
> PHP does provide `global` and `static` to break scope. Both are best avoided while you are learning the habits that make them unnecessary.

---

## The duplication problem

Now you need to filter by release year as well. The instinct many people have is to copy:

```php
function filterByYear($books, $year)
{
    // identical body, comparing releaseYear instead
}
```

That works. And it does not scale — ten filter criteria would mean ten near-identical functions, each one a place where a bug fix has to be applied separately.

The rest of this chapter is the path from that duplication to something genuinely flexible. It goes in three steps.

### Step 1 — Extract a variable

Anywhere a function call sits inline, you can lift it into a variable:

```php
$filteredBooks = filterByAuthor($books, 'Andy Weir');

foreach ($filteredBooks as $book) { ... }
```

**Extract variable** is the actual jargon for this, and it is a refactor you will perform thousands of times: take a piece of logic, give it a name, substitute the name where the logic was. Behaviour identical, readability improved, and the value now has a place to be inspected.

### Step 2 — Anonymous functions

Nothing requires a function to have a name.

```php
function ($book) {
    return $book['author'] === 'Andy Weir';
};
```

Written alone, this is valid PHP. Your editor will warn that the expression is unused — note the wording: *unused*, not *invalid*. It is a perfectly good function that nobody has done anything with.

So what do you do with one? Two things: assign it to a variable, or pass it to another function.

```php
$filter = function ($books, $author) {
    // ...
};

$filteredBooks = $filter($books, 'Andy Weir');
```

Note the semicolon after the closing brace. A named function definition is a statement and needs no semicolon; this is an *assignment expression*, so it does.

> **Foundation — First-class functions, closures, lambdas**
>
> The technical term for an unnamed function is a **lambda**, from Alonzo Church's lambda calculus in the 1930s — the mathematical model of computation that predates computers and underlies functional programming. "Anonymous function" is the same thing in plainer words.
>
> Being able to store a function in a variable and pass it as an argument is called having **first-class functions**. It means functions are values like any other, not a special category the language treats differently.
>
> A **closure** is a lambda that captures variables from the scope where it was created. PHP requires you to be explicit about capture with the `use` keyword:
>
> ```php
> $author = 'Andy Weir';
> $matches = function ($book) use ($author) {
>     return $book['author'] === $author;
> };
> ```
>
> Modern PHP also has **arrow functions**, which capture automatically and are limited to a single expression:
>
> ```php
> $matches = fn ($book) => $book['author'] === $author;
> ```
>
> This explicitness is why the parameter naming below uses `$fn` — it makes arrow-function syntax feel familiar when you meet it.

### Step 3 — Generalise

Start by removing every assumption from the names. If the function might filter by category or release year, `author` cannot appear in it. If it might filter something other than books, `books` cannot appear either:

```php
function filter($items, $key, $value)
{
    $filteredItems = [];

    foreach ($items as $item) {
        if ($item[$key] === $value) {
            $filteredItems[] = $item;
        }
    }

    return $filteredItems;
}

filter($books, 'author', 'Andy Weir');
```

Better. `$items` (or `$data`, or `$array` — the choice is stylistic) says "any collection". You now pass the key and the value to match.

But it is still not flexible enough. *Give me every book released after 2000* is impossible, because the function can only test for exact equality. The comparison itself is hardcoded.

### The move: pass the comparison in

Write the code you wish existed:

```php
$filteredBooks = filter($books, function ($book) {
    return $book['releaseYear'] >= 2000;
});
```

Now the caller decides how the comparison is made. Equality, greater-than, string matching, anything expressible in PHP.

Make it real by changing the signature to accept a function instead of a key and a value:

```php
function filter($items, $fn)
{
    $filteredItems = [];

    foreach ($items as $item) {
        if ($fn($item)) {
            $filteredItems[] = $item;
        }
    }

    return $filteredItems;
}
```

The line that changed is the condition. Where it previously compared two values, it now **calls the function it was given**, passing the current item, and branches on the result.

> **Foundation — Callbacks and higher-order functions**
>
> A function passed as an argument so that another function can call it is a **callback**. A function that accepts or returns a function is a **higher-order function**. `filter` is now higher-order.
>
> This is the single most important idea in the chapter, because it inverts control. `filter` owns the *mechanism* — walk the collection, collect the matches, return the result. The caller owns the *policy* — what counts as a match. Neither has to know anything about the other.
>
> Once you see this pattern you see it everywhere: sorting with a custom comparator, event handlers, middleware, route handlers, `array_map`. Every framework you will ever touch is built on it. Laravel's entire routing layer is callbacks registered against URIs; Chapter 09 has you building a primitive version of exactly that.

Both of these now work against the same function:

```php
filter($books, fn ($book) => $book['author'] === 'Andy Weir');
filter($books, fn ($book) => $book['releaseYear'] >= 2000);
```

---

## `array_filter`

Having built it, delete it. PHP ships with a large library of array functions, and this is one of them:

```php
$filteredBooks = array_filter($books, fn ($book) => $book['author'] === 'Andy Weir');
```

The signature is nearly identical to what you wrote, which is not a coincidence — you converged on the standard design because it is the natural one.

> **Foundation — The standard library, and why you write things twice**
>
> Building something and then discarding it for the built-in is not wasted effort. You now understand what `array_filter` does mechanically, so you will recognise the next function in this family on sight:
>
> - `array_map` — transform every element, return a new array of the same length
> - `array_filter` — keep the elements that pass a test
> - `array_reduce` — collapse a collection into a single value
> - `array_key_exists` / `in_array` — membership tests (Chapter 09 uses the first)
> - `count`, `array_keys`, `array_values`, `array_merge`, `usort`
>
> A general principle worth adopting: before writing a utility, check whether the language already has it. PHP's standard library is large, somewhat inconsistently named for historical reasons, and worth browsing.
>
> One gotcha with `array_filter` specifically: it preserves the original keys. Filtering `[0=>'a', 1=>'b', 2=>'c']` down to the last item gives you `[2=>'c']`, not `[0=>'c']`. Wrap it in `array_values()` when you need a clean list.

---

## Default parameter values

One more piece of function syntax you will need in Chapter 09:

```php
function abort($code = 404)
{
    // ...
}

abort();      // $code is 404
abort(403);   // $code is 403
```

A parameter with a default becomes optional. This lets a function have a sensible common behaviour while remaining configurable. Parameters with defaults must come after those without.

---

## Where you stand

You can define functions, pass arguments, return values, and reason about scope. More importantly you understand that a function is a value — it can be stored, passed, and called by code that knows nothing about it. That idea is the hinge the rest of the course turns on.

**Next:** [07 — Separating logic from presentation](07-logic-and-views.md)
