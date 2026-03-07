# juggling-tools

Core library for computing siteswap juggling patterns. Given a number of props and a maximum throw height, it generates every valid juggling state and the legal throws between them.

## How it works

Each juggling state is a bitmask where set bits represent future beats when a prop will land. The library enumerates all valid states for a `(num_props, max_height)` pair using Gosper's hack, then computes every legal transition between them to build a directed graph.

## Installation

```toml
[dependencies]
juggling-tools = "0.1"
```

## Usage

```rust
use juggling_tools::state_notation::{Params, compute_graph, compute_table, State};

// Build a state transition graph
let graph = compute_graph(&Params { num_props: 3, max_height: 5 })?;
// graph.states: all valid states
// graph.edges: every legal transition
// graph.ground_state: the "rest" state (e.g. 0b00111 for 3 props)

// Or as a matrix
let table = compute_table(&Params { num_props: 3, max_height: 5 })?;
let throw_height = table.cell(0, 1); // Option<u8>

// Generate states directly
let states = State::generate(3, 5); // C(5,3) = 10 states
```

## Output formats

| Function | Returns | Use case |
| --- | --- | --- |
| `compute_graph` | `StateGraph` (edge list) | Graph visualization |
| `compute_table` | `StateTable` (flat N x N matrix) | Tabular display, lookups |
| `compute_transitions` | `TransitionSet` (states + transitions) | Full enumeration |
| `compute_throws` | `Vec<Throw>` | Throws from a single state |

## Features

| Feature | Effect |
| --- | --- |
| `serde` | Adds `Serialize`/`Deserialize` to all public types |
| `rayon` | Parallelizes state and transition computation |
| `state-u8`, `state-u16`, `state-u64`, `state-u128` | Changes the backing integer for state bitmasks (default: `u32`) |

The state type controls the maximum throw height. `u32` supports up to height 32, which covers the vast majority of real juggling patterns.

## Key types

- **`State`** - Bitmask representing a juggling state. Provides display formatting, prop-at-position queries, and combinatorial ranking.
- **`Transition`** / **`TransitionIter`** - A throw from one state to another. The iterator yields all valid transitions from a given state without allocating.
- **`Params`** / **`ParamsError`** - Validated input parameters.
- **`StateGraph`** - States, edges, and ground state.
- **`StateTable`** - States and a flat matrix of throw heights (`NO_TRANSITION` for missing edges).

## License

[MIT](../../LICENSE)
