# 04 — Conditionals and Booleans

## The problem

You want a page that says whether you have read a particular book. The book is *Dark Matter*. The message should differ depending on a fact that is not known when the code is written.

Start by making the book's name a variable:

```php
<?php $name = 'Dark Matter'; ?>

<h1><?php echo $name; ?></h1>
```

Refresh — identical output, but the title is now a value rather than a literal.

## Booleans

Next you need to record *whether the book has been read*. You could store the string `'yes'` or `'no'`, but that is a poor fit: it invites `'Yes'`, `'y'`, `'true'`, and every other variation. For a fact that has exactly two states, use a **boolean**.

```php
$read = true;
```

> **Foundation — Why booleans exist**
>
> A boolean holds one of exactly two values: `true` or `false`. Named after George Boole, whose algebra of logical operations underlies both this and the physical circuitry of your CPU.
>
> The value is not `'true'` — that would be a five-character string. It is the keyword `true`, with no quotes, and it is a distinct type.
>
> Booleans matter beyond storage, because every conditional in every program eventually reduces to one. `if ($x > 5)` evaluates `$x > 5` to a boolean and then branches on it. When you understand that comparison operators *produce* booleans, expressions like `$isVisible = $count > 0;` stop looking strange.

In a real application this value would come from a database (which books has this user read?) or from an external service — think of an API as a program on another machine that answers questions about data it holds. While learning, hardcoding it is fine.

---

## The `if` statement

A **conditional** creates a branch in your logic. The plainer way to say it: a conditional asks a question.

> If the sandwich shop is open, go in and eat. If not, go somewhere else.

That is the whole idea. In PHP:

```php
<?php
$name = 'Dark Matter';
$read = true;

if ($read) {
    $message = "You have read $name.";
}
?>

<p><?php echo $message; ?></p>
```

Read it piece by piece:

- **`if`** — the keyword that starts the branch.
- **`( ... )`** — the question. Your editor will close the parenthesis for you automatically; most do these days.
- **`{ ... }`** — the block. Everything between the braces runs *only* when the question evaluates to true.

`if ($read)` means: if the value in `$read` is true, run this block.

> **Foundation — Blocks, and why the braces matter**
>
> Braces group statements into a single unit. The `if` does not control one line; it controls the block. This same shape recurs everywhere — loops in Chapter 05, functions in Chapter 06, classes in Chapter 11 — and it is worth noticing early that they are all the same construct: *a header, then a block that runs under some condition.*
>
> Indentation inside braces is purely for humans. PHP does not care. But mis-indented code hides logic errors from your eyes, which is why every codebase enforces a convention.

## `else`

```php
if ($read) {
    $message = "You have read $name.";
} else {
    $message = "You have not read $name yet.";
}
```

`else` covers everything the `if` did not. There is also `elseif` for chaining several questions — you will build a chain of these in Chapter 09 before refactoring it away.

---

## Truthiness

`if` does not strictly require a boolean. PHP will convert whatever it finds into one.

> **Foundation — Truthy and falsy**
>
> When a non-boolean lands in a conditional, PHP coerces it. These values are **falsy**:
>
> - `false`
> - `0` and `0.0`
> - `''` (empty string) and `'0'`
> - `[]` (empty array)
> - `null`
>
> Essentially everything else is **truthy**, including `'0.0'`, `'false'`, `-1` and `[0]`.
>
> This is enormously convenient — `if ($books)` reads as "if there are any books" — and it is a genuine hazard. The string `'0'` being falsy catches people out regularly. When a value's type is uncertain, prefer an explicit check (`if ($count > 0)`, `if ($note !== false)`) over relying on coercion. You will see precisely why in Chapter 14, where a database query returning `false` has to be distinguished from returning an empty result.

---

## Comparison: the single most common beginner bug

Filtering a list by author, you might write:

```php
if ($book['author'] = 'Andy Weir') {   // WRONG
```

Every book suddenly reports Andy Weir as its author. The reason is the `=` sign.

**A single `=` assigns.** That line means *set this book's author key to 'Andy Weir'* — which succeeds, returns the assigned value, which is a non-empty string, which is truthy, so the branch always runs. And along the way it has silently corrupted your data.

**To compare, use `===`:**

```php
if ($book['author'] === 'Andy Weir') {
```

Three equal signs. Type it three times and you are fine.

> **Foundation — `==` vs `===`**
>
> PHP has two equality operators.
>
> `==` is **loose equality**: it converts types before comparing. Historically this produced surprises like `'abc' == 0` being true. Modern PHP (8.0+) fixed the worst cases, but loose comparison still means `'1' == 1` is true and `'1.0' == '1'` is true.
>
> `===` is **strict equality**: values must match *and* be of the same type. `'1' === 1` is false.
>
> The rule: **default to `===`.** Use `==` only when you have consciously decided that type coercion is what you want. The inequality forms follow the same pattern — `!=` loose, `!==` strict.
>
> The full comparison set: `<`, `>`, `<=`, `>=`, `===`, `!==`. Combine conditions with `&&` (and), `||` (or), and negate with `!`.

---

## Alternative syntax, for HTML

Braces are fine when PHP is the whole file. Inside a template full of HTML they read badly, because you are constantly closing and reopening PHP tags around them. PHP offers an alternative form:

```php
<?php if ($read): ?>
    <p>You have read <?php echo $name; ?>.</p>
<?php else: ?>
    <p>You have not read it yet.</p>
<?php endif; ?>
```

A colon opens the block; `endif;` closes it. Functionally identical to braces — it exists purely for readability when HTML is interleaved.

The same alternative form exists for loops (`endforeach`), and you will use it constantly from Chapter 05 onward. The convention that emerges in practice: **braces in logic files, colons in view files.**

---

## The ternary operator

For the narrow case of "if this, output A, otherwise output B", there is a compact form.

Written out:

```php
<?php
if ($isActive) {
    echo 'text-white';
} else {
    echo 'text-gray-400';
}
?>
```

As a ternary:

```php
<?php echo $isActive ? 'text-white' : 'text-gray-400'; ?>
```

The `?` asks the question. Truthy takes the value before the `:`; falsy takes the value after. The two forms are functionally identical.

Inside a template it compresses further using the short echo tag (Chapter 05), where even the semicolon becomes optional:

```php
<?= $isActive ? 'text-white' : 'text-gray-400' ?>
```

> **Foundation — Statements vs. expressions**
>
> An `if` block is a **statement**: it performs an action, it has no value.
>
> A ternary is an **expression**: it *evaluates to* a value, which is why it can sit directly inside an `echo`, be assigned to a variable, or be passed to a function.
>
> This distinction explains why the ternary exists at all, and why it is not simply a shorter `if`. It also explains the discipline around it: ternaries are excellent for choosing between two values, and terrible for expressing branching logic with side effects. Nesting them is nearly always a mistake.

---

## Where you stand

You can branch on a condition, you know the difference between assignment and comparison, and you know that PHP will happily coerce values in a conditional — which is a convenience to be used deliberately rather than accidentally.

**Next:** [05 — Arrays and loops](05-arrays-and-loops.md)
