/* An interactive accept-loop simulator.

   Shows the listening socket, the kernel backlog, and N worker processes,
   so the cost of blocking I/O becomes visible rather than theoretical.

     <div class="widget" data-serverloop>
       <script type="application/json">{ "workers": 1, "backlog": 5 }</script>
     </div>
*/

(() => {
  const { el, config } = window.Bootcamp;

  const SYSCALLS = [
    ["socket()", "ask the kernel for an endpoint — get back a file descriptor"],
    ["bind()", "claim a port on an address; fails if something already holds it"],
    ["listen()", "tell the kernel to start queueing incoming connections"],
    ["accept()", "block until a connection is waiting, then take it off the queue"],
    ["read()", "pull the request bytes out of the connection"],
    ["write()", "push the response bytes back"],
    ["close()", "release the connection; loop back to accept()"],
  ];

  const initServerLoop = (host) => {
    const settings = config(host);

    const state = {
      workers: settings.workers ?? 1,
      backlogLimit: settings.backlog ?? 6,
      phase: 0,
      tick: 0,
      nextId: 1,
      backlog: [],
      slots: [],
      done: [],
      refused: 0,
      log: [],
    };

    const resetSlots = () => {
      state.slots = Array.from({ length: state.workers }, () => null);
    };
    resetSlots();

    const say = (text, kind = "") => {
      state.log.unshift({ text: `t=${String(state.tick).padStart(2)}  ${text}`, kind });
      state.log = state.log.slice(0, 9);
    };

    const listening = () => state.phase >= 3;

    const addClient = (cost) => {
      if (!listening()) {
        state.refused += 1;
        say(`connection refused — nothing is listening yet`, "err");
        return;
      }
      if (state.backlog.length >= state.backlogLimit) {
        state.refused += 1;
        say(`backlog full (${state.backlogLimit}) — kernel drops the connection`, "err");
        return;
      }
      state.backlog.push({ id: state.nextId, cost, left: cost });
      say(`client #${state.nextId} arrived → kernel backlog`, "");
      state.nextId += 1;
    };

    const step = () => {
      if (state.phase < 3) {
        say(`${SYSCALLS[state.phase][0]} — ${SYSCALLS[state.phase][1]}`, "ok");
        state.phase += 1;
        return;
      }

      state.tick += 1;

      state.slots.forEach((client, index) => {
        if (!client) return;
        client.left -= 1;
        if (client.left <= 0) {
          say(`worker ${index + 1}: write() + close() — client #${client.id} served`, "ok");
          state.done.push(client);
          state.slots[index] = null;
        }
      });

      state.slots.forEach((client, index) => {
        if (client || !state.backlog.length) return;
        const next = state.backlog.shift();
        state.slots[index] = next;
        say(`worker ${index + 1}: accept() returned client #${next.id}, read() ${next.cost} ticks of work`, "");
      });

      if (!state.backlog.length && state.slots.every((s) => !s)) {
        say(`every worker is blocked in accept() — idle, waiting`, "dim");
      }
    };

    /* ---------- rendering ---------- */

    const board = el("div", {});
    const logBox = el("div", {});

    const paint = () => {
      const slotHtml = state.slots.map((client, index) => {
        const busy = Boolean(client);
        return `<div style="border:1px solid ${busy ? "var(--accent)" : "var(--rule)"};border-radius:3px;
            padding:0.45rem 0.6rem;background:${busy ? "var(--warn-bg)" : "var(--paper)"};min-width:7.5rem">
          <div style="font-family:var(--sans);font-size:0.66rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-faint)">worker ${index + 1}</div>
          <div style="font-family:var(--mono);font-size:0.8rem;margin-top:0.15rem">${
            busy ? `#${client.id} · ${client.left} left` : `<span style="color:var(--ink-faint)">blocked in<br>accept()</span>`
          }</div>
        </div>`;
      }).join("");

      const backlogHtml = state.backlog.length
        ? state.backlog.map((c) => `<span style="font-family:var(--mono);font-size:0.75rem;border:1px solid var(--rule);
            border-radius:2px;padding:0.1rem 0.35rem;background:var(--paper)">#${c.id}</span>`).join(" ")
        : `<span style="color:var(--ink-faint);font-size:0.78rem">empty</span>`;

      const phaseHtml = SYSCALLS.slice(0, 4).map(([name], index) => {
        const reached = state.phase > index;
        return `<span style="font-family:var(--mono);font-size:0.74rem;padding:0.12rem 0.4rem;border-radius:2px;
          ${reached ? "background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok)" : "border:1px solid var(--rule);color:var(--ink-faint)"}">${name}</span>`;
      }).join(" ");

      board.innerHTML = `
        <div style="margin-bottom:0.8rem">${phaseHtml}</div>
        <div style="display:grid;gap:0.6rem;grid-template-columns:1fr;margin-bottom:0.8rem">
          <div style="border:1px dashed var(--rule);border-radius:3px;padding:0.5rem 0.7rem">
            <div style="font-family:var(--sans);font-size:0.66rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:0.3rem">
              kernel backlog — connections accepted by the OS but not yet by your code
              <span style="float:right">${state.backlog.length}/${state.backlogLimit}</span>
            </div>
            <div>${backlogHtml}</div>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.8rem">${slotHtml}</div>
        <div style="font-family:var(--sans);font-size:0.76rem;color:var(--ink-soft);display:flex;gap:1.2rem;flex-wrap:wrap">
          <span>served <strong style="color:var(--ok)">${state.done.length}</strong></span>
          <span>waiting <strong>${state.backlog.length}</strong></span>
          <span>refused <strong style="color:${state.refused ? "var(--bad)" : "inherit"}">${state.refused}</strong></span>
          <span>tick <strong>${state.tick}</strong></span>
        </div>`;

      logBox.innerHTML = `<div class="term-shell" style="height:10.5rem">${
        state.log.length
          ? state.log.map((entry) => {
              const colour = entry.kind === "err" ? "err" : entry.kind === "ok" ? "ok" : entry.kind === "dim" ? "dim" : "";
              return `<div class="${colour}">${entry.text}</div>`;
            }).join("")
          : `<span class="dim">Press "Run one syscall" to boot the server.</span>`
      }</div>`;
    };

    /* ---------- controls ---------- */

    const button = (label, handler, primary = false) => {
      const node = el("button", { type: "button", className: primary ? "primary" : "" }, label);
      node.addEventListener("click", () => { handler(); paint(); });
      return node;
    };

    const workerSelect = el("select", { style: "width:auto;font-family:var(--sans);font-size:0.78rem" });
    for (const count of [1, 2, 4]) {
      workerSelect.append(el("option", { value: String(count), selected: count === state.workers },
        `${count} worker${count === 1 ? "" : "s"}`));
    }
    workerSelect.addEventListener("change", () => {
      state.workers = Number(workerSelect.value);
      state.backlog.push(...state.slots.filter(Boolean));
      resetSlots();
      say(`pool resized to ${state.workers} worker${state.workers === 1 ? "" : "s"}`, "dim");
      paint();
    });

    const reset = () => {
      Object.assign(state, {
        phase: 0, tick: 0, nextId: 1, backlog: [], done: [], refused: 0, log: [],
      });
      resetSlots();
    };

    host.textContent = "";
    host.append(
      el("div", { className: "widget-title" }, "The accept loop"),
      board,
      logBox,
      el("div", {
        className: "controls",
        style: "display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center;margin-top:0.8rem",
      }, [
        button("Run one syscall ▸", step, true),
        button("+ fast client", () => addClient(1)),
        button("+ slow client (4 ticks)", () => addClient(4)),
        button("+ 6 at once", () => { for (let i = 0; i < 6; i++) addClient(1); }),
        workerSelect,
        button("Reset", reset),
      ]),
    );

    paint();
  };

  const boot = () => document.querySelectorAll("[data-serverloop]").forEach(initServerLoop);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
