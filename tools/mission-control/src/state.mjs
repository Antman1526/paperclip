const UNKNOWN = "Unknown";
const LANE_STATUSES = new Set(["healthy", "attention", "blocked", "unknown"]);

function valueOrUnknown(value) {
  if (value === null || value === undefined || value === "") return UNKNOWN;
  return ["string", "number", "boolean"].includes(typeof value) ? value : UNKNOWN;
}

function sourceLink(path, identifier) {
  const normalizedIdentifier = valueOrUnknown(identifier);
  return normalizedIdentifier === UNKNOWN
    ? UNKNOWN
    : `/${path}/${normalizedIdentifier}`;
}

function summarizeTrigger(trigger) {
  const source = trigger && typeof trigger === "object" ? trigger : {};
  return {
    id: valueOrUnknown(source.id),
    type: valueOrUnknown(source.type ?? source.kind),
    status: valueOrUnknown(source.status),
  };
}

export function normalizeCompanyState({
  company,
  dashboard,
  agents = [],
  routines = [],
  issues = [],
  approvals = [],
  now = new Date(),
}) {
  const knownAgents = (Array.isArray(agents) ? agents : []).map((agent = {}) => ({
    id: valueOrUnknown(agent.id),
    name: valueOrUnknown(agent.name),
    model: valueOrUnknown(agent.adapterConfig?.model ?? agent.model),
    status: valueOrUnknown(agent.status),
    health: valueOrUnknown(agent.health),
    link: sourceLink("agents", agent.id),
  }));

  return {
    company: {
      id: valueOrUnknown(company?.id),
      name: valueOrUnknown(company?.name),
    },
    heartbeat: valueOrUnknown(dashboard?.heartbeat),
    agents: knownAgents,
    routines: (Array.isArray(routines) ? routines : []).map((routine = {}) => ({
      id: valueOrUnknown(routine.id),
      title: valueOrUnknown(routine.title),
      status: valueOrUnknown(routine.status),
      triggers: Array.isArray(routine.triggers) ? routine.triggers.map(summarizeTrigger) : [],
      link: sourceLink("routines", routine.id),
    })),
    decisions: (Array.isArray(approvals) ? approvals : []).map((approval = {}) => ({
      id: valueOrUnknown(approval.id),
      title: valueOrUnknown(approval.title),
      status: valueOrUnknown(approval.status),
      protected: typeof approval.protected === "boolean" ? approval.protected : UNKNOWN,
      link: sourceLink("approvals", approval.id),
    })),
    timeline: (Array.isArray(issues) ? issues : []).slice(0, 20).map((issue = {}) => ({
      id: valueOrUnknown(issue.id),
      identifier: valueOrUnknown(issue.identifier),
      title: valueOrUnknown(issue.title),
      status: valueOrUnknown(issue.status),
      link: sourceLink("issues", issue.identifier ?? issue.id),
    })),
    generatedAt: now.toISOString(),
  };
}

export function deriveLaneStatus(agent, healthByAgentId = {}) {
  const upstreamHealth = healthByAgentId?.[agent?.id];
  if (upstreamHealth !== null && upstreamHealth !== undefined) {
    return LANE_STATUSES.has(upstreamHealth) ? upstreamHealth : "unknown";
  }
  return LANE_STATUSES.has(agent?.health) ? agent.health : "unknown";
}
