import test from "node:test";
import assert from "node:assert/strict";
import { classifyAction } from "../src/policy.mjs";

test("classifies protected action categories and drops unknown categories", () => {
  assert.deepEqual(classifyAction({ categories: ["money", "future_category", "credentials"] }), {
    protected: true,
    categories: ["money", "credentials"],
  });
});

test("classifies actions without protected categories as unprotected", () => {
  assert.deepEqual(classifyAction({ categories: ["read_only"] }), { protected: false, categories: [] });
});
