import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCompanyState, deriveLaneStatus } from "../src/state.mjs";

test("normalizes an agent graph and preserves unknown upstream state", () => {
  const state = normalizeCompanyState({
    company: { id: "c1", name: "BrainPulse Ventures LLC" },
    agents: [{ id: "a1", name: "Summarizer", status: "idle" }],
    routines: [{ id: "r1", title: "Daily brief", status: "active", triggers: [] }],
    issues: [],
    approvals: [],
    dashboard: null,
    now: new Date("2026-08-31T15:00:00Z"),
  });
  assert.equal(state.company.name, "BrainPulse Ventures LLC");
  assert.equal(state.agents[0].health, "unknown");
  assert.equal(state.routines[0].status, "active");
});

test("derives lane status from health override then agent health", () => {
  assert.equal(deriveLaneStatus({ id: "a1", health: "attention" }, { a1: "healthy" }), "healthy");
  assert.equal(deriveLaneStatus({ id: "a1", health: "blocked" }), "blocked");
  assert.equal(deriveLaneStatus({ id: "a1" }), "unknown");
});
