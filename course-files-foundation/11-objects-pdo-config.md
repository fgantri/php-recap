# 11 — Objects, PDO, Config and Environments

To talk to MySQL from PHP you use a class called PDO. That means classes have to be explained first — and the explanation, once you have it, unlocks most of modern PHP.

## Classes and objects

> **Foundation — Classes, instances, objects**
>
> A **class** is a blueprint. It describes what something has and what it can do, without being any particular one of them.
>
> A house blueprint specifies rooms and dimensions. It is not a house. You build many houses from it — one brown, one white, one with a different kitchen — and each is an **instance** of that blueprint. An instance of a class is called an **object**.
>
> A class defines two kinds of member:
>
> - **Properties** — the data an instance holds. The nouns. A person *has* a name.
> - **Methods** — the behaviour an instance offers. The verbs. A person *can* breathe.
>
> A method is a function that belongs to a class. Functionally it is still just a function; the different word signals that it has access to the instance it belongs to.
>
> A useful starting heuristic when designing: **look for the nouns.** They tend to become classes. The verbs that act on them tend to become methods.

```php
class Person
{
    public $name;
    public $age;

    public function breathe()
    {
        echo "{$this->name} is breathing";
    }
}
```

### Visibility

```php
public $name;
```

> **Foundation — `public`, `protected`, `private`**
>
> Visibility controls who may touch a property or method:
>
> - **`public`** — anyone, from anywhere.
> - **`protected`** — this class and any class that inherits from it.
> - **`private`** — this class only.
>
> The default for a method with no visibility keyword is `public`, so writing it is technically redundant. Write it anyway. Being explicit is standard practice and it makes the omission of `public` meaningful when you later start using `private`.
>
> The purpose of visibility is **encapsulation**: a class exposes a deliberate, small surface and keeps its internals to itself. That lets you change the internals freely, because nothing outside could have depended on them. A class where every property is public has no internals — every field is part of its permanent contract.
>
> While learning, `public` everywhere is fine. Recognise it as a temporary simplification.

### Creating and using an instance

```php
$person = new Person();

$person->name = 'John Doe';
$person->age = 25;
```

`new` builds an instance from the blueprint.

The arrow `->` is a hyphen followed by a greater-than sign. Some editor fonts render it as a single arrow glyph; that is a ligature, not different characters.

Notice: `$person->name`, **not** `$person->$name`. Once you are past the object's variable name, the property name has no `$`. This trips up everyone once.

```php
dd($person);
```

The dump shows an object of class `Person` with `name` set to `John Doe` and `age` to `25`.

Reading values back and calling a method:

```php
echo $person->name;   // John Doe
echo $person->age;    // 25

$person->breathe();
```

Compare with arrays: `$book['name']` versus `$person->name`. Same idea — reach into a container for a named piece — different syntax for a different kind of container.

### `$this`

Inside `breathe()`:

```php
echo "{$this->name} is breathing";
```

> **Foundation — What `$this` refers to**
>
> `$this` is the instance the method was called on. Read it as *this instance*.
>
> The method body is written once, in the class. But it runs against whichever object you called it on:
>
> ```php
> $john = new Person();
> $john->name = 'John';
>
> $jane = new Person();
> $jane->name = 'Jane';
>
> $john->breathe();   // John is breathing
> $jane->breathe();   // Jane is breathing
> ```
>
> One definition, many instances, each carrying its own data. That is the central idea of object orientation, and `$this` is the mechanism.

### The constructor

```php
class Person
{
    public $name;

    public function __construct($name)
    {
        $this->name = $name;
    }
}

$person = new Person('John Doe');
```

`__construct` runs automatically the moment an instance is created — two underscores, then the word.

> **Foundation — Magic methods**
>
> PHP methods beginning with `__` are **magic methods**: PHP calls them for you at defined moments. `__construct` on creation, `__destruct` on destruction, `__toString` when the object is used as a string, `__get` and `__set` for undefined properties.
>
> The practical value of `__construct` is that it makes invalid objects impossible. If a `Database` needs a connection to be usable, building the connection in the constructor guarantees that no `Database` object exists in a half-initialised state. That property — *an object is valid from the moment it exists* — is worth a great deal.

### Class constants and `::`

```php
class Response
{
    const NOT_FOUND = 404;
    const FORBIDDEN = 403;
}

echo Response::NOT_FOUND;
```

> **Foundation — Constants and the scope resolution operator**
>
> A **constant** is a named value that never changes, for any instance, ever. That is what distinguishes it from a property: a property belongs to an instance and varies; a constant belongs to the class.
>
> By convention constants are written in `UPPER_SNAKE_CASE`, which makes them instantly distinguishable from properties at a glance.
>
> The `::` is formally the **scope resolution operator**. Poll working PHP developers and a good share could not name it, which is fine — what matters is what it does: it reaches into a class for something that belongs to the class itself rather than to an instance. Constants and static members.
>
> Why constants earn their place: PDO exposes a set of numeric settings — 1, 2, 3, 4 and so on. The numbers are meaningless to a human. Nobody remembers the difference between 2 and 4. Attaching a name to each (`PDO::PARAM_INT`, `PDO::FETCH_ASSOC`) turns unreadable numbers into self-explaining code. That is the whole trick, and you will apply it yourself in Chapter 14.

