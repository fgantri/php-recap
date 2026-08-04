/* Shared lesson widgets: theme, progress, quiz, recall, reveal, tabs.
   Widgets are declared in HTML and configured with an embedded JSON script tag:

     <div class="widget" data-quiz>
       <script type="application/json">{ "questions": [...] }</script>
     </div>
*/

const STORE = "lowlevel-web-bootcamp";

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch {
    return {};
  }
};

const writeStore = (patch) => {
  const next = { ...readStore(), ...patch };
  try {
    localStorage.setItem(STORE, JSON.stringify(next));
  } catch {
    /* private mode — progress simply won't persist */
  }
  return next;
};

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) {
    node.append(child?.nodeType ? child : document.createTextNode(child));
  }
  return node;
};

const config = (host) => {
  const tag = host.querySelector('script[type="application/json"]');
  return tag ? JSON.parse(tag.textContent) : {};
};

const shuffle = (items, seed) => {
  const out = [...items];
  let state = seed;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/* ---------- theme ---------- */

const initTheme = () => {
  const saved = readStore().theme;
  if (saved) document.documentElement.dataset.theme = saved;

  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const paint = () => {
    const explicit = document.documentElement.dataset.theme;
    const dark = explicit
      ? explicit === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    button.textContent = dark ? "☀" : "☾";
    button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  };

  button.addEventListener("click", () => {
    const explicit = document.documentElement.dataset.theme;
    const dark = explicit
      ? explicit === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    writeStore({ theme: next });
    paint();
  });

  paint();
};

/* ---------- progress ---------- */

const initProgress = () => {
  const button = document.querySelector("[data-complete]");
  if (!button) return;

  const id = button.dataset.complete;
  const done = () => Boolean(readStore().done?.[id]);

  const paint = () => {
    button.textContent = done() ? "✓ Marked complete" : "Mark this lesson complete";
    button.classList.toggle("primary", !done());
  };

  button.addEventListener("click", () => {
    const map = { ...(readStore().done || {}) };
    if (map[id]) delete map[id];
    else map[id] = new Date().toISOString();
    writeStore({ done: map });
    paint();
  });

  paint();
};

/* ---------- quiz ---------- */

const initQuiz = (host) => {
  const { questions = [], title = "Check yourself" } = config(host);
  const seed = [...(host.dataset.seed || title)].reduce((a, c) => a + c.charCodeAt(0), 7);

  host.textContent = "";
  host.append(el("div", { className: "widget-title" }, [
    title,
    el("span", { style: "font-weight:400;letter-spacing:0;text-transform:none;color:var(--ink-faint)" },
      `${questions.length} question${questions.length === 1 ? "" : "s"}`),
  ]));

  const state = { answered: 0, right: 0 };

  const score = el("div", { className: "quiz-score" }, [
    el("span", { className: "tally" }, `0 of ${questions.length} answered`),
  ]);

  questions.forEach((q, index) => {
    host.append(el("div", { className: "quiz-q" }, `${index + 1}. ${q.q}`));

    const options = el("div", { className: "quiz-opts" });
    const why = el("p", { className: "quiz-why", hidden: true });

    const ordered = q.shuffle === false
      ? q.options.map((text, i) => ({ text, i }))
      : shuffle(q.options.map((text, i) => ({ text, i })), seed + index * 31);

    const buttons = ordered.map(({ text, i }) => {
      const button = el("button", { className: "quiz-opt", type: "button" }, [
        el("span", { className: "tick" }, "○"),
        el("span", {}, text),
      ]);

      button.addEventListener("click", () => {
        if (options.dataset.locked) return;
        options.dataset.locked = "1";

        const correct = i === q.answer;
        state.answered += 1;
        state.right += correct ? 1 : 0;

        buttons.forEach((other, position) => {
          const isAnswer = ordered[position].i === q.answer;
          other.disabled = true;
          if (isAnswer) {
            other.classList.add("correct");
            other.querySelector(".tick").textContent = "●";
          } else if (other === button) {
            other.classList.add("wrong");
            other.querySelector(".tick").textContent = "✕";
          } else {
            other.classList.add("muted");
          }
        });

        why.textContent = q.why;
        why.hidden = false;
        score.querySelector(".tally").textContent =
          `${state.right} of ${state.answered} correct` +
          (state.answered === questions.length ? " — all answered" : "");
      });

      return button;
    });

    options.append(...buttons);
    host.append(options, why);
  });

  host.append(score);
};

/* ---------- recall ---------- */

const initRecall = (host) => {
  const { prompt, answer, title = "Retrieval practice" } = config(host);

  host.textContent = "";
  const revealed = el("div", { className: "recall-answer", hidden: true });
  revealed.innerHTML = answer;

  const button = el("button", { type: "button", className: "primary" }, "Reveal — after you've answered out loud");
  button.addEventListener("click", () => {
    revealed.hidden = !revealed.hidden;
    button.textContent = revealed.hidden ? "Reveal — after you've answered out loud" : "Hide";
    button.classList.toggle("primary", revealed.hidden);
  });

  host.append(
    el("div", { className: "widget-title" }, title),
    el("p", { className: "recall-prompt" }, prompt),
    button,
    revealed,
  );
};

/* ---------- reveal (inline spoiler) ---------- */

const initReveal = (host) => {
  const body = host.querySelector("[data-reveal-body]");
  if (!body) return;
  body.hidden = true;

  const button = el("button", { type: "button" }, host.dataset.revealLabel || "Show answer");
  button.addEventListener("click", () => {
    body.hidden = !body.hidden;
    button.textContent = body.hidden
      ? host.dataset.revealLabel || "Show answer"
      : "Hide";
  });

  body.before(button);
};

/* ---------- boot ---------- */

const boot = () => {
  initTheme();
  initProgress();
  document.querySelectorAll("[data-quiz]").forEach(initQuiz);
  document.querySelectorAll("[data-recall]").forEach(initRecall);
  document.querySelectorAll("[data-reveal]").forEach(initReveal);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

window.Bootcamp = { el, config, readStore, writeStore, shuffle };
