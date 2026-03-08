# Rust Conventions (Engine)

- **Write idiomatic Rust** — iterator chains over imperative loops, `Option`/`Result` combinators, clean module import paths (`crate::` re-exports over `super::super::`), appropriate ownership/borrowing.
- **Doc comments for library consumers** — describe what a type or function _is_ and _does_, not who calls it. Avoid coupling docs to specific internal callers (e.g. "used by X and Y"). Keep them useful to any consumer of the public API.