---

## Connecting to MySQL with PDO

> **Foundation — What PDO is**
>
> **PDO** — PHP Data Objects — is a database access layer built into PHP. It provides one API across MySQL, PostgreSQL, SQLite, SQL Server and others, so switching engines does not mean rewriting every call.
>
> Two older MySQL extensions exist. `mysql_*` was removed in PHP 7 and must never be used. `mysqli` still works and is MySQL-only. PDO is the right default.
>
> What PDO does *not* do: it does not write SQL for you. You still write the queries. Query builders and ORMs sit on top of PDO to do that.
>
> Be warned: this connection code is genuinely fiddly, and in working life you rarely write it, because a library or framework has already done it. Learning it anyway matters — when the abstraction misbehaves, you need to know what it is abstracting.

### The DSN

```php
$dsn = 'mysql:host=localhost;port=3306;dbname=myapp;charset=utf8mb4';

$pdo = new PDO($dsn, 'root', '');
```

> **Foundation — What a DSN is**
>
> **DSN** stands for Data Source Name. It is a connection string: one piece of text describing everything needed to reach the database.
>
> Reading it apart:
>
> - `mysql:` — the driver. This is what makes PDO speak MySQL.
> - `host=localhost` — the machine (Chapter 02).
> - `port=3306` — MySQL's default port (Chapter 10).
> - `dbname=myapp` — which database inside the server.
> - `charset=utf8mb4` — the character encoding.
>
> Key–value pairs joined by semicolons, exactly the structure you have seen elsewhere.
>
> On `utf8mb4`: MySQL's `utf8` is a historical mistake. It stores only three bytes per character, which covers most text but not emoji or some CJK characters. `utf8mb4` is real UTF-8. Always specify it.
>
> Username and password can go into the DSN (`user=root;password=`) or be passed as the second and third arguments. Both work. If you forget both, PDO fails with *Access denied for user*, which is a helpfully literal message.

Everything in that string comes from the connection settings you used in your GUI client in Chapter 10. If you have forgotten them, open the connection's edit dialog and read them off.

### Prepare, execute, fetch

```php
$statement = $pdo->prepare('SELECT * FROM posts');

$statement->execute();

$posts = $statement->fetchAll();
```

Three steps, and the separation is deliberate:

**`prepare`** hands the SQL to MySQL to be parsed and planned. It returns a statement object.

**`execute`** tells MySQL to actually run it.

**`fetchAll`** retrieves the results, as an array of rows. `fetch` retrieves a single row instead.

Chapter 12 explains why this three-step split is not bureaucracy but the most important security mechanism you will use.

### Fetch modes

Dump the result and you see each row duplicated — every value appears once under its column name and once under a numeric index. PDO defaults to giving you both.

Fix it:

```php
$posts = $statement->fetchAll(PDO::FETCH_ASSOC);
```

`PDO::FETCH_ASSOC` is a class constant, accessed with `::`, meaning *return rows as associative arrays keyed by column name*.

Passing it to every call is tedious, so set it once as a connection option:

```php
$options = [
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

$pdo = new PDO($dsn, 'root', '', $options);
```

Now every result from this connection comes back associative.

### Displaying results

```php
<ul>
    <?php foreach ($posts as $post): ?>
        <li><?= $post['title'] ?></li>
    <?php endforeach; ?>
</ul>
```

Nothing new — the query result is an array of associative arrays, exactly the shape from Chapter 05.

> **Foundation — Error handling, deferred**
>
> Real connection code wraps this in `try`/`catch`, so that a failure to connect produces a controlled error rather than a stack trace exposing your credentials:
>
> ```php
> try {
>     $pdo = new PDO($dsn, $username, $password, $options);
> } catch (PDOException $e) {
>     // log it, show a friendly page
> }
> ```
>
> Exceptions are a substantial topic of their own — throwing, catching, custom exception classes, and where in an application to handle them. Learn them properly rather than by imitation. For now, know that this is the missing piece, and that PDO throws `PDOException` on failure.

---

## Refactoring into a `Database` class

State the intent in a comment first, then make the code say it:

```php
// connect to the database and execute a query
```

Follow the nouns: *database* becomes the class. Follow the verbs: *execute* and *query* are both candidate method names.

Choosing between them is a design decision, and design decisions of this size are worth making consciously. Working with an object called `Database`, do you want to write `$db->execute(...)` or `$db->query(...)`? `query` reads better here.

```php
class Database
{
    public function query($query)
    {
        $dsn = 'mysql:host=localhost;port=3306;dbname=myapp;charset=utf8mb4';
        $pdo = new PDO($dsn, 'root', '');

        $statement = $pdo->prepare($query);
        $statement->execute();

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }
}

$db = new Database();
$posts = $db->query('SELECT * FROM posts');
```

Better than before, and it has a serious flaw: **every call opens a new connection.** A page might run dozens of queries. Opening a database connection is expensive. Doing it dozens of times per request is wasteful in a way that shows up under load.

