# 10 — Databases and SQL

All your data so far has been hardcoded in PHP arrays. That works for learning and fails immediately in reality, because real data is created by users, changes constantly, and must survive the end of the request.

> **Foundation — Why a database rather than files**
>
> PHP has functions for reading and writing files. You could store books in a text file. People did, for years. What a database gives you that a file does not:
>
> - **Concurrency.** Many requests reading and writing simultaneously without corrupting each other.
> - **Transactions.** A group of changes that either all apply or none do. Essential the moment money or relationships are involved.
> - **Indexes.** Finding one row among ten million without reading the other ten million.
> - **A query language.** Ask for what you want, rather than writing loops to find it.
> - **Constraints.** Rules the data itself enforces, so bad data cannot get in even through a buggy application.
> - **Durability.** Committed data survives a crash mid-write.
>
> A **relational** database, which is what MySQL is, stores data in tables of rows and columns, with defined relationships between tables. The model comes from Edgar Codd's 1970 paper and has outlasted every predicted replacement.
>
> The alternatives are real and have their uses — document stores like MongoDB, key–value stores like Redis, graph databases. For the kind of structured, interrelated data that web applications overwhelmingly hold, relational remains the default for good reasons.

---

## Creating a database

From the terminal:

```bash
mysql -u root
```

`-u` supplies the username. `root` is the default administrative user, and on a fresh local install it typically has no password. Once connected:

```sql
CREATE DATABASE myapp;
```

Every SQL statement ends with a semicolon. *Query OK, 1 row affected* means it worked.

> **Foundation — Server, database, table**
>
> Three levels, often confused:
>
> - **The MySQL server** — a running process listening on a port, exactly like the web server in Chapter 02. Its default port is **3306**.
> - **A database** (sometimes "schema") — a named container inside that server. One server holds many. Typically one per application.
> - **A table** — a named structure inside a database, with defined columns.
>
> `mysql -u root` connects to the server. `CREATE DATABASE myapp` creates a container inside it. Tables go inside that.
>
> Remember `localhost` and `3306`. You will type both into a connection string in Chapter 11.

## Using a GUI

The terminal client works, and for day-to-day exploration a graphical client is faster. TablePlus, Sequel Ace, DBeaver, phpMyAdmin — any of them.

Create a connection:

- **Name** — anything. `demo`.
- **Host** — `localhost` (equivalently `127.0.0.1`)
- **Port** — `3306`
- **User** — `root`
- **Password** — empty, for a local install

Test the connection, then connect. Most clients let you pin a default database so you land inside `myapp` directly.

---

## Tables

A **table** is closest to a spreadsheet: named columns across the top, one record per row. The comparison to a web form is also useful — the fields you would put on a "create a blog post" form are roughly the columns the `posts` table needs.

Create a `posts` table. For each column you decide four things:

**Name.** `title`.

**Data type.** You will see dozens listed and use about six:

| Type | Use |
|---|---|
| `INT` | Whole numbers. IDs, counts. |
| `VARCHAR(255)` | Variable-length text up to a stated limit. Titles, names, emails. |
| `TEXT` | Long text with no practical limit. Article bodies. |
| `BOOLEAN` / `TINYINT(1)` | True/false, stored as 0 or 1. |
| `DATETIME` / `TIMESTAMP` | Points in time. |
| `DECIMAL(10,2)` | Exact decimals. **Use this for money**, never `FLOAT`. |

> **Foundation — Why types matter, and why not `FLOAT` for money**
>
> A type is a promise about what a column contains. The database enforces it, which means bad data is rejected at the storage layer rather than discovered later in a report.
>
> Types also determine storage size and index behaviour. `INT` is four bytes; `VARCHAR(255)` is variable. Choosing sensibly matters at scale.
>
> The money rule is not stylistic. `FLOAT` and `DOUBLE` are binary floating point, and most decimal fractions have no exact binary representation — the same reason `0.1 + 0.2` is not `0.3` in nearly every programming language. Accumulate rounding errors across thousands of transactions and your ledger stops balancing. `DECIMAL` stores digits exactly. Alternatively, store money as an integer number of cents.

**Nullable?** Can this column have no value at all?

> **Foundation — `NULL` is not empty**
>
> `NULL` means *no value exists here* — unknown, absent, not applicable. It is distinct from an empty string, and distinct from zero.
>
> `NULL` propagates strangely on purpose: `NULL = NULL` is not true, it is `NULL`, because two unknowns cannot be shown to be equal. Comparisons use `IS NULL` and `IS NOT NULL` instead of `=`.
>
> The design question for each column is a modelling question. Does a blog post without a title make sense? No — so `title` is `NOT NULL`. Does a post without a publication date make sense? Yes, if drafts exist — so that column is nullable, and the nullability itself encodes "this may be unpublished".
>
> Choosing this deliberately, column by column, is one of the cheapest ways to make a schema self-documenting.

