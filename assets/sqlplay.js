/* A tiny in-browser SQL engine — enough of SELECT/JOIN/WHERE/ORDER/LIMIT to make
   the lessons on querying, indexing and injection genuinely interactive.

   It deliberately supports stacked statements separated by ';' and DROP TABLE,
   because Lesson 0020 needs the attack to actually work.

     <div class="widget" data-sqlplay>
       <script type="application/json">{ "query": "SELECT * FROM users" }</script>
     </div>
*/

(() => {
  const { el, config } = window.Bootcamp;

  const seed = () => ({
    users: {
      columns: ["id", "name", "email", "admin"],
      rows: [
        { id: 1, name: "Fouad", email: "fouad@example.com", admin: 1 },
        { id: 2, name: "John", email: "john@example.com", admin: 0 },
        { id: 3, name: "Amina", email: "amina@example.com", admin: 1 },
        { id: 4, name: "Guest", email: "guest@example.com", admin: 0 },
      ],
    },
    notes: {
      columns: ["id", "user_id", "body", "created_at"],
      rows: [
        { id: 1, user_id: 1, body: "Buy milk", created_at: "2026-07-28" },
        { id: 2, user_id: 1, body: "Read RFC 9110", created_at: "2026-07-29" },
        { id: 3, user_id: 2, body: "Call the bank", created_at: "2026-07-29" },
        { id: 4, user_id: 2, body: "Private: salary review", created_at: "2026-07-30" },
        { id: 5, user_id: 3, body: "Deploy on Friday", created_at: "2026-07-30" },
      ],
    },
  });

  /* ---------- expression evaluation ---------- */

  const literal = (token) => {
    const text = token.trim();
    if (/^'([^']*)'$/.test(text)) return text.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    if (/^null$/i.test(text)) return null;
    return { column: text };
  };

  const valueOf = (operand, row) => {
    if (operand && typeof operand === "object" && "column" in operand) {
      const name = operand.column;
      if (name in row) return row[name];
      const bare = name.includes(".") ? name.split(".").pop() : name;
      if (bare in row) return row[bare];
      return undefined;
    }
    return operand;
  };

  const compare = (left, op, right) => {
    if (op === "=") return left == right;
    if (op === "!=" || op === "<>") return left != right;
    if (op === ">") return left > right;
    if (op === "<") return left < right;
    if (op === ">=") return left >= right;
    if (op === "<=") return left <= right;
    return false;
  };

  const evaluateCondition = (clause, row) => {
    const text = clause.trim();

    const orParts = splitTop(text, /\s+OR\s+/i);
    if (orParts.length > 1) return orParts.some((part) => evaluateCondition(part, row));

    const andParts = splitTop(text, /\s+AND\s+/i);
    if (andParts.length > 1) return andParts.every((part) => evaluateCondition(part, row));

    if (/^\(.*\)$/.test(text) && balanced(text.slice(1, -1))) {
      return evaluateCondition(text.slice(1, -1), row);
    }

    let match = text.match(/^(.+?)\s+IS\s+(NOT\s+)?NULL$/i);
    if (match) {
      const value = valueOf(literal(match[1]), row);
      const isNull = value === null || value === undefined;
      return match[2] ? !isNull : isNull;
    }

    match = text.match(/^(.+?)\s+(NOT\s+)?LIKE\s+'([^']*)'$/i);
    if (match) {
      const value = String(valueOf(literal(match[1]), row) ?? "");
      const pattern = new RegExp("^" + match[3]
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*").replace(/_/g, ".") + "$", "i");
      const hit = pattern.test(value);
      return match[2] ? !hit : hit;
    }

    match = text.match(/^(.+?)\s+(NOT\s+)?IN\s*\(([^)]*)\)$/i);
    if (match) {
      const value = valueOf(literal(match[1]), row);
      const set = match[3].split(",").map((t) => valueOf(literal(t), row));
      const hit = set.some((candidate) => candidate == value);
      return match[2] ? !hit : hit;
    }

    match = text.match(/^(.+?)\s*(>=|<=|!=|<>|=|>|<)\s*(.+)$/);
    if (match) {
      return compare(
        valueOf(literal(match[1]), row),
        match[2],
        valueOf(literal(match[3]), row),
      );
    }

    const bare = valueOf(literal(text), row);
    return Boolean(bare) && bare !== 0;
  };

  const balanced = (text) => {
    let depth = 0;
    for (const char of text) {
      if (char === "(") depth++;
      if (char === ")") depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
  };

  const splitTop = (text, separator) => {
    const parts = [];
    let depth = 0;
    let quote = false;
    let current = "";
    let i = 0;
    while (i < text.length) {
      const char = text[i];
      if (char === "'") quote = !quote;
      if (!quote) {
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (depth === 0) {
          const rest = text.slice(i);
          const hit = rest.match(separator);
          if (hit && hit.index === 0) {
            parts.push(current);
            current = "";
            i += hit[0].length;
            continue;
          }
        }
      }
      current += char;
      i++;
    }
    parts.push(current);
    return parts.filter((p) => p.trim());
  };

  /* ---------- statement execution ---------- */

  const runSelect = (db, sql, stats) => {
    /* The alias group must refuse SQL keywords, or "FROM notes WHERE …"
       parses "WHERE" as a table alias and the rest of the clause is lost. */
    const match = sql.match(
      /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+(?:AS\s+)?(?!(?:WHERE|JOIN|INNER|LEFT|RIGHT|ORDER|GROUP|HAVING|LIMIT|ON)\b)(\w+))?(.*)$/is);
    if (!match) throw new Error("Only SELECT … FROM … is supported here.");

    const [, columnList, tableName, , tail] = match;
    const table = db[tableName.toLowerCase()];
    if (!table) throw new Error(`Table '${tableName}' doesn't exist.`);

    let rows = table.rows.map((row) => ({ ...row }));
    stats.scanned = rows.length;
    stats.table = tableName;

    const joinMatch = tail.match(/\b(?:INNER\s+|LEFT\s+)?JOIN\s+(\w+)\s+ON\s+([\w.]+)\s*=\s*([\w.]+)/i);
    if (joinMatch) {
      const [, joinName, leftRef, rightRef] = joinMatch;
      const joined = db[joinName.toLowerCase()];
      if (!joined) throw new Error(`Table '${joinName}' doesn't exist.`);
      const isLeft = /LEFT\s+JOIN/i.test(tail);
      const keyOf = (ref) => ref.includes(".") ? ref.split(".") : [tableName, ref];
      const [leftTable, leftCol] = keyOf(leftRef);
      const [, rightCol] = keyOf(rightRef);
      const outer = leftTable.toLowerCase() === tableName.toLowerCase() ? leftCol : rightCol;
      const inner = outer === leftCol ? rightCol : leftCol;

      const out = [];
      for (const row of rows) {
        const matches = joined.rows.filter((other) => other[inner] == row[outer]);
        stats.scanned += joined.rows.length;
        if (matches.length) {
          for (const other of matches) {
            const merged = { ...row };
            for (const [key, value] of Object.entries(other)) {
              merged[key in merged ? `${joinName}.${key}` : key] = value;
            }
            out.push(merged);
          }
        } else if (isLeft) {
          out.push({ ...row });
        }
      }
      rows = out;
    }

    const whereMatch = tail.match(/\bWHERE\s+(.+?)(?=\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/is);
    if (whereMatch) {
      rows = rows.filter((row) => evaluateCondition(whereMatch[1], row));
    }
    stats.matched = rows.length;

    const groupMatch = tail.match(/\bGROUP\s+BY\s+([\w.]+)/i);
    if (groupMatch) {
      const key = groupMatch[1];
      const groups = new Map();
      for (const row of rows) {
        const value = row[key];
        if (!groups.has(value)) groups.set(value, []);
        groups.get(value).push(row);
      }
      rows = [...groups.entries()].map(([value, members]) => ({
        [key]: value,
        "COUNT(*)": members.length,
      }));
    }

    const orderMatch = tail.match(/\bORDER\s+BY\s+([\w.()*]+)(\s+DESC|\s+ASC)?/i);
    if (orderMatch) {
      const key = orderMatch[1];
      const direction = /DESC/i.test(orderMatch[2] || "") ? -1 : 1;
      rows.sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * direction);
      stats.sorted = true;
    }

    const limitMatch = tail.match(/\bLIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
    if (limitMatch) {
      const offset = Number(limitMatch[2] || 0);
      rows = rows.slice(offset, offset + Number(limitMatch[1]));
    }

    const wanted = columnList.trim();
    if (/^COUNT\(\*\)$/i.test(wanted)) {
      return { columns: ["COUNT(*)"], rows: [{ "COUNT(*)": rows.length }] };
    }
    if (wanted === "*" || groupMatch) {
      const columns = rows.length ? Object.keys(rows[0]) : table.columns;
      return { columns, rows };
    }

    const names = wanted.split(",").map((c) => c.trim());
    return {
      columns: names,
      rows: rows.map((row) => Object.fromEntries(names.map((name) => {
        const bare = name.includes(".") ? name.split(".").pop() : name;
        return [name, name in row ? row[name] : row[bare]];
      }))),
    };
  };

  const execute = (db, sql) => {
    const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
    const results = [];

    for (const statement of statements) {
      const stats = {};
      if (/^SELECT/i.test(statement)) {
        results.push({ kind: "rows", statement, stats, ...runSelect(db, statement, stats) });
        continue;
      }
      const drop = statement.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
      if (drop) {
        const name = drop[1].toLowerCase();
        const existed = Boolean(db[name]);
        delete db[name];
        results.push({
          kind: "destroy", statement,
          message: existed
            ? `Table '${drop[1]}' dropped. All rows are gone. There is no undo.`
            : `Table '${drop[1]}' does not exist.`,
          fatal: existed,
        });
        continue;
      }
      const del = statement.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/is);
      if (del) {
        const table = db[del[1].toLowerCase()];
        if (!table) throw new Error(`Table '${del[1]}' doesn't exist.`);
        const before = table.rows.length;
        table.rows = del[2] ? table.rows.filter((row) => !evaluateCondition(del[2], row)) : [];
        results.push({
          kind: "destroy", statement,
          message: `${before - table.rows.length} row(s) deleted.`,
          fatal: before !== table.rows.length,
        });
        continue;
      }
      results.push({ kind: "note", statement, message: "This engine supports SELECT, DELETE and DROP TABLE." });
    }
    return results;
  };

  /* ---------- widget ---------- */

  const initSqlPlay = (host) => {
    const settings = config(host);
    const state = { db: seed() };

    const input = el("textarea", {
      rows: settings.rows ?? 3,
      spellcheck: false,
      value: settings.query ?? "SELECT * FROM users",
      style: "font-size:0.8rem",
    });

    const output = el("div", { style: "margin-top:0.8rem" });
    const schema = el("div", {});

    const renderSchema = () => {
      const names = Object.keys(state.db);
      schema.innerHTML = names.length
        ? `<div style="font-family:var(--sans);font-size:0.7rem;color:var(--ink-faint);margin-bottom:0.5rem">
            tables: ${names.map((n) =>
              `<code>${n}(${state.db[n].columns.join(", ")})</code> — ${state.db[n].rows.length} rows`).join(" &nbsp;·&nbsp; ")}</div>`
        : `<div style="font-family:var(--sans);font-size:0.72rem;color:var(--bad);margin-bottom:0.5rem">
            No tables left. The database is empty.</div>`;
    };

    const renderTable = (columns, rows) => {
      if (!rows.length) {
        return `<div style="font-family:var(--sans);font-size:0.8rem;color:var(--ink-faint);padding:0.4rem 0">
          Empty set — 0 rows returned.</div>`;
      }
      return `<div class="table-scroll" style="max-width:none;margin:0.3rem 0">
        <table style="margin:0"><thead><tr>${
          columns.map((c) => `<th>${c}</th>`).join("")
        }</tr></thead><tbody>${
          rows.map((row) => `<tr>${columns.map((c) => {
            const value = row[c];
            const shown = value === null || value === undefined
              ? `<span style="color:var(--ink-faint)">NULL</span>`
              : String(value);
            return `<td><code>${shown}</code></td>`;
          }).join("")}</tr>`).join("")
        }</tbody></table></div>`;
    };

    const run = () => {
      renderSchema();
      try {
        const results = execute(state.db, input.value);
        output.innerHTML = results.map((result) => {
          if (result.kind === "rows") {
            const { stats } = result;
            const note = stats.scanned
              ? `<div style="font-family:var(--sans);font-size:0.7rem;color:var(--ink-faint);margin-top:0.2rem">
                  examined ${stats.scanned} row(s) in <code>${stats.table}</code> → returned ${result.rows.length}${
                    stats.sorted ? " · sorted" : ""}</div>`
              : "";
            return renderTable(result.columns, result.rows) + note;
          }
          if (result.kind === "destroy") {
            return `<div style="border-left:3px solid ${result.fatal ? "var(--bad)" : "var(--rule)"};
              background:${result.fatal ? "var(--bad-bg)" : "var(--paper)"};padding:0.5rem 0.7rem;margin:0.3rem 0;
              font-family:var(--sans);font-size:0.8rem;color:${result.fatal ? "var(--bad)" : "var(--ink-soft)"}">
              <code style="font-size:0.74rem">${result.statement}</code><br>${result.message}</div>`;
          }
          return `<div style="font-family:var(--sans);font-size:0.8rem;color:var(--ink-faint);padding:0.3rem 0">
            ${result.message}</div>`;
        }).join("");
        renderSchema();
      } catch (error) {
        output.innerHTML = `<div style="border-left:3px solid var(--bad);background:var(--bad-bg);
          padding:0.5rem 0.7rem;font-family:var(--mono);font-size:0.78rem;color:var(--bad)">
          ERROR: ${error.message}</div>`;
      }
    };

    const runButton = el("button", { type: "button", className: "primary" }, "Run ▸");
    runButton.addEventListener("click", run);

    const resetButton = el("button", { type: "button" }, "Restore database");
    resetButton.addEventListener("click", () => {
      state.db = seed();
      run();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        run();
      }
    });

    const examples = el("div", { style: "display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.6rem" });
    for (const [label, query] of settings.examples ?? []) {
      const button = el("button", { type: "button", style: "font-size:0.72rem" }, label);
      button.addEventListener("click", () => { input.value = query; run(); });
      examples.append(button);
    }

    host.textContent = "";
    host.append(
      el("div", { className: "widget-title" }, settings.title ?? "SQL playground"),
      schema,
      ...(settings.examples ? [examples] : []),
      input,
      el("div", { className: "controls", style: "display:flex;gap:0.4rem;margin-top:0.55rem;align-items:center;flex-wrap:wrap" }, [
        runButton, resetButton,
        el("span", { style: "font-family:var(--sans);font-size:0.72rem;color:var(--ink-faint)" }, "Ctrl+Enter to run"),
      ]),
      output,
    );

    run();
  };

  const boot = () => document.querySelectorAll("[data-sqlplay]").forEach(initSqlPlay);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.SqlEngine = { execute, seed };
})();
