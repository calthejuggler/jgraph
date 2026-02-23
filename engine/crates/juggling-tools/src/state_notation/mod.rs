/// State transition graph generation from validated parameters.
mod graph;
/// Juggling state representation using bit-packed notation.
mod state;
/// Transitions between juggling states (throws and catches).
mod transition;

pub use graph::{Edge, GraphParams, GraphParamsError, StateGraph, compute_graph};
pub use state::{Bits, MAX_MAX_HEIGHT, State};
pub use transition::Transition;
