# 13 — Relationships and Data Integrity

Time to build something real: a simple note-taking application. At this stage of learning, start at the database — the schema decisions shape everything above them.

## The `notes` table

The noun is *note*, so the table is `notes` (plural by convention).

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | INT, auto-increment | no | primary key |
| `body` | TEXT | no | the note's content |

`TEXT` rather than `VARCHAR` because a note has no sensible length limit. Not nullable, because a note with no body is not a note.

## The `users` table

A note should belong to somebody.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | INT, auto-increment | no | primary key |
| `name` | VARCHAR(255) | no | |
| `email` | VARCHAR(255) | no | |

Now a question the schema should answer rather than the application: should two users be able to share an email address?

No. An email address identifies a person, and duplicates would make login ambiguous and password resets dangerous.

## Unique indexes

Add a **unique index** on `email`. In a GUI client this is an *Indexes* section: let the name auto-populate, tick unique, choose the `email` column, save.

Test it. Create a user with an email, commit. Create a second user with the same email, commit — the database rejects it: *Duplicate entry*. Undo the change.

> **Foundation — What an index actually is**
>
> An index is a separate data structure the database maintains alongside a table, holding the values of one or more columns in sorted order together with pointers to the rows they came from.
>
> The comparison to a book's index is exact. Without one, finding every mention of a word means reading every page — a **full table scan**. With one, you jump straight to the right entries.
>
> The mechanism is usually a **B-tree**, which keeps lookups fast (logarithmic in the number of rows) as the table grows.
>
> Indexes are not free. Every `INSERT`, `UPDATE` and `DELETE` must also update every index on the table, and each index consumes disk. So they are a trade: faster reads, slower writes, more space. Index the columns you filter, join and sort on. Do not index everything.
>
> A **unique index** does double duty: it speeds up lookups *and* enforces that no two rows share the value. That second property is what makes it the correct tool here — the rule is enforced by the database, so no application bug and no direct SQL can violate it.
>
> This is worth stating generally: **constraints in the database are stronger than checks in the application.** Application code can be bypassed by another application, a migration script, or a developer at a console. The database cannot.

---

## Linking notes to users

A note belongs to a user. Express that by storing the user's primary key on the note.

Add to `notes`:

| Column | Type | Nullable |
|---|---|---|
| `user_id` | INT | no |

Two decisions worth stating explicitly:

**The type must match the referenced primary key.** `users.id` is an `INT`, so `notes.user_id` is an `INT`. Mismatched types either prevent the constraint from being created or cause silent, slow conversions.

**Nullable or not is a modelling question.** Would a note with no author ever make sense in this application? Here, no — every note belongs to a person. So `NOT NULL`. In a different application (an anonymous suggestion box, say) the answer could be yes, and the nullability would encode that.

> **Foundation — Foreign keys and cardinality**
>
> A **foreign key** is a column holding the primary key of a row in another table. It is how relational databases represent relationships — the "relational" in the name.
>
> The vocabulary for the shapes:
>
> - **One-to-many.** One user has many notes; each note has one user. The foreign key goes on the *many* side. This is by far the most common.
> - **One-to-one.** A user has one profile. The foreign key can sit on either side, with a unique constraint.
> - **Many-to-many.** A post has many tags; a tag has many posts. Neither table can hold the key, so a third **pivot table** holds pairs of IDs.
>
> Naming convention: `<singular_table>_id`. `user_id` references `users.id`. Following it means every framework's conventions will work without configuration.

---

## The inconsistency problem

Set a note's `user_id` to `0`. It saves without complaint. There is no user with ID 0.

You now have a note belonging to a person who does not exist. Nothing in the database objected, because nothing told it to.

> **Foundation — Referential integrity and orphan records**
>
> An **orphan record** is a row whose foreign key points at something that no longer exists.
>
> The damage is quietly severe. A join silently drops the row. A report undercounts. A page shows a blank author name. A `NOT NULL` display field renders as nothing. None of these announce themselves — they just make your data quietly wrong, and the wrongness compounds over time.
>
> **Referential integrity** is the guarantee that every foreign key points at a row that actually exists. You get it by declaring a **foreign key constraint**, after which the database refuses any insert or update that would break it.

---

## Adding the constraint

In your GUI client, on the `notes` table, find the *Foreign keys* section and create one:

- **Column** — `user_id` (the column on this table)
- **Referenced table** — `users`
- **Referenced column** — `id`

In SQL:

```sql
ALTER TABLE notes
ADD CONSTRAINT notes_user_id_foreign
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;
```

Try setting `user_id` to `0` now. Rejected. The database will not allow a note pointing at a nonexistent user.

## Cascade behaviour

The constraint dialog offers hooks for what happens when the referenced row is updated or deleted. This is a real design decision.

Consider: John Doe has written a dozen notes. His account is deleted. What happens to the notes? They now point at nothing.

The options:

| Action | Behaviour |
|---|---|
| `CASCADE` | Delete the notes too |
| `RESTRICT` / `NO ACTION` | Refuse to delete the user while notes exist |
| `SET NULL` | Keep the notes, blank out `user_id` (requires a nullable column) |
| `SET DEFAULT` | Point them at a default value |

For personal notes, `CASCADE` is right: the notes are the user's, and deleting the account should remove them.

For other relationships it would be badly wrong. Deleting a customer should not silently erase their invoices — legally you may be required to keep those. There `RESTRICT` is correct, forcing an explicit decision.

> **Foundation — There is no default correct answer**
>
> The cascade choice cannot be made from the schema alone. It depends on what the data means and what the business requires. `CASCADE` for notes, `RESTRICT` for invoices, `SET NULL` for a blog post whose author left the company but whose article stays published.
>
> A separate pattern worth knowing: **soft deletes**. Instead of removing a row, set a `deleted_at` timestamp and filter it out everywhere. Nothing is ever destroyed, deletions are reversible, and audit history survives. The cost is that every query must remember to exclude soft-deleted rows — which is why frameworks provide this as a feature rather than leaving it to you.

## Testing the cascade

Create a user. Create two notes pointing at that user. Delete the user.

Both notes disappear with them. The constraint did it, without a line of PHP.

That is the point of pushing rules into the database: the guarantee holds no matter what code touches the data.

---

## Populating data to work with

Before the next chapter, create at least two users and several notes spread between them. Chapter 14 relies on notes belonging to different owners, so that authorization has something real to enforce.

```sql
SELECT * FROM notes WHERE user_id = 1;
```

Only that user's notes. Change the ID and you get the other user's. Straightforward, and it is exactly the query the next chapter builds a page around.

---

## Where you stand

- Unique indexes enforce uniqueness and speed up lookups.
- Foreign keys represent relationships and prevent orphans.
- Cascade behaviour is a design decision, not a default.
- Rules enforced by the database cannot be bypassed by any application.

The theme to carry forward: **put invariants as close to the data as possible.** Anything the database can guarantee, it should. Application-level checks are a second line of defence, not the first.

**Next:** [14 — The full request cycle](14-full-request-cycle.md)
