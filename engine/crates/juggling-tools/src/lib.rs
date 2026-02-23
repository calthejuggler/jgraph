//! Core juggling algorithms: state notation, transitions, and graph generation.
//!
//! This crate provides the computational foundation for juggling pattern analysis
//! using siteswap state notation. It can enumerate all valid juggling states for a
//! given number of props and maximum throw height, compute transitions between states,
//! and build complete state transition graphs.

/// State notation types and graph computation for juggling patterns.
pub mod state_notation;

/// General-purpose combinatorial utilities.
pub mod util;
