use super::graph::{Params, ParamsError};
use super::state::State;
use super::transition::TransitionIter;

/// Sentinel value indicating no transition exists between two states in a [`StateTable`].
///
/// This value (255) is safe to use as a sentinel because the maximum possible throw
/// height is [`MAX_MAX_HEIGHT`](super::state::MAX_MAX_HEIGHT) (at most 128).
pub const NO_TRANSITION: u8 = u8::MAX;

/// A state transition table stored as a flat N×N matrix.
///
/// Rows are source states, columns are destination states, and cells contain the throw
/// height for that transition (or [`NO_TRANSITION`] if none exists). The matrix is stored
/// as a contiguous `Vec<u8>` indexed as `cells[from_idx * n + to_idx]`.
#[derive(Debug)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct StateTable {
    /// All valid states, in ascending numeric order matching their combinatorial rank.
    pub states: Vec<State>,
    /// Flat N×N matrix of throw heights. Use [`StateTable::cell`] for safe access.
    /// [`NO_TRANSITION`] indicates no direct transition exists.
    pub cells: Vec<u8>,
    /// The ground state (lowest bits set).
    pub ground_state: State,
    /// The number of props this table was generated for.
    pub num_props: u8,
    /// The maximum throw height this table was generated for.
    pub max_height: u8,
}

impl StateTable {
    /// Look up the throw height for a transition from state at `from_idx` to `to_idx`.
    ///
    /// Returns `Some(throw_height)` if a direct transition exists, or `None` otherwise.
    pub fn cell(&self, from_idx: usize, to_idx: usize) -> Option<u8> {
        let n = self.states.len();
        self.cells
            .get(from_idx * n + to_idx)
            .copied()
            .filter(|&v| v != NO_TRANSITION)
    }
}

/// Compute the state transition table for the given parameters.
///
/// # Errors
///
/// Returns a [`ParamsError`] if the parameters fail validation.
pub fn compute_table(params: &Params) -> Result<StateTable, ParamsError> {
    params.validate()?;

    let states = State::generate(params.num_props, params.max_height);
    let n = states.len();
    let mut cells = vec![NO_TRANSITION; n * n];

    for (from_idx, &state) in states.iter().enumerate() {
        for (to, throw_height) in TransitionIter::new(state, params.max_height) {
            let to_idx = to.combinatorial_rank();
            if let Some(cell) = cells.get_mut(from_idx * n + to_idx) {
                *cell = throw_height;
            }
        }
    }

    Ok(StateTable {
        // State::generate with validated params (num_props <= max_height) always produces
        // at least one state (the ground state), so index 0 is always valid.
        #[allow(clippy::indexing_slicing)]
        ground_state: states[0],
        states,
        cells,
        num_props: params.num_props,
        max_height: params.max_height,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state_notation::compute_graph;

    fn params(num_props: u8, max_height: u8) -> Params {
        Params {
            num_props,
            max_height,
        }
    }

    #[test]
    fn test_table_dimensions() {
        let table = compute_table(&params(3, 5)).unwrap();
        let n = table.states.len();
        assert_eq!(n, 10, "C(5,3) = 10 states");
        assert_eq!(table.cells.len(), n * n, "flat table should have n*n cells");
    }

    #[test]
    fn test_cells_match_graph_edges() {
        let p = params(3, 5);
        let graph = compute_graph(&p).unwrap();
        let table = compute_table(&p).unwrap();

        for edge in &graph.edges {
            let from_idx = edge.from.combinatorial_rank();
            let to_idx = edge.to.combinatorial_rank();
            assert_eq!(
                table.cell(from_idx, to_idx),
                Some(edge.throw_height),
                "cell [{from_idx}][{to_idx}] should be Some({})",
                edge.throw_height
            );
        }
    }

    #[test]
    fn test_none_for_non_transitions() {
        let table = compute_table(&params(3, 5)).unwrap();
        let p = params(3, 5);
        let graph = compute_graph(&p).unwrap();

        let mut edge_set = std::collections::HashSet::new();
        for edge in &graph.edges {
            let from_idx = edge.from.combinatorial_rank();
            let to_idx = edge.to.combinatorial_rank();
            edge_set.insert((from_idx, to_idx));
        }

        let n = table.states.len();
        for from in 0..n {
            for to in 0..n {
                if !edge_set.contains(&(from, to)) {
                    assert_eq!(
                        table.cell(from, to),
                        None,
                        "cell [{from}][{to}] should be None"
                    );
                }
            }
        }
    }

    #[test]
    fn test_ground_state_correctness() {
        let table = compute_table(&params(3, 5)).unwrap();
        assert_eq!(table.ground_state.bits(), 0b00111);
    }

    #[test]
    fn test_single_state() {
        let table = compute_table(&params(3, 3)).unwrap();
        assert_eq!(table.states.len(), 1, "single state");
        assert_eq!(table.cells.len(), 1, "single cell in flat table");
        // Self-loop: throw height == max_height
        assert_eq!(table.cell(0, 0), Some(3), "self-loop with throw 3");
    }

    #[test]
    fn test_metadata() {
        let table = compute_table(&params(3, 5)).unwrap();
        assert_eq!(table.num_props, 3);
        assert_eq!(table.max_height, 5);
    }

    #[test]
    fn test_invalid_params() {
        assert!(compute_table(&params(5, 3)).is_err());
    }

    #[test]
    fn test_some_count_equals_edge_count() {
        let p = params(3, 5);
        let graph = compute_graph(&p).unwrap();
        let table = compute_table(&p).unwrap();

        let some_count = table.cells.iter().filter(|&&c| c != NO_TRANSITION).count();
        assert_eq!(some_count, graph.edges.len());
    }
}
