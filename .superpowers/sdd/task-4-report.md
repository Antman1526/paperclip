# Task 4 report

## Changed files

- `tools/mission-control/package.json` — added Node 20 engine declaration and `start`, deterministic `test`, and browser smoke scripts.
- `tools/mission-control/test/browser-smoke.mjs` — added a local non-secret fixture server, loopback sidecar launch, and Playwright assertions for the four visible zones, legal masthead, read-only label, one healthy lane, one approval card, and one source link.
- `tools/mission-control/README.md` — documented runtime-only environment configuration, loopback startup, focused proof, and read-only/safety boundaries.

## Commit

`2629080bf docs(mission-control): document local operation and proof`

## Focused verification

- `npm --prefix tools/mission-control test` — PASS (17 tests, 17 passed).
- `npm --prefix tools/mission-control run smoke:browser` — PASS (four zones, masthead, read-only label, healthy lane, approval card, source link).
- `git diff --check -- tools/mission-control` — PASS (no whitespace errors).
- Scoped status confirmed the commit changed only the three requested `tools/mission-control/**` files; unrelated pre-existing work remains untouched.

## Concerns

- `NOT RUN — GLOBAL MINIMAL-TEST POLICY`: broad repository suites, build, deployment, publishing, and live Paperclip verification were intentionally omitted.
- The smoke uses a deterministic local fixture and does not validate credentials or a live control-plane connection.

## Follow-up fix

- `tools/mission-control/test/browser-smoke.mjs` — replaced the positional `.zone` count check with explicit accessible-name assertions for the four `main section[aria-labelledby]` landmarks: Company overview, Agent graph, Decision rail, and Operations timeline.

## Follow-up verification

- `npm --prefix tools/mission-control test` — PASS.
- `npm --prefix tools/mission-control run smoke:browser` — PASS.
- `git diff --check -- tools/mission-control` — PASS.

## Selector scope fix

- `tools/mission-control/test/browser-smoke.mjs` — scoped landmark locators to `main section[aria-labelledby]`, asserted exactly four matching sections, and intersected each accessible-name role locator with that scope for Company overview, Agent graph, Decision rail, and Operations timeline.
