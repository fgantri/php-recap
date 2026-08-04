# 05 — Arrays and Loops

You are comfortable with variables holding a single primitive value — `$name = 'John Doe'`, `$age = 25`. Now: what if the variable needs to hold *a collection*? A list of recommended books, for instance.

## The array

```php
$books = ['Dark Matter', 'The Langoliers', 'Project Hail Mary'];
```

Square brackets create an array. Each item is separated by a comma.

The useful mental image is a **folder**. You have a group of related things; you put them in one container; now you can pick up the container and carry all of them at once. Pass it to a function, return it from a function, hand it to a template — one name, many values.

> **Foundation — What an array actually is**
>
> In many languages an array is a contiguous block of memory holding fixed-size elements, and the index is arithmetic: element *n* lives at *base address + n × element size*. That is what makes indexed access instant.
>
> PHP's array is not that. It is an **ordered hash map** — a single structure that serves as both a list and a dictionary. It keeps insertion order, and its keys can be integers or strings, mixed freely.
>
> This is why PHP has one array type where other languages have two or three, and it is why "indexed array" and "associative array" below are not different types. They are the same structure used two ways.

An older syntax, `array('a', 'b')`, appears in legacy code. It means the same thing. Write `[]`.

---

## Looping with `foreach`

You have a list. You want a `<li>` for each item.

```php
<ul>
    <?php foreach ($books as $book) { ?>
        <li>hello</li>
    <?php } ?>
</ul>
```

Read `foreach ($books as $book)` as: *for each item in `$books`, call it `$book` and run the block.* Three books means three passes, so three `<li>hello</li>`.

The singular name for the loop variable (`$book` for `$books`) is a convention, not a requirement — `$name`, `$item`, anything works. Follow the convention anyway; it reads correctly out loud.

Now use the item:

```php
<?php foreach ($books as $book) { ?>
    <li><?php echo $book; ?></li>
<?php } ?>
```

Or building the whole thing inside `echo`:

```php
<?php
foreach ($books as $book) {
    echo '<li>' . $book . '</li>';
}
?>
```

Both work. The second gets ugly fast, which motivates the next section.

> **Foundation — What a loop is doing**
>
> A loop is repetition with a stopping condition. `foreach` is the specialised form for "walk every element of a collection" — it manages the position and the stopping for you.
>
> The general forms also exist in PHP: `for` when you control a counter explicitly, `while` when you repeat until a condition changes. `foreach` covers the overwhelming majority of real cases and is harder to get wrong, because you cannot run off the end of the collection.
>
> One thing worth knowing: `foreach` iterates over a *copy* of the array by default, so modifying `$books` inside the loop does not affect the iteration. That behaviour prevents a whole family of confusing bugs.

## Alternative syntax for loops

The moment a list item contains real markup — a `div`, a heading, an anchor tag — building it inside an `echo` string becomes unreadable. Use the colon form:

```php
<ul>
    <?php foreach ($books as $book): ?>
        <li><?php echo $book; ?></li>
    <?php endforeach; ?>
</ul>
```

`:` opens, `endforeach;` closes. Identical behaviour, far better readability when HTML is involved. Whenever you are building non-trivial markup, this is the form to use.

## Short echo tags

`<?php echo $book; ?>` appears so often that PHP provides a shorthand:

```php
<li><?= $book ?></li>
```

`<?=` means *open PHP and echo*. The closing semicolon is optional before `?>`. This is the standard way to output a value inside a template, and you should adopt it.

Putting the pieces together:

```php
<ul>
    <?php foreach ($books as $book): ?>
        <li><?= $book ?></li>
    <?php endforeach; ?>
</ul>
```

That is idiomatic PHP templating. It will look familiar the first time you open a Laravel or Symfony view.

---

## Accessing individual items

You do not always want to loop. Sometimes you want one specific element.

```php
$books = ['Dark Matter', 'The Langoliers', 'Project Hail Mary'];

echo $books[2];
```

Counting the list by eye, item number 2 is *The Langoliers*. What you actually get is *Project Hail Mary*.

