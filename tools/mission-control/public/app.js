const UNKNOWN = "Unknown";
const POLL_INTERVAL_MS = 15_000;

const emptyState = {
  company: { id: UNKNOWN, name: UNKNOWN },
  heartbeat: UNKNOWN,
  agents: [],
  routines: [],
  decisions: [],
  timeline: [],
  generatedAt: UNKNOWN,
};

let lastState = null;
let lastTimestamp = UNKNOWN;
let pollInFlight = false;

function safeState(state) {
  return state && typeof state === "object" ? state : emptyState;
}

function display(value) {
  if (value === null || value === undefined || value === "") return UNKNOWN;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return UNKNOWN;
}

function escapeHtml(value) {
  return display(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function status(value) {
  const normalized = display(value).toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  return ["healthy", "attention", "blocked", "active", "running", "idle", "paused", "pending", "completed", "unknown"].includes(normalized)
    ? normalized
    : "unknown";
}

function statusBadge(value) {
  const label = display(value);
  return `<span class="status-badge status-${status(value)}"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(label)}</span>`;
}

function sourceLink(link, label = link) {
  const source = display(link);
  if (source === UNKNOWN) return `<span class="source-link source-unknown">Source: ${UNKNOWN}</span>`;
  const base = paperclipBaseUrl();
  let href;
  try {
    href = new URL(source, base).href;
  } catch {
    href = source;
  }
  return `<a class="source-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label ?? source)} <span aria-hidden="true">↗</span></a>`;
}

function paperclipBaseUrl() {
  const configured = globalThis.PAPERCLIP_BASE_URL
    || (typeof document !== "undefined" ? document.documentElement?.dataset?.paperclipBaseUrl : null)
    || "/";
  try {
    return new URL(configured, globalThis.location?.href || "http://localhost/").href;
  } catch {
    return "/";
  }
}

function count(value) {
  return Array.isArray(value) ? String(value.length) : UNKNOWN;
}

function formatTimestamp(value) {
  const raw = display(value);
  if (raw === UNKNOWN) return UNKNOWN;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function card(label, value, detail = "") {
  return `<div class="metric-card"><span class="metric-label">${escapeHtml(label)}</span><strong class="metric-value">${escapeHtml(value)}</strong>${detail ? `<span class="metric-detail">${detail}</span>` : ""}</div>`;
}

export function renderHeader(state) {
  const current = safeState(state);
  const company = current.company && typeof current.company === "object" ? current.company : {};
  const generatedAt = display(current.generatedAt);
  if (generatedAt !== UNKNOWN) lastTimestamp = generatedAt;
  return `<div class="header-layout">
    <div class="company-identity">
      <span class="company-kicker">Company</span>
      <h3>${escapeHtml(company.name)}</h3>
      <code>${escapeHtml(company.id)}</code>
    </div>
    <div class="metrics" aria-label="Company metrics">
      ${card("Heartbeat", formatTimestamp(current.heartbeat), `<span class="metric-machine">${escapeHtml(display(current.heartbeat))}</span>`)}
      ${card("Agents", count(current.agents))}
      ${card("Routines", count(current.routines))}
      ${card("Decisions", count(current.decisions))}
    </div>
  </div>`;
}

function agentCard(agent, center = false) {
  const current = agent && typeof agent === "object" ? agent : {};
  const label = center ? "Chief of Staff" : "Lane node";
  const health = display(current.health);
  return `<article class="agent-card ${center ? "agent-center" : "agent-lane"}">
    <div class="agent-card-top"><span class="node-label">${label}</span>${statusBadge(health)}</div>
    <h3>${escapeHtml(current.name)}</h3>
    <p class="agent-model">${escapeHtml(current.model)}</p>
    <dl class="agent-facts"><div><dt>Run state</dt><dd>${escapeHtml(current.status)}</dd></div><div><dt>Health</dt><dd>${escapeHtml(health)}</dd></div></dl>
    ${sourceLink(current.link, "Open agent")}
  </article>`;
}

export function renderGraph(state) {
  const current = safeState(state);
  const agents = Array.isArray(current.agents) ? current.agents : [];
  const centerIndex = agents.findIndex((agent) => /chief\s+of\s+staff|ceo/i.test(display(agent?.name)));
  const resolvedCenterIndex = centerIndex >= 0 ? centerIndex : agents.length ? 0 : -1;
  const center = resolvedCenterIndex >= 0 ? agents[resolvedCenterIndex] : {};
  const lanes = agents.filter((_, index) => index !== resolvedCenterIndex);
  return `<div class="graph-layout">
    <div class="graph-center">${agentCard(center, true)}</div>
    <div class="activity-path" aria-hidden="true"></div>
    <div class="lane-grid" aria-label="Agent lanes">${lanes.length ? lanes.map((agent) => agentCard(agent)).join("") : `<div class="empty-card">${escapeHtml(agents.length ? UNKNOWN : "Unknown")}</div>`}</div>
  </div>`;
}

function protectedBoundary(value) {
  const label = value === true ? "Protected boundary" : value === false ? "Standard decision" : UNKNOWN;
  const tone = value === true ? "blocked" : value === false ? "healthy" : "unknown";
  return `<div class="boundary boundary-${tone}"><span class="boundary-icon" aria-hidden="true">${value === true ? "!" : "•"}</span><span>${escapeHtml(label)}</span></div>`;
}

export function renderDecisionRail(state) {
  const current = safeState(state);
  const decisions = Array.isArray(current.decisions) ? current.decisions : [];
  return `<div class="decision-list">${decisions.length ? decisions.map((decision) => {
    const item = decision && typeof decision === "object" ? decision : {};
    return `<article class="decision-card">
      <div class="decision-top"><span class="decision-id">${escapeHtml(item.id)}</span>${statusBadge(item.status)}</div>
      <h3>${escapeHtml(item.title)}</h3>
      ${protectedBoundary(item.protected)}
      ${sourceLink(item.link, "View approval")}
    </article>`;
  }).join("") : `<article class="decision-card decision-empty"><h3>${UNKNOWN}</h3><p>No approval details are available.</p>${sourceLink(UNKNOWN)}</article>`}</div>`;
}

function timelineItem(item) {
  const current = item && typeof item === "object" ? item : {};
  return `<li class="timeline-item">
    <span class="timeline-marker" aria-hidden="true"></span>
    <div class="timeline-copy"><div class="timeline-meta"><span class="timeline-id">${escapeHtml(current.identifier)}</span>${statusBadge(current.status)}</div><h3>${escapeHtml(current.title)}</h3>${sourceLink(current.link, "Open source")}</div>
  </li>`;
}

export function renderTimeline(state) {
  const current = safeState(state);
  const routines = Array.isArray(current.routines) ? current.routines : [];
  const timeline = Array.isArray(current.timeline) ? current.timeline : [];
  const routineRows = routines.map((routine) => {
    const item = routine && typeof routine === "object" ? routine : {};
    return `<li class="routine-row"><div><span class="timeline-id">Routine</span><h3>${escapeHtml(item.title)}</h3></div><div class="routine-state">${statusBadge(item.status)}${sourceLink(item.link, "Source")}</div></li>`;
  }).join("");
  return `<div class="timeline-layout"><div><p class="subheading">Recent tasks &amp; recoveries</p>${timeline.length ? `<ol class="timeline-list">${timeline.map(timelineItem).join("")}</ol>` : `<div class="empty-card">${UNKNOWN}</div>`}</div><div><p class="subheading">Routines</p>${routineRows ? `<ul class="routine-list">${routineRows}</ul>` : `<div class="empty-card">${UNKNOWN}</div>`}</div></div>`;
}

function elements() {
  return {
    header: document.getElementById("company-header"),
    graph: document.getElementById("agent-graph"),
    decisions: document.getElementById("decision-rail"),
    timeline: document.getElementById("operations-timeline"),
    status: document.getElementById("live-status"),
  };
}

function setStale(stale) {
  document.body.classList.toggle("is-stale", stale);
  for (const element of [document.getElementById("company-header"), document.getElementById("agent-graph"), document.getElementById("decision-rail"), document.getElementById("operations-timeline")]) {
    element?.closest(".zone")?.classList.toggle("is-stale", stale);
  }
}

function renderState(state) {
  const nodes = elements();
  if (nodes.header) nodes.header.innerHTML = renderHeader(state);
  if (nodes.graph) nodes.graph.innerHTML = renderGraph(state);
  if (nodes.decisions) nodes.decisions.innerHTML = renderDecisionRail(state);
  if (nodes.timeline) nodes.timeline.innerHTML = renderTimeline(state);
}

function setStatus(message, tone = "") {
  const node = document.getElementById("live-status");
  if (!node) return;
  node.className = `live-status ${tone ? `live-status-${tone}` : ""}`.trim();
  node.textContent = message;
}

function renderUnavailable() {
  const graph = document.getElementById("agent-graph");
  if (graph) graph.innerHTML = `<div class="control-plane-error" role="alert"><span class="error-mark" aria-hidden="true">×</span><div><h3>Control plane unavailable</h3><p>Mission Control could not read the latest company state.</p></div></div>`;
  setStale(true);
  setStatus(`Control plane unavailable · Last update ${formatTimestamp(lastTimestamp)} · stale`, "error");
}

function renderUnknownData(error) {
  const graph = document.getElementById("agent-graph");
  if (graph) graph.innerHTML = `<div class="control-plane-error unknown-data" role="alert"><span class="error-mark" aria-hidden="true">?</span><div><h3>Unknown data</h3><p>The control-plane response could not be read safely.</p><button type="button" id="retry-read">Retry read</button></div></div>`;
  setStale(true);
  setStatus(`Unknown data · Last update ${formatTimestamp(lastTimestamp)} · stale`, "error");
  document.getElementById("retry-read")?.addEventListener("click", () => { void poll(); }, { once: true });
  void error;
}

async function readState() {
  const params = new URLSearchParams(globalThis.location?.search || "");
  const companyId = params.get("companyId");
  if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
  const response = await fetch(`/api/mission-control/state?companyId=${encodeURIComponent(companyId)}`, { headers: { accept: "application/json" }, cache: "no-store" });
  if (response.status === 503) throw Object.assign(new Error("CONTROL_PLANE_UNAVAILABLE"), { unavailable: true });
  if (!response.ok) throw new Error(`READ_FAILED_${response.status}`);
  return response.json();
}

async function poll() {
  if (pollInFlight) return;
  pollInFlight = true;
  try {
    const state = await readState();
    if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("MALFORMED_JSON");
    lastState = state;
    lastTimestamp = display(state.generatedAt) === UNKNOWN ? lastTimestamp : state.generatedAt;
    renderState(state);
    setStale(false);
    setStatus(`Live · Updated ${formatTimestamp(lastTimestamp)}`, "ok");
  } catch (error) {
    if (error?.unavailable) renderUnavailable();
    else renderUnknownData(error);
    if (error?.unavailable) {
      const graph = document.getElementById("agent-graph");
      if (graph) graph.innerHTML = `<div class="control-plane-error" role="alert"><span class="error-mark" aria-hidden="true">×</span><div><h3>Control plane unavailable</h3><p>Mission Control could not read the latest company state.</p></div></div>`;
    }
  } finally {
    pollInFlight = false;
  }
}

export { readState, poll };

if (typeof document !== "undefined") {
  void poll();
  globalThis.setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
}