### Move the connection into the constructor

```php
class Database
{
    public $connection;

    public function __construct()
    {
        $dsn = 'mysql:host=localhost;port=3306;dbname=myapp;charset=utf8mb4';

        $this->connection = new PDO($dsn, 'root', '');
    }

    public function query($query)
    {
        $statement = $this->connection->prepare($query);
        $statement->execute();

        return $statement;
    }
}
```

The connection is created once, when the object is created, and stored on the instance as a **property**. Every subsequent `query()` call reuses it via `$this->connection`.

The naming choice is worth a note: `$pdo` would work, but `$connection` describes the role rather than the implementing class. That distinction — name things for what they are for, not for what they happen to be — is a consistently good habit.

### Return the statement, not the results

`query()` currently hardcodes `fetchAll`. But sometimes you want a single row:

```php
$post = $db->query('SELECT * FROM posts WHERE id = 1');
```

With `fetchAll` you get an array containing one array, so you have to write `$post[0]['title']`. Awkward and misleading.

Return the statement and let the caller decide:

```php
public function query($query)
{
    $statement = $this->connection->prepare($query);
    $statement->execute();

    return $statement;
}
```

```php
$post  = $db->query('SELECT * FROM posts WHERE id = 1')->fetch();
$posts = $db->query('SELECT * FROM posts')->fetchAll();
```

`fetch` returns one row. `fetchAll` returns all of them. **This distinction causes real bugs** — a query written for one row but fetched with `fetchAll` returns an array of arrays and fails confusingly a few lines later, which is exactly what happens in Chapter 14.

### Extract to its own file

```php
require 'Database.php';
```

> **Foundation — Naming conventions for class files**
>
> A file containing a single class is conventionally named after that class, with matching capitalisation: `Database.php`, `Response.php`, `NoteController.php`.
>
> This is not cosmetic. It is the basis of **autoloading**: once you adopt Composer and PSR-4, PHP finds and loads class files automatically based on class name and directory, and you stop writing `require` for classes entirely. That convention is the reason the naming rule exists.
>
> You will not meet Composer in this course, but adopting the naming now means you are already compatible when you do.

---

## Configuration and environments

The `Database` class still hardcodes host, port, database name, username and password. That is fine on your laptop and impossible in production, where every one of those values differs.

The technique for fixing it has a name worth learning: **push configuration upward.** Values that vary should not live deep inside a class. They should be supplied from outside it, at a level that knows about the environment.

### Step 1 — Accept config as a constructor parameter

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
}
```

Two things happened.

**`http_build_query`.** A built-in whose usual job is turning an array into a URL query string (`foo=bar&baz=qux`). Given `;` as the separator, it produces exactly the DSN format. Prepend `mysql:` and you have the connection string, built from an array instead of concatenated by hand.

**Default parameter values.** `$username = 'root'` and `$password = ''` mean local development needs no arguments, while production can override both.

### Step 2 — A config file

Push the values up one more level, into a file whose contents differ per environment:

**`config.php`**

```php
<?php

return [
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'dbname' => 'myapp',
        'charset' => 'utf8mb4',
    ],
];
```

```php
$config = require 'config.php';

$db = new Database($config['database']);
```

> **Foundation — `return` from a required file**
>
> `return` is not exclusive to functions. A required file can return a value, and `require` evaluates to it.
>
> This is a genuinely useful pattern and it is exactly how Laravel's `config/` directory works — every file there returns an array. Once you have seen it here, that layout is immediately legible.

The `'database'` key exists so the file can hold more than database settings. Applications accumulate configuration: API tokens, mail settings, third-party service credentials, feature flags. All of those differ between local and production, and all of them belong here rather than scattered through the code.

> **Foundation — Environments, and where secrets actually go**
>
> An **environment** is a context your application runs in. Typically: **local** (your machine), **staging** (a production-like rehearsal), **production** (real users). Same code, different configuration.
>
> Committing a config file with production credentials to version control is a serious mistake and one of the most common causes of credential leaks. The standard solution:
>
> 1. Secrets live in a `.env` file — plain `KEY=value` lines.
> 2. `.env` is listed in `.gitignore` and never committed.
> 3. A `.env.example` with the keys and dummy values *is* committed, so other developers know what to supply.
> 4. Config files read from the environment: `getenv('DB_PASSWORD')` or `$_ENV['DB_PASSWORD']`.
>
> This is the [Twelve-Factor App](https://12factor.net) principle of strict separation between config and code, and it is close to universal in modern deployment. The library that reads `.env` files into PHP's environment is `vlucas/phpdotenv`, which is what Laravel and Symfony both use.
>
> The chain to notice: hardcoded value → constructor parameter → config file → environment variable. Each step pushes the value further from the code and closer to the deployment. That progression is the whole idea.

---

## Where you stand

You can define classes with properties and methods, create instances, use `$this` and constructors, and read class constants. You can connect to MySQL, run queries, and fetch results. And your database credentials live outside the code that uses them.

What is still missing is safety. Every query you have written so far is fully under your control. The moment a user's input reaches one, everything changes.

**Next:** [12 — SQL injection and prepared statements](12-sql-injection.md)