> **Foundation — Zero-based indexing**
>
> Array indexes start at **0**, not 1. So:
>
> | Index | Value |
> |-------|-------|
> | 0 | Dark Matter |
> | 1 | The Langoliers |
> | 2 | Project Hail Mary |
>
> This is not an arbitrary quirk. It comes from the memory-offset model described above: the first element sits at *base address + 0*. The index is a distance from the start, not a count from one. Nearly every language inherited this from C, and the small number that did not (Lua, MATLAB, R) are the ones that feel strange.
>
> The practical consequence: the last index of an array with *n* elements is *n − 1*, and off-by-one errors are the most common family of bug in all of programming. When something is one position off, this is why.

## Appending to an array

```php
$filtered = [];
$filtered[] = $book;
```

Empty brackets on the left of an assignment mean *append this as a new element*. PHP assigns the next available integer key. You will use this pattern constantly in Chapter 06.

---

## Associative arrays

An indexed list of book titles is fine until each book needs more than a title. Consider:

```php
$book = ['Dark Matter', 'Blake Crouch', 'https://example.com/dark-matter'];
```

Come back to this in six months and the third element is a mystery. Is that a purchase link? A download link after purchase? The author's website? Nothing in the code says.

The fix is to associate a **key** with each value:

```php
$books = [
    [
        'name' => 'Dark Matter',
        'author' => 'Blake Crouch',
        'releaseYear' => 2016,
        'purchaseUrl' => 'https://example.com/dark-matter',
    ],
    [
        'name' => 'Project Hail Mary',
        'author' => 'Andy Weir',
        'releaseYear' => 2021,
        'purchaseUrl' => 'https://example.com/hail-mary',
    ],
    [
        'name' => 'The Martian',
        'author' => 'Andy Weir',
        'releaseYear' => 2011,
        'purchaseUrl' => 'https://example.com/the-martian',
    ],
];
```

The `=>` arrow creates the association. This is an **associative array** — a fancy term for a plain idea: a key paired with a value.

> **Foundation — Key–value pairs everywhere**
>
> The key–value structure is one of the two or three most important shapes in computing. Other languages call it a dictionary (Python), a hash (Ruby), a map (Java, Go), or an object (JavaScript). HTTP headers are key–value. Environment variables are key–value. A database row is key–value. Configuration files are key–value.
>
> Under the hood, a hash function turns the key into a number that identifies a storage slot, which is why looking up a value by key is fast regardless of how large the collection gets. You do not need the implementation details to use it, but knowing that lookup is cheap explains why key–value structures are used so liberally.

### Naming keys

Whether you write `releaseYear`, `release_year`, or `releaseyear` is a convention question. Conventions can be followed or ignored — the only rule that genuinely matters is that you are consistent within a project, because inconsistency is what breaks people's ability to guess correctly.

---

## Looping over nested arrays

`$books` is now an array *of arrays*. The naive loop breaks:

```php
<?php foreach ($books as $book): ?>
    <li><?= $book ?></li>   <!-- error: array to string conversion -->
<?php endforeach; ?>
```

Each `$book` is now an array, not a string, and `echo` cannot render an array. Your editor flags it; the browser shows a warning.

Reach into the array by key:

```php
<ul>
    <?php foreach ($books as $book): ?>
        <li>
            <a href="<?= $book['purchaseUrl'] ?>">
                <?= $book['name'] ?> (<?= $book['releaseYear'] ?>)
            </a>
            — <?= $book['author'] ?>
        </li>
    <?php endforeach; ?>
</ul>
```

The bracket syntax is the same one you used with numeric indexes. With an indexed array you pass a number; with an associative array you pass the key. Same operation, different kind of identifier.

> **Foundation — Nesting, and how to think about depth**
>
> `$books[0]['author']` reads left to right: take `$books`, get element `0` (an array), get its `'author'` key (a string). Each bracket steps one level deeper.
>
> Arrays inside arrays inside arrays is how nearly all structured data is represented before it becomes objects — JSON decodes into exactly this shape, and so does the result of a database query in Chapter 11. Getting comfortable reading a chain of brackets pays off immediately.
>
> When a chain gets long, that is usually a signal the data wants to be an object instead. Chapter 11 shows what that looks like.

---

## Where you stand

You can build a collection, walk it, reach into it by position or by key, and nest one inside another. You know why indexing starts at zero and why an associative array is not a different type from an indexed one.

Everything the rest of the course does with data — query results, route tables, configuration, request parameters — is one of these two shapes.

**Next:** [06 — Functions](06-functions.md)
