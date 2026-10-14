import assert from "node:assert/strict";
import test from "node:test";
import { consumeRateLimit } from "../lib/rate-limit.ts";

test("allows up to the configured limit and blocks the next request", () => {
  const key = "limit-test";
  const first = consumeRateLimit(key, 2, 1_000, 10_000);
  const second = consumeRateLimit(key, 2, 1_000, 10_100);
  const third = consumeRateLimit(key, 2, 1_000, 10_200);

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);
  assert.equal(third.allowed, false);
});

test("resets an expired client window", () => {
  const key = "reset-test";
  consumeRateLimit(key, 1, 1_000, 10_000);
  const afterReset = consumeRateLimit(key, 1, 1_000, 11_000);
  assert.equal(afterReset.allowed, true);
  assert.equal(afterReset.remaining, 0);
});
