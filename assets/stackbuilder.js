/* Two widgets for reasoning about what you install and why.

   <div class="widget" data-xampp></div>        — decode the bundle
   <div class="widget" data-stackbuilder></div> — pick goals, get the minimum toolset
*/

(() => {
  const { el } = window.Bootcamp;

  /* ---------- what each package actually is ---------- */

  const TOOLS = {
    "php-cli": {
      title: "php-cli",
      what: "The PHP engine itself, with the command-line front door.",
      detail: "One binary at <code>/usr/bin/php</code> (~12 MB) plus a config file. It reads .php files and executes them. <strong>It depends on no web server</strong> — you can check with <code>apt-cache show php8.5-cli</code>.",
      rung: 1,
    },
    "php-sqlite3": {
      title: "php-sqlite3",
      what: "Lets PHP talk to SQLite — a database that is a <em>library</em>, not a server.",
      detail: "No process to start, no port, no password. The whole database is one file. The most underrated option in the list: it is the most deployed database in the world and is what Cloudflare D1 is built on.",
      rung: 2,
    },
    "mariadb-server": {
      title: "mariadb-server",
      what: "A database <em>server</em> — a long-lived process listening on port 3306.",
      detail: "MariaDB is a drop-in fork of MySQL, made after Oracle acquired it. Same client, same SQL, same wire protocol. Only needed when several programs must share one database over a network.",
      rung: 3,
    },
    "php-mysql": {
      title: "php-mysql",
      what: "The driver that lets PHP speak MySQL's wire protocol.",
      detail: "Separate from the server. The server could be on another machine entirely — this is the client half, and it is what makes <code>new PDO('mysql:…')</code> work.",
      rung: 3,
    },
    "php-mbstring": {
      title: "php-mbstring",
      what: "Multi-byte string functions — <code>mb_strlen</code>, <code>mb_substr</code>.",
      detail: "PHP strings are byte arrays. Without this, cutting a string in half can split a character in two and produce mojibake. Needed the moment users type anything that isn't plain ASCII.",
      rung: 2,
    },
    "php-curl": {
      title: "php-curl",
      what: "Lets PHP make outbound HTTP requests.",
      detail: "Bindings to libcurl, the same library behind the <code>curl</code> command. Needed for calling APIs, payment gateways, webhooks — anything where your server is the <em>client</em>.",
      rung: 2,
    },
    "php-xml": {
      title: "php-xml",
      what: "DOM, SimpleXML and XSL parsing.",
      detail: "Required by an enormous amount of library code — including Composer packages that never mention XML. Frequently the missing piece behind a confusing install failure.",
      rung: 4,
    },
    "php-zip": {
      title: "php-zip",
      what: "Reading and writing zip archives.",
      detail: "Composer uses it to unpack downloaded packages. Without it Composer falls back to slow git clones and complains.",
      rung: 4,
    },
    "composer": {
      title: "composer",
      what: "PHP's package manager.",
      detail: "Downloads other people's libraries and generates an autoloader so you stop writing <code>require</code> for classes. Not an Ubuntu package worth using — install the official binary, since the distro version is always behind.",
      rung: 4,
    },
    "nginx": {
      title: "nginx",
      what: "A production web server.",
      detail: "Serves static files fast, terminates TLS, and forwards dynamic requests to PHP-FPM. An event loop holding thousands of connections in one process. <strong>Not needed to learn PHP.</strong>",
      rung: 5,
    },
    "php-fpm": {
      title: "php-fpm",
      what: "The same PHP engine with a FastCGI front door, plus a process pool.",
      detail: "nginx cannot execute PHP, so it hands requests to FPM over a socket. FPM keeps a pool of workers warm and restarts them when they die. This is the pairing that runs most of the PHP web.",
      rung: 5,
    },
    "php-xdebug": {
      title: "php-xdebug",
      what: "A step debugger and profiler.",
      detail: "Pauses execution at a chosen line and lets you inspect everything and step forward. Unambiguously more powerful than <code>dd()</code>, and most PHP developers postpone installing it for years.",
      rung: 6,
    },
  };

  const NOT_NEEDED = {
    apache2: "A second web server. nginx or <code>php -S</code> already does this. Installing both means two programs fighting over port 80.",
    perl: "A different programming language. It is in XAMPP because in 2002 Perl was the dominant CGI language. You will never touch it.",
    phpmyadmin: "A web UI for MySQL, written in PHP. Convenient, and a well-known attack target when left exposed. A terminal client or TablePlus does the same job without a public URL.",
  };

  /* ---------- goals → packages ---------- */

  const GOALS = [
    {
      id: "run",
      label: "Run a PHP file at all",
      detail: "<code>php hello.php</code> in a terminal. Learning syntax, writing scripts, following your course's early chapters.",
      needs: ["php-cli"],
      locked: true,
    },
    {
      id: "serve",
      label: "Serve a dynamic page in a browser",
      detail: "A real website on localhost, with URLs and requests.",
      needs: ["php-cli"],
      surprise: "Still nothing new. <strong>PHP has shipped its own web server since version 5.4 (2012)</strong> — <code>php -S localhost:8888</code>. This is the single biggest reason XAMPP is unnecessary for learning.",
    },
    {
      id: "text",
      label: "Handle names, emoji, accents safely",
      detail: "Anything users type that isn't plain ASCII.",
      needs: ["php-cli", "php-mbstring"],
    },
    {
      id: "store-simple",
      label: "Store data that survives the request",
      detail: "Notes, users, posts — data that outlives one page load.",
      needs: ["php-cli", "php-sqlite3"],
      surprise: "SQLite, not MySQL. It is a <em>library</em>, not a server: no process, no port, no password, one file. Everything your course teaches about SQL, tables, indexes and prepared statements works identically.",
    },
    {
      id: "store-server",
      label: "Use MySQL specifically",
      detail: "Because your course does, or a job does, or several apps must share one database.",
      needs: ["php-cli", "php-mysql", "mariadb-server"],
      note: "Two separate things: the <strong>server</strong> (a process on port 3306) and the <strong>driver</strong> (how PHP talks to it). They are often on different machines.",
    },
    {
      id: "api",
      label: "Call an external API",
      detail: "Payment gateways, webhooks, third-party data. Your server as a client.",
      needs: ["php-cli", "php-curl"],
    },
    {
      id: "libs",
      label: "Use other people's libraries",
      detail: "Composer packages — and therefore Laravel, Symfony, PHPUnit, anything.",
      needs: ["php-cli", "composer", "php-xml", "php-zip"],
      note: "<code>php-xml</code> and <code>php-zip</code> look unrelated but Composer needs both. This is the most common cause of a confusing first-time Composer failure.",
    },
    {
      id: "debug",
      label: "Step through code line by line",
      detail: "Breakpoints, inspecting the whole stack, stepping forward.",
      needs: ["php-cli", "php-xdebug"],
    },
    {
      id: "prod",
      label: "Serve real public traffic",
      detail: "HTTPS, many concurrent users, static assets served fast, crash isolation.",
      needs: ["nginx", "php-fpm"],
      note: "Only here does a real web server earn its place. <code>php -S</code> handles one request at a time and has no TLS — its own manual says not to use it on a public network.",
    },
  ];

  /* ---------- XAMPP decoder ---------- */

  const XAMPP = [
    {
      letter: "X",
      name: "Cross-platform",
      verdict: "not a tool",
      colour: "var(--ink-faint)",
      text: "Not a program at all. It just means the bundle runs on Windows, macOS and Linux. The original was <strong>LAMP</strong> — Linux, Apache, MySQL, PHP — and the X generalised the first letter.",
    },
    {
      letter: "A",
      name: "Apache",
      verdict: "you don't need it",
      colour: "var(--bad)",
      text: "A web server. It accepts TCP connections, serves files, and forwards dynamic requests to PHP. Genuinely necessary <em>in production</em> — and completely unnecessary for learning, because <code>php -S</code> has been built into PHP since 2012.",
    },
    {
      letter: "M",
      name: "MySQL / MariaDB",
      verdict: "only when you need it",
      colour: "var(--warn)",
      text: "A database server — a long-lived process on port 3306, with users and passwords. Worth having when your course requires it. For learning SQL, <strong>SQLite</strong> gives you the same language with no server at all.",
    },
    {
      letter: "P",
      name: "PHP",
      verdict: "this is the one",
      colour: "var(--ok)",
      text: "The actual language runtime — the binary that reads your <code>.php</code> files and executes them. <strong>This is the only letter you truly need to start.</strong> One package, about 12 MB.",
    },
    {
      letter: "P",
      name: "Perl",
      verdict: "vestigial",
      colour: "var(--bad)",
      text: "A completely different programming language. It is in the bundle because XAMPP dates from 2002, when Perl was the dominant language for CGI scripts. <strong>You will never use it.</strong> It is the clearest evidence that XAMPP is a historical artefact rather than a considered set of requirements.",
    },
  ];

  const initXampp = (host) => {
    host.textContent = "";
    const detail = el("div", {
      style: "margin-top:0.9rem;min-height:5.5rem;border-left:3px solid var(--rule);padding:0.5rem 0 0.5rem 0.85rem",
    });

    const buttons = XAMPP.map((item, index) => {
      const button = el("button", {
        type: "button",
        style: "flex-direction:column;gap:0.1rem;padding:0.55rem 0.9rem;line-height:1.2",
      });
      button.innerHTML =
        `<span style="font-family:var(--mono);font-size:1.35rem;color:${item.colour}">${item.letter}</span>` +
        `<span style="font-size:0.66rem;color:var(--ink-faint)">${item.name}</span>`;
      button.addEventListener("click", () => {
        detail.style.borderLeftColor = item.colour;
        detail.innerHTML =
          `<div style="font-family:var(--sans);font-size:0.78rem;font-weight:650;color:${item.colour};
            letter-spacing:0.05em;text-transform:uppercase">${item.name} — ${item.verdict}</div>
           <p style="font-size:0.86rem;line-height:1.55;margin:0.35rem 0 0">${item.text}</p>`;
        buttons.forEach((other, i) => other.style.background = i === index ? "var(--paper-raised)" : "");
      });
      return button;
    });

    host.append(
      el("div", { className: "widget-title" }, "XAMPP, decoded — click each letter"),
      el("div", { style: "display:flex;gap:0.5rem;flex-wrap:wrap" }, buttons),
      detail,
      el("p", {
        style: "font-size:0.82rem;line-height:1.55;color:var(--ink-soft);margin:0.9rem 0 0;border-top:1px solid var(--rule);padding-top:0.7rem",
      }),
    );

    host.lastChild.innerHTML =
      "<strong>Five letters. Four programs. One of them is a language you will never write.</strong> " +
      "XAMPP solved a real 2002 problem: making Apache, MySQL and PHP find each other on Windows was genuinely painful. " +
      "It was never a statement about what PHP requires.";

    buttons[3].click();
  };

  /* ---------- stack builder ---------- */

  const initStackBuilder = (host) => {
    const chosen = new Set(["run"]);

    host.textContent = "";
    const goalList = el("div", { style: "display:grid;gap:0.3rem" });
    const output = el("div", { style: "margin-top:1.1rem" });

    const paint = () => {
      const packages = new Set();
      for (const goal of GOALS) {
        if (chosen.has(goal.id)) goal.needs.forEach((p) => packages.add(p));
      }

      const ordered = [...packages].sort((a, b) => (TOOLS[a].rung - TOOLS[b].rung) || a.localeCompare(b));
      const aptPackages = ordered.filter((p) => p !== "composer");

      const notes = GOALS.filter((g) => chosen.has(g.id) && (g.surprise || g.note));

      output.innerHTML =
        `<h4 style="margin-top:0">You need ${ordered.length} thing${ordered.length === 1 ? "" : "s"}</h4>` +
        ordered.map((key) => {
          const tool = TOOLS[key];
          return `<div style="border:1px solid var(--rule);border-radius:2px;padding:0.5rem 0.65rem;margin:0.28rem 0;background:var(--paper)">
            <div style="font-family:var(--mono);font-size:0.82rem;color:var(--accent)">${tool.title}</div>
            <div style="font-size:0.82rem;line-height:1.5;margin-top:0.15rem">${tool.what}</div>
            <div style="font-size:0.76rem;line-height:1.5;color:var(--ink-soft);margin-top:0.25rem">${tool.detail}</div>
          </div>`;
        }).join("") +

        `<h4>The command</h4>
         <pre style="margin:0.3rem 0"><code>sudo apt install -y ${aptPackages.join(" ")}${
          packages.has("composer")
            ? `\n\n<span class="c"># composer is not an apt package worth using — get the official one</span>\ncurl -sS https://getcomposer.org/installer | php\nsudo mv composer.phar /usr/local/bin/composer`
            : ""
        }</code></pre>` +

        (notes.length
          ? `<h4>Worth noticing</h4>` + notes.map((g) =>
              `<div style="border-left:3px solid ${g.surprise ? "var(--accent)" : "var(--rule)"};
                padding:0.4rem 0 0.4rem 0.8rem;margin:0.4rem 0;font-size:0.82rem;line-height:1.55;color:var(--ink-soft)">
                <strong style="color:var(--ink)">${g.label}</strong><br>${g.surprise || g.note}</div>`).join("")
          : "") +

        `<h4>Still not needed</h4>` +
        Object.entries(NOT_NEEDED)
          .filter(([key]) => !(key === "apache2" && packages.has("nginx")))
          .map(([key, why]) =>
            `<div style="font-size:0.8rem;line-height:1.5;color:var(--ink-faint);margin:0.25rem 0">
              <code style="text-decoration:line-through">${key}</code> — ${why}</div>`).join("");
    };

    for (const goal of GOALS) {
      const row = el("label", {
        style: "display:flex;gap:0.6rem;align-items:flex-start;border:1px solid var(--rule);border-radius:2px;padding:0.45rem 0.6rem;cursor:pointer;background:var(--paper)",
      });
      const box = el("input", { type: "checkbox", checked: chosen.has(goal.id), style: "width:auto;margin-top:0.15rem" });
      if (goal.locked) {
        box.disabled = true;
        row.style.opacity = "0.85";
        row.style.cursor = "default";
      }
      box.addEventListener("change", () => {
        if (box.checked) chosen.add(goal.id);
        else chosen.delete(goal.id);
        row.style.borderColor = box.checked ? "var(--accent)" : "var(--rule)";
        paint();
      });
      if (chosen.has(goal.id)) row.style.borderColor = "var(--accent)";

      row.append(box, el("span", {}, [
        el("span", { style: "font-family:var(--sans);font-size:0.84rem;font-weight:600" }, goal.label),
        el("span", { style: "display:block;font-size:0.76rem;color:var(--ink-soft);line-height:1.45;margin-top:0.1rem" }, ""),
      ]));
      row.querySelector("span span:last-child").innerHTML = goal.detail + (goal.locked ? " <em>(always required)</em>" : "");
      goalList.append(row);
    }

    host.append(
      el("div", { className: "widget-title" }, "Stack builder — tick what you actually want to do"),
      goalList,
      output,
    );

    paint();
  };

  const boot = () => {
    document.querySelectorAll("[data-xampp]").forEach(initXampp);
    document.querySelectorAll("[data-stackbuilder]").forEach(initStackBuilder);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
