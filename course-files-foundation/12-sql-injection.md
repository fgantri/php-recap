# 12 — SQL Injection and Prepared Statements

There is a principle worth adopting before the technical content: in the legal system a person is presumed innocent until proven guilty. On the web, invert it. **Assume every piece of user input is hostile until you have handled it as such.**

This chapter is the most important one in the course. Everything else can be got wrong and fixed later. This one gets your database destroyed.

---

## Building up the attack

Start in your database client with ordinary queries.

```sql
SELECT * FROM posts WHERE id = 2;
```

`WHERE` also accepts `OR`:

```sql
SELECT * FROM posts WHERE id = 1 OR id = 2;
```

Harmless. Now imagine a `users` table with `id`, `username`, and an `admin` column stored as a small integer where `0` is false and `1` is true. Say it holds two administrators and one guest.

```sql
SELECT * FROM users WHERE id = 2;
```

One row — John. But:

```sql
SELECT * FROM users WHERE id = 2 OR admin = 1;
```

John, **plus every administrator in the system.** The `OR` widened the query far beyond what was asked for.

And SQL can do more than read:

```sql
DROP TABLE users;
```

Run that and the table is gone — structure, data, everything. (Before testing this, copy the `CREATE TABLE` statement from your client's structure or info panel so you can recreate it. Every GUI client offers this.)

Three facts, so far merely interesting. Now watch them combine.

---

## The vulnerability

A realistic page: the user clicks a post, and its ID travels in the query string.

```
http://localhost:8888/post?id=1
```

Chapter 08 gave you the way to read it:

```php
dd($_GET);
```

An array of every query string parameter. Grab the one you need:

```php
$id = $_GET['id'];

$posts = $db->query("SELECT * FROM posts WHERE id = $id")->fetch();
```

Test it. `?id=1` returns the first post; `?id=2` returns the second. It works, and the instinct is to move on.

Do not. You have just introduced a critical vulnerability.

## Seeing it

Extract the query into a variable so you can inspect it before it runs:

```php
$id = $_GET['id'];

$query = "SELECT * FROM posts WHERE id = $id";

dd($query);
```

With `?id=1` you see:

```sql
SELECT * FROM posts WHERE id = 1
```

Now send something else:

```
?id=1 OR 1=1
```

```sql
SELECT * FROM posts WHERE id = 1 OR 1=1
```

`1=1` is true for every row, so the query now returns the entire table. The visitor changed what your query means.

Escalate:

```
?id=1; DROP TABLE users
```

```sql
SELECT * FROM posts WHERE id = 1; DROP TABLE users
```

Two statements. The first fetches a post. The second destroys a table you never intended to touch.

Remove the `dd` and let it run. Depending on driver configuration, the `users` table is gone.

> **Foundation — Why this works at all**
>
> Your SQL is a **string**. So is the user's input. When you interpolate one into the other, the database receives a single piece of text and has no way to tell which characters you wrote and which a stranger supplied.
>
> The database is doing its job perfectly. It parses the text it was given and executes the statements it finds. The trust boundary was crossed inside your PHP, before MySQL ever saw it.
>
> This is the same category of failure as command injection, XSS and template injection: **data crossing into a position where it is interpreted as code.** Once you see the shape, you recognise it everywhere.
>
> It is not theoretical. SQL injection has been in the OWASP Top Ten for the entire life of that list, and it is still causing breaches, because the vulnerable version is the version that feels natural to write.
>
> Whether a *stacked* query (two statements separated by `;`) actually runs depends on the driver and its settings — PDO with MySQL and emulated prepares will run them; some configurations will not. Do not take comfort from that. A single-statement injection is enough to dump every user record, bypass a login, or read data belonging to other accounts. `1=1` needs no semicolon.

---

## The rule

> **When you accept user input — through a query string, a form, a header, a cookie, an uploaded file, an API payload, anything at all — never, ever interpolate it into a SQL query.**

This guide is generally unenthusiastic about programming rules handed down as commandments. This one is a commandment. There is no legitimate exception.

---

## Prepared statements

The fix is to send the query and the values **separately**.

```php
$query = 'SELECT * FROM posts WHERE id = ?';
```

The `?` is a **placeholder** — a wildcard marking where a value will go. Bind the actual value when you execute:

```php
$statement = $pdo->prepare($query);
$statement->execute([$id]);
```

> **Foundation — Why separation defeats injection**
>
> The useful mental image: the query and its parameters travel in **two different boats.**
>
> `prepare()` sends the SQL template to MySQL, which parses it and builds an execution plan. At that moment the structure of the query is fixed and final. The database knows there is a comparison against the `id` column and one value slot to fill.
>
> `execute()` then sends the values, separately, and they are placed into those slots **as data**. They are never parsed as SQL, because parsing already happened.
>
> So if a user submits `1; DROP TABLE users`, the database looks for a post whose `id` equals the literal string `1; DROP TABLE users`. It finds nothing. It returns an empty result. Nothing is dropped, because there was never a second statement — only a value that happened to contain a semicolon.
>
> This is categorically stronger than escaping. Escaping tries to neutralise dangerous characters and depends on getting every case right across every character set. Separation removes the possibility that user data can *ever* be interpreted as structure.
>
> One caveat: placeholders work for **values**, not for identifiers. You cannot parameterise a table or column name. When those must be dynamic, validate them against an explicit allowlist of permitted names — never against a pattern, and never by escaping.

## Wiring it through the `Database` class

The class from Chapter 11 needs to accept parameters and pass them along:

```php
class Database
{
    public $connection;

    public function __construct($config, $username = 'root', $password = '')
    {
        $dsn = 'mysql:' . http_build_query($config, '', ';');

        $this->connection = new PDO($dsn, $username, $password, [
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    public function query($query, $params = [])
    {
        $statement = $this->connection->prepare($query);

        $statement->execute($params);

        return $statement;
    }
}
```

`$params` defaults to an empty array (Chapter 06), so queries with no parameters call it unchanged.

Usage:

```php
$post = $db->query('SELECT * FROM posts WHERE id = ?', [$_GET['id']])->fetch();
```

## The two placeholder styles

**Positional** — question marks, bound by position:

```php
$db->query(
    'SELECT * FROM notes WHERE user_id = ? AND id = ?',
    [$userId, $noteId]
);
```

Order matters absolutely. Two parameters in the wrong order produce a query that runs and returns the wrong thing, which is worse than one that fails.

**Named** — a colon and an identifier, bound by name:

```php
$db->query(
    'SELECT * FROM notes WHERE user_id = :user_id AND id = :id',
    ['user_id' => $userId, 'id' => $noteId]
);
```

Order is irrelevant, the query reads better, and each value is visibly attached to its slot.

Positional is more compact for one or two parameters. Named is clearly better past that, and better still when the same value appears twice. Use whichever fits, but be consistent within a codebase.

## Verifying the fix

Recreate the `users` table if you dropped it. Then retry the attack:

```
?id=2; DROP TABLE users
```

The page returns nothing — no post has that ID. The `users` table is intact.

Revert to interpolation for one moment and run it again, and the table disappears. Restore the parameterised version. That contrast is the entire chapter in two page loads, and it is worth performing rather than reading.

---

## The wider principle

SQL injection is one instance of a general failure, and the general form is the thing to carry:

> **Data must never be able to become code.**

The same failure with different names:

| Attack | Data crosses into | Defence |
|---|---|---|
| SQL injection | a database query | prepared statements |
| Cross-site scripting (XSS) | HTML output | escape on output — `htmlspecialchars()` |
| Command injection | a shell command | `escapeshellarg()`, or avoid the shell |
| Path traversal | a filesystem path | validate against an allowlist |
| Header injection | HTTP headers | strip newlines |

XSS deserves a specific note, because it is the one you will hit next and this course has not covered it. Every time you echo a value that originated from a user, escape it:

```php
<?= htmlspecialchars($note['body']) ?>
```

Without that, a note containing `<script>` is executed by every visitor's browser. Template engines like Blade and Twig escape by default for exactly this reason — one of the strongest arguments for using one.

The unifying discipline: **know, for every value, where it came from.** Values you wrote are trusted. Values from a user, a database, a third-party API or a file are not — and the last three are hostile too, because a user's input reached them earlier.

**Next:** [13 — Relationships and data integrity](13-relationships-integrity.md)