**Default value.** What goes in when nothing is supplied. Often nothing; sometimes `0`, or the current timestamp.

For `title`: `VARCHAR(255)`, not nullable, no default. Save. In most GUI clients pending changes are highlighted until you commit them with `Cmd/Ctrl + S`.

## Primary keys

Every table gets an `id` column, and it is not optional in practice.

> **Foundation — What a primary key is**
>
> A **primary key** uniquely identifies a row. No two rows may share one, and it cannot be `NULL`.
>
> The usual implementation is an `INT` marked `AUTO_INCREMENT`: the database assigns 1, then 2, then 3, and never reuses a number even after deletions. You never supply it.
>
> Why it is essential: without a unique identifier you cannot reliably reference one specific row. Two blog posts could share a title. Two users could share a name. The primary key is the row's permanent identity, and it is what relationships between tables are built on — Chapter 13.
>
> The database also creates an index on it automatically, making lookups by ID fast.
>
> An alternative worth knowing about: **UUIDs**, random 128-bit identifiers. They can be generated by the application before insertion and do not leak how many records you have, at the cost of size and index locality. Sequential integers are the sensible default while learning.

## Inserting data

In the GUI, open the table's data view and add rows. Leave `id` alone — it fills itself. Enter a title, commit, and watch `id` become 1. Add another; it becomes 2.

In SQL, the same operation:

```sql
INSERT INTO posts (title) VALUES ('My first blog post');
```

A realistic `posts` table would also have a `body`, a `status` (draft / published / archived), timestamps, and a reference to the user who wrote it. That last one is what makes the database *relational*, and Chapter 13 builds it.

---

## Querying with SQL

> **Foundation — What SQL is**
>
> **SQL** — Structured Query Language, pronounced either "sequel" or as letters — is a **declarative** language. You describe the result you want; the database's query planner decides how to produce it.
>
> That is a genuinely different model from PHP, which is **imperative**: you specify each step. In SQL you never write a loop over rows. You state a condition and the engine figures out whether to scan the table, use an index, or something cleverer.
>
> SQL is also one of the highest-leverage things you can learn. It has barely changed in decades, it works across MySQL, PostgreSQL, SQLite and SQL Server with minor dialect differences, and every ORM you will ever use is generating it underneath. When a framework's query builder produces something slow, the only way to fix it is to read the SQL.

### SELECT

```sql
SELECT * FROM posts;
```

`SELECT` states what you want. `*` means every column. `FROM posts` names the table.

Ask for specific columns instead:

```sql
SELECT id FROM posts;
SELECT title FROM posts;
SELECT id, title FROM posts;
```

The last one is functionally equivalent to `SELECT *` here, because those are the only columns. In real tables it is not, and naming columns explicitly is the better habit — it survives schema changes and moves less data.

### WHERE

```sql
SELECT * FROM posts WHERE id = 1;
```

`WHERE` filters rows. Note that SQL uses a single `=` for comparison — SQL has no assignment operator in this position, so there is no ambiguity to resolve. This is one of the few places where the `=` versus `===` instinct from PHP does not transfer.

Other filters you will use immediately:

```sql
SELECT * FROM posts WHERE id > 1;
SELECT * FROM posts WHERE title = 'My first blog post';
SELECT * FROM posts WHERE id = 1 OR id = 2;
SELECT * FROM posts WHERE id IN (1, 2, 3);
SELECT * FROM posts WHERE title LIKE '%blog%';
SELECT * FROM posts WHERE published_at IS NOT NULL;
SELECT * FROM posts ORDER BY id DESC LIMIT 10;
```

Keep the `OR` example in mind. Chapter 12 turns it into an attack.

---

## The relational part

The point of a relational database is not one table. It is several, connected.

Imagine adding a `users` table. Then a post can record *which* user wrote it, by storing that user's primary key. Draw a line from a row in `users` to a row in `posts` and you have said: this person wrote that post.

That reference is a **foreign key**, and Chapter 13 builds one properly, along with the constraints that keep it honest.

---

## Practice before moving on

Genuinely do this before Chapter 11, because the next chapter assumes fluency with the client:

- Add a `body` column of type `TEXT` to `posts`.
- Add a `status` column as `VARCHAR(255)` with a default of `'draft'`.
- Insert several rows.
- Update an existing row.
- Write `SELECT` queries with `WHERE`, `ORDER BY` and `LIMIT`.
- Create a second table and delete it again.

**Next:** [11 — Objects, PDO, config and environments](11-objects-pdo-config.md)
