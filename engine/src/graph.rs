use std::fmt::Write;

use crate::{state, transition};

pub struct Graph {
    states: Vec<state::State>,
    edges: Vec<transition::Transition>,
    max_height: u8,
}

impl Graph {
    pub fn new(num_balls: u8, max_height: u8) -> Self {
        let states = state::generate_states(num_balls, max_height);
        let edges: Vec<transition::Transition> = states
            .iter()
            .flat_map(|s| transition::get_transitions(*s, max_height))
            .collect();

        Self {
            states,
            edges,
            max_height,
        }
    }

    pub fn print(&self) {
        let mut output = String::new();
        for state in &self.states {
            let outgoing: Vec<_> = self
                .edges
                .iter()
                .filter(|e| e.get_from() == *state)
                .collect();

            let outgoing_str = outgoing
                .iter()
                .map(|t| t.to_string())
                .collect::<Vec<_>>()
                .join(", ");

            writeln!(
                output,
                "{} -> {}",
                state.display(self.max_height),
                outgoing_str
            )
            .unwrap();
        }
        print!("{}", output);
    }
}
