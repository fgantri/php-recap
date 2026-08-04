/* A small POSIX-flavoured shell emulator for the bootcamp lessons.

   Declared in HTML as:

     <div class="widget" data-terminal>
       <script type="application/json">{ "tasks": [...], "intro": "..." }</script>
     </div>

   Task checks are declarative so they can live in JSON:
     { "type": "ran",     "match": "^which php" }
     { "type": "cwd",     "path": "/home/fgantri/websites/demo" }
     { "type": "exists",  "path": "/home/fgantri/websites/demo/index.php" }
     { "type": "output",  "match": "/usr/bin/php" }
     { "type": "env",     "name": "GREETING", "match": "hello" }
*/

(() => {
  const { el, config } = window.Bootcamp;

  const HOME = "/home/fgantri";

  const dir = (children = {}) => ({ type: "dir", mode: "drwxr-xr-x", children });
  const file = (content = "", mode = "-rw-r--r--") => ({ type: "file", mode, content });
  const exe = (content = "") => ({ type: "file", mode: "-rwxr-xr-x", content });

  const freshFs = () => dir({
    bin: dir({
      bash: exe(), ls: exe(), cat: exe(), echo: exe(), mkdir: exe(), rm: exe(),
      grep: exe(), curl: exe(),
    }),
    etc: dir({
      hosts: file("127.0.0.1\tlocalhost\n::1\tlocalhost\n"),
      hostname: file("wsl-thinkpad\n"),
      passwd: file("root:x:0:0:root:/root:/bin/bash\nfgantri:x:1000:1000::/home/fgantri:/bin/bash\n"),
    }),
    home: dir({
      fgantri: dir({
        ".bashrc": file('export PATH="$HOME/.local/bin:$PATH"\nalias ll="ls -l"\n'),
        websites: dir({
          demo: dir({
            "index.html": file("<!DOCTYPE html>\n<html>\n<body><h1>Hello World</h1></body>\n</html>\n"),
            "notes.txt": file("port 8888 is the one we use\nindex is the default filename\n"),
          }),
        }),
      }),
    }),
    tmp: dir({}),
    usr: dir({
      bin: dir({ php: exe(), mysql: exe(), git: exe(), node: exe(), which: exe() }),
      local: dir({ bin: dir({ php: exe() }) }),
      share: dir({}),
    }),
    var: dir({ log: dir({ "syslog": file("Jul 31 09:14:02 wsl-thinkpad systemd[1]: Started MariaDB.\n") }) }),
  });

  const splitPath = (path) => path.split("/").filter(Boolean);

  const resolve = (state, raw) => {
    const input = raw.replace(/^~(?=\/|$)/, HOME);
    const base = input.startsWith("/") ? [] : splitPath(state.cwd);
    const out = [...base];
    for (const part of splitPath(input)) {
      if (part === ".") continue;
      if (part === "..") out.pop();
      else out.push(part);
    }
    return "/" + out.join("/");
  };

  const lookup = (state, path) => {
    let node = state.fs;
    for (const part of splitPath(path)) {
      if (node?.type !== "dir") return null;
      node = node.children[part];
      if (!node) return null;
    }
    return node ?? null;
  };

  const parentOf = (path) => {
    const parts = splitPath(path);
    const name = parts.pop();
    return { parent: "/" + parts.join("/"), name };
  };

  const pretty = (state, path) => (path === HOME ? "~" : path.startsWith(HOME + "/") ? "~" + path.slice(HOME.length) : path);

  /* ---------- commands ---------- */

  const ok = (out = "") => ({ out, err: "", code: 0 });
  const fail = (err, code = 1) => ({ out: "", err, code });

  const commands = {
    help: () => ok(
      "Available: pwd ls cd mkdir touch cat echo rm cp mv which type env export unset\n" +
      "           head wc grep find tree file stat chmod whoami hostname history clear\n" +
      "           php curl date help\n" +
      "Supported syntax: pipes (|), redirection (> >>), $VAR, $?, quotes, && and ;"
    ),

    pwd: (state) => ok(state.cwd + "\n"),

    whoami: () => ok("fgantri\n"),

    hostname: () => ok("wsl-thinkpad\n"),

    date: () => ok("Fri Jul 31 09:14:02 CEST 2026\n"),

    clear: (state) => { state.clear = true; return ok(); },

    history: (state) => ok(state.history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`).join("\n") + "\n"),

    ls: (state, args) => {
      const flags = args.filter((a) => a.startsWith("-")).join("");
      const targets = args.filter((a) => !a.startsWith("-"));
      const path = resolve(state, targets[0] ?? ".");
      const node = lookup(state, path);
      if (!node) return fail(`ls: cannot access '${targets[0] ?? "."}': No such file or directory\n`, 2);

      if (node.type === "file") return ok(targets[0] + "\n");

      const names = Object.keys(node.children).sort();
      const visible = flags.includes("a") ? [".", "..", ...names] : names.filter((n) => !n.startsWith("."));

      if (!flags.includes("l")) {
        if (!visible.length) return ok();
        return ok(visible.map((n) => {
          const child = node.children[n];
          return child?.type === "dir" || n === "." || n === ".."
            ? `<span class="dir">${n}</span>`
            : child?.mode.includes("x") ? `<span class="exe">${n}</span>` : n;
        }).join("  ") + "\n");
      }

      const rows = visible.map((n) => {
        const child = n === "." ? node : n === ".." ? node : node.children[n];
        const size = child?.type === "file" ? child.content.length : 4096;
        const label = child?.type === "dir" ? `<span class="dir">${n}</span>` : n;
        return `${child?.mode ?? "drwxr-xr-x"}  1 fgantri fgantri ${String(size).padStart(6)} Jul 31 09:14 ${label}`;
      });
      return ok(`total ${rows.length}\n` + rows.join("\n") + "\n");
    },

    cd: (state, args) => {
      const target = args[0] ?? "~";
      const path = resolve(state, target);
      const node = lookup(state, path);
      if (!node) return fail(`bash: cd: ${target}: No such file or directory\n`);
      if (node.type !== "dir") return fail(`bash: cd: ${target}: Not a directory\n`);
      state.cwd = path;
      state.env.PWD = path;
      return ok();
    },

    mkdir: (state, args) => {
      const recursive = args.some((a) => a === "-p");
      const targets = args.filter((a) => !a.startsWith("-"));
      if (!targets.length) return fail("mkdir: missing operand\n");

      for (const target of targets) {
        const path = resolve(state, target);
        if (lookup(state, path)) {
          if (recursive) continue;
          return fail(`mkdir: cannot create directory '${target}': File exists\n`);
        }
        const parts = splitPath(path);
        let node = state.fs;
        for (const [index, part] of parts.entries()) {
          const last = index === parts.length - 1;
          if (!node.children[part]) {
            if (!last && !recursive) {
              return fail(`mkdir: cannot create directory '${target}': No such file or directory\n`);
            }
            node.children[part] = dir();
          }
          node = node.children[part];
        }
      }
      return ok();
    },

    touch: (state, args) => {
      for (const target of args) {
        const path = resolve(state, target);
        if (lookup(state, path)) continue;
        const { parent, name } = parentOf(path);
        const node = lookup(state, parent);
        if (node?.type !== "dir") return fail(`touch: cannot touch '${target}': No such file or directory\n`);
        node.children[name] = file("");
      }
      return ok();
    },

    cat: (state, args, stdin) => {
      if (!args.length) return ok(stdin);
      const chunks = [];
      for (const target of args) {
        const node = lookup(state, resolve(state, target));
        if (!node) return fail(`cat: ${target}: No such file or directory\n`);
        if (node.type === "dir") return fail(`cat: ${target}: Is a directory\n`);
        chunks.push(node.content);
      }
      return ok(chunks.join(""));
    },

    echo: (state, args) => ok(args.join(" ") + "\n"),

    rm: (state, args) => {
      const recursive = args.some((a) => /^-[rRf]*[rR]/.test(a));
      const targets = args.filter((a) => !a.startsWith("-"));
      for (const target of targets) {
        const path = resolve(state, target);
        const node = lookup(state, path);
        if (!node) return fail(`rm: cannot remove '${target}': No such file or directory\n`);
        if (node.type === "dir" && !recursive) return fail(`rm: cannot remove '${target}': Is a directory\n`);
        const { parent, name } = parentOf(path);
        delete lookup(state, parent).children[name];
      }
      return ok();
    },

    cp: (state, args) => {
      const [from, to] = args.filter((a) => !a.startsWith("-"));
      const source = lookup(state, resolve(state, from));
      if (!source) return fail(`cp: cannot stat '${from}': No such file or directory\n`);
      const path = resolve(state, to);
      const target = lookup(state, path);
      const clone = JSON.parse(JSON.stringify(source));
      if (target?.type === "dir") {
        target.children[parentOf(resolve(state, from)).name] = clone;
        return ok();
      }
      const { parent, name } = parentOf(path);
      const node = lookup(state, parent);
      if (node?.type !== "dir") return fail(`cp: cannot create '${to}': No such file or directory\n`);
      node.children[name] = clone;
      return ok();
    },

    mv: (state, args) => {
      const result = commands.cp(state, args);
      if (result.code) return result;
      return commands.rm(state, ["-r", args.filter((a) => !a.startsWith("-"))[0]]);
    },

    which: (state, args) => {
      const all = args.includes("-a");
      const name = args.find((a) => !a.startsWith("-"));
      if (!name) return fail("which: missing operand\n", 2);
      const hits = [];
      for (const entry of state.env.PATH.split(":")) {
        const node = lookup(state, entry + "/" + name);
        if (node?.type === "file" && node.mode.includes("x")) {
          hits.push(entry + "/" + name);
          if (!all) break;
        }
      }
      return hits.length ? ok(hits.join("\n") + "\n") : fail("", 1);
    },

    type: (state, args) => {
      const name = args[0];
      if (["cd", "export", "echo", "pwd", "type", "history", "unset"].includes(name)) {
        return ok(`${name} is a shell builtin\n`);
      }
      const found = commands.which(state, args);
      return found.code === 0
        ? ok(`${name} is ${found.out.trim()}\n`)
        : fail(`bash: type: ${name}: not found\n`, 1);
    },

    env: (state) => ok(Object.entries(state.env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n"),

    export: (state, args) => {
      for (const pair of args) {
        const index = pair.indexOf("=");
        if (index < 0) continue;
        state.env[pair.slice(0, index)] = pair.slice(index + 1).replace(/^["']|["']$/g, "");
      }
      return ok();
    },

    unset: (state, args) => {
      for (const name of args) delete state.env[name];
      return ok();
    },

    head: (state, args, stdin) => {
      const count = Number((args.find((a) => /^-\d+$/.test(a)) || "-10").slice(1));
      const targets = args.filter((a) => !a.startsWith("-"));
      const text = targets.length ? commands.cat(state, targets).out : stdin;
      return ok(text.split("\n").slice(0, count).join("\n") + "\n");
    },

    wc: (state, args, stdin) => {
      const targets = args.filter((a) => !a.startsWith("-"));
      const text = targets.length ? commands.cat(state, targets).out : stdin;
      const lines = text ? text.replace(/\n$/, "").split("\n").length : 0;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      if (args.includes("-l")) return ok(`${lines}\n`);
      if (args.includes("-w")) return ok(`${words}\n`);
      return ok(`${String(lines).padStart(6)} ${String(words).padStart(6)} ${String(text.length).padStart(6)}\n`);
    },

    grep: (state, args, stdin) => {
      const invert = args.includes("-v");
      const rest = args.filter((a) => !a.startsWith("-"));
      const [pattern, ...targets] = rest;
      if (!pattern) return fail("usage: grep PATTERN [FILE]\n", 2);
      const text = targets.length ? commands.cat(state, targets).out : stdin;
      const matches = text.split("\n").filter((line) => {
        const hit = line.toLowerCase().includes(pattern.toLowerCase());
        return invert ? !hit && line : hit;
      });
      return matches.length ? ok(matches.join("\n") + "\n") : fail("", 1);
    },

    find: (state, args) => {
      const root = resolve(state, args[0] ?? ".");
      const nameIndex = args.indexOf("-name");
      const pattern = nameIndex >= 0 ? args[nameIndex + 1]?.replace(/["'*]/g, "") : "";
      const hits = [];
      const walk = (path, node) => {
        if (!pattern || path.includes(pattern)) hits.push(path);
        if (node.type === "dir") {
          for (const [name, child] of Object.entries(node.children)) walk(path + "/" + name, child);
        }
      };
      const start = lookup(state, root);
      if (!start) return fail(`find: '${args[0]}': No such file or directory\n`);
      walk(root === "/" ? "" : root, start);
      return ok(hits.join("\n") + "\n");
    },

    tree: (state, args) => {
      const root = resolve(state, args[0] ?? ".");
      const start = lookup(state, root);
      if (!start) return fail(`tree: ${args[0]}: No such file or directory\n`);
      const lines = [pretty(state, root)];
      const walk = (node, prefix) => {
        const names = Object.keys(node.children).filter((n) => !n.startsWith(".")).sort();
        names.forEach((name, index) => {
          const last = index === names.length - 1;
          const child = node.children[name];
          const label = child.type === "dir" ? `<span class="dir">${name}</span>` : name;
          lines.push(`${prefix}${last ? "└── " : "├── "}${label}`);
          if (child.type === "dir") walk(child, prefix + (last ? "    " : "│   "));
        });
      };
      if (start.type === "dir") walk(start, "");
      return ok(lines.join("\n") + "\n");
    },

    file: (state, args) => {
      const node = lookup(state, resolve(state, args[0]));
      if (!node) return fail(`file: cannot open '${args[0]}'\n`);
      if (node.type === "dir") return ok(`${args[0]}: directory\n`);
      if (node.mode.includes("x")) return ok(`${args[0]}: ELF 64-bit LSB executable, x86-64\n`);
      return ok(`${args[0]}: ASCII text\n`);
    },

    stat: (state, args) => {
      const path = resolve(state, args[0]);
      const node = lookup(state, path);
      if (!node) return fail(`stat: cannot statx '${args[0]}': No such file or directory\n`);
      const size = node.type === "file" ? node.content.length : 4096;
      return ok(
        `  File: ${path}\n  Size: ${size}\tBlocks: 8\t${node.type === "dir" ? "directory" : "regular file"}\n` +
        `Access: (${node.mode})  Uid: ( 1000/fgantri)   Gid: ( 1000/fgantri)\n`
      );
    },

    chmod: (state, args) => {
      const [mode, target] = args;
      const node = lookup(state, resolve(state, target ?? ""));
      if (!node) return fail(`chmod: cannot access '${target}': No such file or directory\n`);
      if (/^\+x$|^755$|^u\+x$/.test(mode)) node.mode = node.type === "dir" ? "drwxr-xr-x" : "-rwxr-xr-x";
      else if (/^-x$|^644$/.test(mode)) node.mode = node.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
      return ok();
    },

    php: (state, args) => {
      if (args[0] === "-v") return ok("PHP 8.4.6 (cli) (built: Jul 12 2026 11:02:31) (NTS)\nZend Engine v4.4.6\n");
      if (args[0] === "-S") {
        return ok(
          `[Fri Jul 31 09:14:02 2026] PHP 8.4.6 Development Server (http://${args[1] ?? "localhost:8000"}) started\n` +
          `<span class="dim">(the process is now blocking — this terminal is busy until Ctrl+C)</span>\n`
        );
      }
      if (args[0] === "-r") return ok("(this emulator does not run PHP — use your real terminal)\n");
      return ok("Usage: php [-v] [-S addr:port] [-r code] file\n");
    },

    curl: (state, args) => {
      const url = args.find((a) => a.startsWith("http")) ?? "";
      if (!url) return fail("curl: try 'curl http://localhost:8888'\n", 2);
      return ok(
        `<span class="dim">* Connected to localhost (127.0.0.1) port 8888</span>\n` +
        `<span class="dim">&gt; GET / HTTP/1.1</span>\n<span class="dim">&gt; Host: localhost:8888</span>\n` +
        `<span class="dim">&lt; HTTP/1.1 200 OK</span>\n<span class="dim">&lt; Content-Type: text/html</span>\n\n` +
        `<!DOCTYPE html>\n<html>\n<body><h1>Hello World</h1></body>\n</html>\n`
      );
    },
  };

  /* ---------- parsing and execution ---------- */

  const tokenize = (line) => {
    const tokens = [];
    let current = "";
    let quote = "";
    for (const char of line) {
      if (quote) {
        if (char === quote) quote = "";
        else current += char;
      } else if (char === '"' || char === "'") {
        quote = char;
        current += "";
      } else if (/\s/.test(char)) {
        if (current) tokens.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  };

  const expand = (state, token) =>
    token
      .replace(/\$\?/g, String(state.status))
      .replace(/\$\{(\w+)\}/g, (_, name) => state.env[name] ?? "")
      .replace(/\$(\w+)/g, (_, name) => state.env[name] ?? "");

  const runSimple = (state, line) => {
    const redirect = line.match(/\s(>>?)\s*(\S+)\s*$/);
    const body = redirect ? line.slice(0, redirect.index) : line;

    const stages = body.split("|").map((s) => s.trim()).filter(Boolean);
    let stdin = "";
    let result = ok();

    for (const stage of stages) {
      const tokens = tokenize(stage).map((t) => expand(state, t));
      const [name, ...args] = tokens;
      if (!name) continue;

      const command = commands[name];
      if (!command) {
        result = fail(`bash: ${name}: command not found\n`, 127);
        break;
      }
      result = command(state, args, stdin);
      stdin = result.out;
    }

    if (redirect && result.code === 0) {
      const path = resolve(state, redirect[2]);
      const { parent, name } = parentOf(path);
      const node = lookup(state, parent);
      if (node?.type !== "dir") return fail(`bash: ${redirect[2]}: No such file or directory\n`);
      const existing = node.children[name];
      const previous = redirect[1] === ">>" && existing?.type === "file" ? existing.content : "";
      node.children[name] = file(previous + result.out.replace(/<[^>]+>/g, ""));
      return { ...result, out: "" };
    }

    return result;
  };

  const run = (state, line) => {
    const segments = line.split(/\s*(?:&&|;)\s*/).filter(Boolean);
    let result = ok();
    const outputs = [];
    for (const segment of segments) {
      result = runSimple(state, segment);
      state.status = result.code;
      if (result.out) outputs.push(result.out);
      if (result.err) outputs.push(`<span class="err">${result.err.replace(/\n$/, "")}</span>\n`);
      if (result.code !== 0 && line.includes("&&")) break;
    }
    return outputs.join("");
  };

  /* ---------- task checking ---------- */

  const satisfied = (state, check) => {
    if (check.type === "ran") return state.history.some((h) => new RegExp(check.match).test(h));
    if (check.type === "cwd") return state.cwd === check.path.replace("~", HOME);
    if (check.type === "exists") return Boolean(lookup(state, check.path.replace("~", HOME)));
    if (check.type === "output") return state.transcript.some((t) => new RegExp(check.match).test(t));
    if (check.type === "env") return new RegExp(check.match).test(state.env[check.name] ?? "");
    return false;
  };

  /* ---------- widget ---------- */

  const initTerminal = (host) => {
    const { tasks = [], intro = "", title = "Shell", prompt = "fgantri@wsl" } = config(host);

    const state = {
      fs: freshFs(),
      cwd: HOME,
      status: 0,
      history: [],
      transcript: [],
      completed: new Set(),
      clear: false,
      env: {
        SHELL: "/bin/bash",
        USER: "fgantri",
        HOME,
        PWD: HOME,
        PATH: "/usr/local/bin:/usr/bin:/bin",
        LANG: "en_US.UTF-8",
      },
    };

    host.textContent = "";

    const screen = el("div", { className: "term-shell" });
    const input = el("input", { type: "text", spellcheck: false, autocapitalize: "off", autocomplete: "off" });
    const promptSpan = el("span", { className: "prompt" });
    const taskList = el("ul", { className: "task-list" });

    const paintPrompt = () => {
      promptSpan.textContent = `${prompt}:${pretty(state, state.cwd)}$`;
    };

    const write = (html) => {
      screen.insertAdjacentHTML("beforeend", html);
      screen.scrollTop = screen.scrollHeight;
    };

    const paintTasks = () => {
      taskList.textContent = "";
      for (const [index, task] of tasks.entries()) {
        const done = state.completed.has(index) || satisfied(state, task.check);
        if (done) state.completed.add(index);
        taskList.append(el("li", { className: done ? "done" : "" }, [
          el("span", { className: "box" }, done ? "✓" : "○"),
          el("span", {}, task.label),
        ]));
      }
    };

    const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const submit = () => {
      const line = input.value;
      input.value = "";
      write(`<span class="prompt">${escapeHtml(promptSpan.textContent)}</span> <span class="cmd">${escapeHtml(line)}</span>\n`);
      if (!line.trim()) return;

      state.history.push(line.trim());
      const output = run(state, line.trim());
      state.transcript.push(output.replace(/<[^>]+>/g, ""));

      if (state.clear) {
        state.clear = false;
        screen.textContent = "";
      } else if (output) {
        write(output);
      }

      paintPrompt();
      paintTasks();
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
        state.historyIndex = state.history.length;
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        state.historyIndex = Math.max(0, (state.historyIndex ?? state.history.length) - 1);
        input.value = state.history[state.historyIndex] ?? "";
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        state.historyIndex = Math.min(state.history.length, (state.historyIndex ?? 0) + 1);
        input.value = state.history[state.historyIndex] ?? "";
      } else if (event.key === "l" && event.ctrlKey) {
        event.preventDefault();
        screen.textContent = "";
      }
    });

    screen.addEventListener("click", () => input.focus());

    const reset = el("button", { type: "button" }, "Reset");
    reset.addEventListener("click", () => {
      Object.assign(state, { fs: freshFs(), cwd: HOME, status: 0, history: [], transcript: [], completed: new Set() });
      state.env.PWD = HOME;
      screen.textContent = "";
      write(`<span class="dim">${escapeHtml(intro)}</span>\n`);
      paintPrompt();
      paintTasks();
      input.focus();
    });

    host.append(
      el("div", { className: "widget-title" }, [title, reset]),
      screen,
      el("div", { className: "term-line" }, [promptSpan, input]),
    );

    if (tasks.length) {
      host.append(el("h4", {}, "Do these"), taskList);
    }

    if (intro) write(`<span class="dim">${escapeHtml(intro)}</span>\n`);
    paintPrompt();
    paintTasks();
  };

  const boot = () => document.querySelectorAll("[data-terminal]").forEach(initTerminal);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
