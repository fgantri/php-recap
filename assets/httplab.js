/* Raw HTTP request composer and parser.

   Lets the learner assemble a request byte by byte, then shows both the wire
   format and the superglobals PHP would derive from it.

     <div class="widget" data-httplab></div>
*/

(() => {
  const { el } = window.Bootcamp;

  const STATUSES = {
    200: ["OK", "ok", "The request succeeded and a body follows."],
    201: ["Created", "ok", "A new resource exists. Its URL belongs in a Location header."],
    204: ["No Content", "ok", "Succeeded, and deliberately has no body. Common for DELETE."],
    301: ["Moved Permanently", "warn", "Change your links. Browsers and search engines cache this hard — hard enough that a wrong 301 is genuinely difficult to undo."],
    302: ["Found", "warn", "Temporary redirect. What most post-form redirects should use."],
    304: ["Not Modified", "warn", "Your cached copy is still good. No body is sent — this is how caching pays for itself."],
    400: ["Bad Request", "bad", "The request was malformed. The client cannot fix it by authenticating."],
    401: ["Unauthorized", "bad", "Misnamed: it means *unauthenticated*. We do not know who you are."],
    403: ["Forbidden", "bad", "We know who you are, and you still may not. Authorization, not authentication."],
    404: ["Not Found", "bad", "No resource at this path. Also the honest answer when revealing existence would leak information."],
    405: ["Method Not Allowed", "bad", "The path exists; this verb is not permitted on it. Must include an Allow header."],
    418: ["I'm a teapot", "warn", "An April Fools' RFC from 1998 that never died. Genuinely in the registry."],
    422: ["Unprocessable Content", "bad", "Syntactically fine, semantically invalid — the usual code for validation failure."],
    429: ["Too Many Requests", "bad", "Rate limited. Should carry Retry-After."],
    500: ["Internal Server Error", "bad", "We broke. The client did nothing wrong and retrying may work."],
    502: ["Bad Gateway", "bad", "A proxy got a nonsense answer from upstream. Classic nginx-cannot-reach-PHP-FPM."],
    503: ["Service Unavailable", "bad", "Temporarily down or overloaded. Should carry Retry-After."],
    504: ["Gateway Timeout", "bad", "A proxy waited for upstream and gave up. Your PHP is too slow, or hung."],
  };

  const initHttpLab = (host) => {
    const state = {
      method: "GET",
      path: "/notes",
      query: "id=17&sort=desc",
      host: "localhost:8888",
      headers: [
        ["User-Agent", "Mozilla/5.0"],
        ["Accept", "text/html"],
      ],
      body: "",
      status: 200,
    };

    const wire = el("div", {});
    const derived = el("div", {});
    const statusBox = el("div", {});

    const rawRequest = () => {
      const target = state.query ? `${state.path}?${state.query}` : state.path;
      const lines = [`${state.method} ${target} HTTP/1.1`, `Host: ${state.host}`];
      for (const [name, value] of state.headers) lines.push(`${name}: ${value}`);
      if (state.body) {
        lines.push(`Content-Type: application/x-www-form-urlencoded`);
        lines.push(`Content-Length: ${state.body.length}`);
      }
      return lines.join("\r\n") + "\r\n\r\n" + state.body;
    };

    const parseQuery = (query) =>
      query.split("&").filter(Boolean).map((pair) => {
        const index = pair.indexOf("=");
        return index < 0 ? [pair, ""] : [pair.slice(0, index), pair.slice(index + 1)];
      });

    const paint = () => {
      const raw = rawRequest();
      const bytes = new TextEncoder().encode(raw).length;

      wire.innerHTML =
        `<h4 style="margin-top:0">What travels down the socket</h4>` +
        `<div class="term-shell" style="height:auto;max-height:13rem">` +
        raw
          .replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .split("\r\n")
          .map((line, index) =>
            line === ""
              ? `<span class="dim">⏎          ← blank line: headers end, body begins</span>`
              : index === 0
                ? `<span class="ok">${line}</span><span class="dim">  ← request line</span>`
                : `<span class="cmd">${line}</span>`)
          .join("\n") +
        `</div>` +
        `<div style="font-size:0.75rem;color:var(--ink-faint);margin-top:0.35rem">` +
        `${bytes} bytes · every line ends CR LF (<code>\\r\\n</code>), never bare <code>\\n</code></div>`;

      const params = parseQuery(state.query);
      const posted = state.method === "POST" ? parseQuery(state.body) : [];

      const rows = (pairs) => pairs.length
        ? pairs.map(([k, v]) => `<tr><td><code>'${k}'</code></td><td><code>'${v}'</code></td></tr>`).join("")
        : `<tr><td colspan="2" style="color:var(--ink-faint)">empty</td></tr>`;

      derived.innerHTML =
        `<h4>What PHP hands your code</h4>` +
        `<div class="table-scroll" style="max-width:none;margin:0.4rem 0">
          <table style="margin:0">
            <thead><tr><th colspan="2"><code>$_SERVER</code> — the request, flattened</th></tr></thead>
            <tbody>
              <tr><td><code>'REQUEST_METHOD'</code></td><td><code>'${state.method}'</code></td></tr>
              <tr><td><code>'REQUEST_URI'</code></td><td><code>'${state.query ? state.path + "?" + state.query : state.path}'</code></td></tr>
              <tr><td><code>'QUERY_STRING'</code></td><td><code>'${state.query}'</code></td></tr>
              <tr><td><code>'HTTP_HOST'</code></td><td><code>'${state.host}'</code></td></tr>
              ${state.headers.map(([n, v]) =>
                `<tr><td><code>'HTTP_${n.toUpperCase().replace(/-/g, "_")}'</code></td><td><code>'${v}'</code></td></tr>`).join("")}
            </tbody>
          </table>
        </div>
        <div style="display:grid;gap:0.7rem;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))">
          <div class="table-scroll" style="max-width:none;margin:0">
            <table style="margin:0"><thead><tr><th colspan="2"><code>$_GET</code></th></tr></thead><tbody>${rows(params)}</tbody></table>
          </div>
          <div class="table-scroll" style="max-width:none;margin:0">
            <table style="margin:0"><thead><tr><th colspan="2"><code>$_POST</code></th></tr></thead><tbody>${rows(posted)}</tbody></table>
          </div>
        </div>
        <p style="font-size:0.76rem;color:var(--ink-faint);margin:0.6rem 0 0">
          Every header becomes <code>HTTP_</code> + the name uppercased with dashes turned to underscores.
          That mangling is a CGI convention from 1993 that PHP still follows exactly.</p>`;

      const [label, kind, note] = STATUSES[state.status];
      const colour = kind === "ok" ? "var(--ok)" : kind === "warn" ? "var(--warn)" : "var(--bad)";
      statusBox.innerHTML =
        `<h4>The response status you choose</h4>
         <div style="font-family:var(--mono);font-size:1.15rem;color:${colour}">HTTP/1.1 ${state.status} ${label}</div>
         <p style="font-size:0.82rem;line-height:1.5;color:var(--ink-soft);margin:0.4rem 0 0">${note}</p>`;
    };

    /* ---------- controls ---------- */

    const field = (label, key, options) => {
      const wrapper = el("label", { style: "display:block;font-size:0.72rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-faint)" }, label);
      const control = options
        ? el("select", {}, options.map((value) => el("option", { value, selected: state[key] === value }, value)))
        : el("input", { type: "text", value: state[key] });
      control.style.marginTop = "0.2rem";
      control.addEventListener("input", () => { state[key] = control.value; paint(); });
      control.addEventListener("change", () => { state[key] = control.value; paint(); });
      wrapper.append(control);
      return wrapper;
    };

    const statusSelect = el("select", {}, Object.keys(STATUSES).map((code) =>
      el("option", { value: code, selected: Number(code) === state.status }, `${code} ${STATUSES[code][0]}`)));
    statusSelect.addEventListener("change", () => { state.status = Number(statusSelect.value); paint(); });

    const methodField = field("Method", "method", ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
    methodField.querySelector("select").addEventListener("change", () => {
      state.body = state.method === "POST" ? "title=Hello&body=First+note" : "";
      paint();
    });

    host.textContent = "";
    host.append(
      el("div", { className: "widget-title" }, "HTTP by hand"),
      el("div", { style: "display:grid;gap:0.6rem;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr));margin-bottom:1rem" }, [
        methodField,
        field("Path", "path"),
        field("Query string", "query"),
        field("Host", "host"),
      ]),
      wire,
      el("div", { style: "margin-top:1.1rem" }, [derived]),
      el("div", { style: "margin-top:1.1rem" }, [
        statusBox,
        el("div", { style: "margin-top:0.5rem" }, [statusSelect]),
      ]),
    );

    paint();
  };

  const boot = () => document.querySelectorAll("[data-httplab]").forEach(initHttpLab);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
