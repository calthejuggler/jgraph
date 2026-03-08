# Test Quality (Mandatory When Tests Change)

**If your changes include new or modified test files, you MUST review every changed test against these criteria before finishing. This applies to all languages (TypeScript, JavaScript, Rust).**

## Criteria

1. **Tests behaviour, not implementation** — Tests describe _what_ the code does from a user/caller perspective, not _how_ it does it internally. Red flags: asserting on internal state, mocking private functions, testing the order of internal calls, or tests that break when you refactor without changing behaviour.
2. **Asserts something important** — Every test must protect against a real bug or regression. If deleting the test wouldn't make you nervous, it probably shouldn't exist. Remove trivial tests (e.g. "renders without crashing" with no further assertions, "returns default value" when that's obvious from types).
3. **Doesn't test external libraries** — Don't assert that React renders a component, that Zod validates a schema, etc. Trust the library; test _your_ logic that uses it. Integration-point tests are fine when the assertion is on _your_ code's behaviour.
4. **One concept per test** — Each test should have a single reason to fail. Split tests that assert multiple unrelated things. Test names should clearly state the behaviour being verified.
5. **No snapshots unless justified** — Prefer explicit assertions. Only keep snapshots for genuinely complex output where hand-written assertions would be worse.
6. **Follows project conventions:**
   - **TS/JS:** Bun test runner, `describe`/`it` blocks, `testing-library` queries (getByRole, getByText) over test IDs for UI tests. No `eslint-disable` / `@ts-expect-error` overrides.
   - **Rust:** `#[cfg(test)] mod tests` blocks, `#[test]` functions. `assert_eq!` over `assert!(a == b)`. Plain English function names (e.g. `fn rejects_negative_num_objects()`), no `test_` prefix. No `#[allow(...)]` overrides.
7. **No AI-ish patterns** — No over-commenting, no `// Arrange / Act / Assert` markers, no unnecessary variables that just name an obvious literal.

## Process

1. Evaluate every changed/added test against all 7 criteria.
2. Fix or delete failing tests (ensure important behaviour is still covered).
3. Run the relevant test suite(s) to confirm all tests pass.
4. Repeat until a full pass produces no changes (max 3 iterations).
