use std::fmt::Display;

use crate::state::State;

#[derive(Debug)]
pub struct Transition {
    from: State,
    to: State,
    throw_height: u8,
    max_height: u8,
}

impl Display for Transition {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{} ({})",
            self.to.display(self.max_height),
            self.throw_height
        )
    }
}

impl Transition {
    pub fn get_from(&self) -> State {
        self.from
    }

    pub fn get_to(&self) -> State {
        self.to
    }

    pub fn get_throw_height(&self) -> u8 {
        self.throw_height
    }
}

pub fn get_transitions(state: State, max_height: u8) -> Vec<Transition> {
    let mut transitions: Vec<Transition> = vec![];

    let rightmost = state.bits() & 1 != 0;
    let shifted = state.bits() >> 1;

    if !rightmost {
        transitions.push(Transition {
            from: state,
            to: State::new(shifted, max_height).unwrap(),
            throw_height: 0,
            max_height,
        });
    } else {
        for bit_pos in 0..max_height {
            if (shifted >> bit_pos) & 1 == 0 {
                let new_bits = shifted | (1 << bit_pos);
                let throw_height = (bit_pos + 1) as u8;

                transitions.push(Transition {
                    from: state,
                    to: State::new(new_bits, max_height).unwrap(),
                    throw_height,
                    max_height,
                });
            }
        }
    }

    transitions
}
