export function normalizeCompanyState({
  company,
  dashboard,
  agents = [],
  routines = [],
  issues = [],
  approvals = [],
  now = new Date(),
}) {
  const knownAgents = agents.map((agent) => ({
    id: agent.id,
    name: agent.name ?? "Unknown agent",
    model: agent.adapterConfig?.model ?? agent.model ?? "Unknown",
    status: agent.status ?? "unknown",
    health: agent.health ?? "unknown",
    link: `/agents/${agent.id}`,
  }));

  return {
    company: {
      id: company?.id ?? null,
      name: company?.name ?? "BrainPulse Ventures LLC",
    },
    heartbeat: dashboard?.heartbeat ?? "unknown",
    agents: knownAgents,
    routines: routines.map((routine) => ({
      id: routine.id,
      title: routine.title,
      status: routine.status ?? "unknown",
      triggers: routine.triggers ?? [],
      link: `/routines/${routine.id}`,
    })),
    decisions: approvals.map((approval) => ({
      id: approval.id,
      title: approval.title ?? "Approval required",
      status: approval.status ?? "unknown",
      protected: Boolean(approval.protected),
      link: `/approvals/${approval.id}`,
    })),
    timeline: issues.slice(0, 20).map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      status: issue.status ?? "unknown",
      link: `/issues/${issue.identifier ?? issue.id}`,
    })),
    generatedAt: now.toISOString(),
  };
}

export function deriveLaneStatus(agent, healthByAgentId = {}) {
  return healthByAgentId[agent.id] ?? agent.health ?? "unknown";
}
