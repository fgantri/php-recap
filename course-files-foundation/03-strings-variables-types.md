# 03 — Strings, Variables and Types

## Joining strings together

Suppose the second half of your greeting should be swappable — `world`, `universe`, `town`, `folks`. First you need to be able to build one string out of two.

Many languages use `+` for this. PHP does not, and will tell you so: *wrong string concatenation operator*. In PHP the operator is a single dot.

```php
<?php echo 'hello ' . 'world'; ?>
```

The word for this is **concatenation** — joining strings end to end. The `.` is the **concatenation operator**.

> **Foundation — Why not `+`?**
>
> In PHP, `+` is strictly arithmetic. `'5' + '5'` is `10`, because PHP converts those strings to numbers to do the sum. If `+` also meant concatenation, `'5' + '5'` would be ambiguous — is it `10` or `'55'`? Languages that overload `+` for both have to define a rule, and those rules are a famous source of confusion in JavaScript.
>
> PHP avoids the question by giving concatenation its own symbol. The cost is that you have to remember a second operator. The benefit is that `+` never surprises you.

If your server is not still running, start it again with `php -S localhost:8888` and refresh. Same output — but now you have a joint you can put something dynamic into.

---

## Variables

```php
<?php
$greeting = 'hello';
echo $greeting . ' everybody';
?>
```

A variable is created with a `$` followed by a name. `$greeting` is a good name; `$hello_world_thing` would technically work but tells a future reader nothing.

The statement ends with `;`, for the same reason every statement does.

> **Foundation — What a variable actually is**
>
> A variable is a **name bound to a value in memory**. When PHP executes `$greeting = 'hello';` it allocates space for the characters `h-e-l-l-o`, and records that the identifier `greeting` refers to that space.
>
> The `=` sign is not equality in the mathematical sense. It is **assignment**: *take what is on the right, and make the name on the left refer to it.* Reading it as "becomes" rather than "equals" prevents a lot of early confusion — and prevents a specific bug you will meet in the next chapter.
>
> The `$` is called a sigil. It exists so PHP's parser can tell a variable from a function name or a constant without ambiguity, which is also why you will see it disappear in one specific place — object properties, in Chapter 11.

### The spacing trap

If you write `echo $greeting . 'everybody';` you get `helloeverybody` as one run-on word. That is correct behaviour: you concatenated two strings with nothing between them. You have two options:

```php
echo $greeting . ' everybody';   // space baked into the literal
echo $greeting . ' ' . 'everybody';  // space as its own piece
```

The second looks redundant here, but becomes the right choice the moment `everybody` also turns into a variable.

### Why bother with a variable at all?

The honest answer, when everything is hardcoded, is that you should not bother. The reason variables exist is that **most values are not known when you write the code.**

A variable points at something you do not control: text a user typed into a form, a row that came back from a database, a value from an external service, the result of a calculation, a string you are about to transform. You cannot type any of those in advance. You can only name them and then work with the name.

That is the entire justification, and it stops feeling abstract within about a week of writing real code.

---

## Refactoring, and the fact that there is never one way

There is another way to write the same output:

```php
echo "$greeting everybody";
```

The rendered page is identical. The user cannot tell the difference. But the code changed, and that has a name.

> **Foundation — Refactoring**
>
> **Refactoring** is changing code without changing its observable behaviour. The output is the same; the structure is different — clearer, shorter, more flexible, more consistent with the rest of the codebase, or simply more to your taste.
>
> This is not a side activity. A very large portion of professional programming is taking code that already works and continuing to improve it until it is also readable and easy to change. The habit of asking "this works — now how should it look?" is one of the strongest signals separating a beginner from someone experienced.
>
> The counterpart is that for almost any task there are several valid approaches, all producing identical results. That is not a defect of the language. It means you get to make choices, and those choices are where craft lives.

## Single quotes vs. double quotes

This is a real distinction with a real rule, and it is where the previous example got its power.

```php
$greeting = 'hello';

echo "$greeting everybody";   // hello everybody
echo '$greeting everybody';   // $greeting everybody
```

**Double quotes evaluate variables inside the string. Single quotes do not.** Single quotes give you the literal characters, `$` included.

Your editor's syntax highlighting changes between the two — that colour shift is a useful early warning that you have grabbed the wrong quote.

> **Foundation — What "interpolation" means, and what it costs**
>
> Substituting a variable's value into a string is called **string interpolation**. PHP has to scan double-quoted strings looking for `$` characters and escape sequences; single-quoted strings need almost no scanning.
>
> The performance difference is far too small to design around — anyone who tells you to prefer single quotes for speed is optimising the wrong thing by several orders of magnitude. Choose based on what the string needs to do. If it contains a variable, double. If it is pure literal text, single is a slightly stronger statement of intent: *nothing in here is dynamic.*

### Isolating a variable inside a string

A specific problem: you want a variable's value followed immediately by more characters, with no space between.

```php
$book = 'Dark Matter';
echo "$bookTM";   // broken — PHP looks for a variable named $bookTM
```

PHP has no way to know where the variable name stops. Two solutions:

```php
echo $book . 'TM';      // concatenate
echo "{$book}TM";       // braces around the variable
```

The braces "silo" the variable — they mark exactly where the name begins and ends. You will see both forms in real codebases; the braces are common enough that you need to recognise them on sight.

---

## Comments

```php
<?php
// This line is a note to a human. PHP ignores it entirely.

/*
   This form spans
   multiple lines.
*/
```

Anything after `//` on a line is ignored by the interpreter.

> **Foundation — What comments are for, and what they are not for**
>
> A comment that restates the code is noise: `// increment the counter` above `$i++` earns nothing and rots the moment the code changes.
>
> Comments earn their place when they carry information the code cannot: *why* a strange decision was made, what a non-obvious constraint is, where a workaround came from.
>
> The stronger move, wherever possible, is to make the code say it itself — through naming. A well-named variable or function removes the need for the comment entirely. Chapter 14 works through a concrete case of exactly this, replacing an unexplained number with a name.

## A quick map of the types you will meet

The course introduces these gradually. Having the list early helps:

| Type | Example | Notes |
|------|---------|-------|
| string | `'hello'`, `"hi $name"` | Text |
| int | `25`, `-3` | Whole numbers |
| float | `19.99` | Decimal numbers |
| bool | `true`, `false` | Two values only — Chapter 04 |
| array | `['a', 'b']` | A collection — Chapter 05 |
| null | `null` | The absence of a value |
| object | an instance of a class | Chapter 11 |

> **Foundation — Dynamic typing**
>
> PHP is **dynamically typed**: a variable has no declared type, and the same variable can hold a string now and an integer later. The *value* has a type; the *name* does not.
>
> This is convenient and it is also a source of bugs, because a variable holding something unexpected does not announce itself until something downstream misbehaves. You will hit exactly this in Chapter 14, where a database lookup returns `false` instead of an array and the failure surfaces several lines later in a confusing form.
>
> Modern PHP lets you declare types on function parameters and return values, which converts many of those late, confusing failures into immediate, clear ones. That is worth adopting as soon as you are comfortable with the basics.

---

## Where you stand

You can build strings from parts, store values under names, and choose consciously between interpolation and concatenation. You know that assignment is not equality, and that refactoring is a normal activity rather than an indulgence.

**Next:** [04 — Conditionals and booleans](04-conditionals-booleans.md)
