use std::fmt::Display;

use super::state::{Bits, MAX_MAX_HEIGHT, State};

/// A single transition from one juggling [`State`] to another, representing a throw
/// of a specific height.
///
/// Each transition records the source and destination states, the throw height that
/// caused the transition, and the `max_height` context needed for display formatting.
#[derive(Debug, Copy, Clone)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
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
    /// Return the source state of this transition.
    pub const fn from(&self) -> State {
        self.from
    }

    /// Return the destination state of this transition.
    pub const fn to(&self) -> State {
        self.to
    }

    /// Return the throw height that causes this transition.
    pub const fn throw_height(&self) -> u8 {
        self.throw_height
    }

    /// Compute all valid transitions from the given `state` within `max_height`.
    ///
    /// If the rightmost bit (position 0) is empty, the only transition is a zero-throw
    /// (time step with no catch). If a prop is landing (rightmost bit set), one transition
    /// is generated for each unoccupied future beat the prop could be thrown to.
    pub fn from_state(state: State, max_height: u8) -> Vec<Self> {
        TransitionIter::new(state, max_height)
            .map(|(to, throw_height)| Self {
                from: state,
                to,
                throw_height,
                max_height,
            })
            .collect()
    }
}

/// Iterator over all valid transitions from a juggling state.
///
/// Yields `(destination_state, throw_height)` pairs. For states with no prop landing
/// on the current beat, yields a single zero-throw. For states with a prop landing,
/// yields one transition per unoccupied future beat.
#[derive(Debug, Clone)]
#[allow(missing_copy_implementations)]
pub struct TransitionIter {
    shifted: Bits,
    available: Bits,
    zero_throw_pending: bool,
}

impl TransitionIter {
    /// Create an iterator over transitions from `state` within `max_height`.
    pub const fn new(state: State, max_height: u8) -> Self {
        let rightmost = state.bits() & 1 != 0;
        let shifted = state.bits() >> 1;

        if rightmost {
            let mask: Bits = if max_height >= MAX_MAX_HEIGHT {
                Bits::MAX
            } else {
                (1 << max_height) - 1
            };
            Self {
                shifted,
                available: !shifted & mask,
                zero_throw_pending: false,
            }
        } else {
            Self {
                shifted,
                available: 0,
                zero_throw_pending: true,
            }
        }
    }
}

impl Iterator for TransitionIter {
    type Item = (State, u8);

    #[allow(clippy::cast_possible_truncation)]
    fn next(&mut self) -> Option<Self::Item> {
        if self.zero_throw_pending {
            self.zero_throw_pending = false;
            return Some((State::from_bits(self.shifted), 0));
        }

        if self.available == 0 {
            return None;
        }

        let bit = self.available & self.available.wrapping_neg();
        self.available ^= bit;
        let throw_height = bit.trailing_zeros() as u8 + 1;
        Some((State::from_bits(self.shifted | bit), throw_height))
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        let remaining = if self.zero_throw_pending {
            1
        } else {
            self.available.count_ones() as usize
        };
        (remaining, Some(remaining))
    }
}

impl ExactSizeIterator for TransitionIter {}
impl std::iter::FusedIterator for TransitionIter {}

#[cfg(test)]
mod tests {
    use super::*;

    use super::super::state::Bits;

    fn state(bits: Bits, max_height: u8) -> State {
        State::new(bits, max_height).unwrap()
    }

    #[test]
    fn test_no_prop_landing_single_transition() {
        let s = state(0b110, 3);
        let transitions = Transition::from_state(s, 3);
        assert_eq!(transitions.len(), 1);
        assert_eq!(transitions[0].throw_height(), 0);
        assert_eq!(transitions[0].to().bits(), 0b011);
    }

    #[test]
    fn test_prop_landing_single_empty_slot() {
        let s = state(0b111, 3);
        let transitions = Transition::from_state(s, 3);
        assert_eq!(transitions.len(), 1);
        assert_eq!(transitions[0].throw_height(), 3);
        assert_eq!(transitions[0].to().bits(), 0b111);
    }

    #[test]
    fn test_prop_landing_multiple_transitions() {
        let s = state(0b00111, 5);
        let transitions = Transition::from_state(s, 5);
        assert_eq!(transitions.len(), 3);
        let heights: Vec<u8> = transitions.iter().map(|t| t.throw_height()).collect();
        assert_eq!(heights, vec![3, 4, 5]);
        let destinations: Vec<Bits> = transitions.iter().map(|t| t.to().bits()).collect();
        assert_eq!(destinations, vec![0b00111, 0b01011, 0b10011]);
    }

    #[test]
    fn test_skips_occupied_positions() {
        let s = state(0b10101, 5);
        let transitions = Transition::from_state(s, 5);
        let heights: Vec<u8> = transitions.iter().map(|t| t.throw_height()).collect();
        assert_eq!(heights, vec![1, 3, 5]);
        let destinations: Vec<Bits> = transitions.iter().map(|t| t.to().bits()).collect();
        assert_eq!(destinations, vec![0b01011, 0b01110, 0b11010]);
    }

    #[test]
    fn test_throw_height_calculation() {
        let s = state(0b10101, 5);
        let transitions = Transition::from_state(s, 5);
        for t in &transitions {
            let shifted = s.bits() >> 1;
            let diff = t.to().bits() ^ shifted;
            let bit_pos = diff.trailing_zeros() as u8;
            assert_eq!(t.throw_height(), bit_pos + 1);
        }
    }

    #[test]
    fn test_preserves_prop_count() {
        let max_height = 5;
        let states = State::generate(3, max_height);
        for s in &states {
            let transitions = Transition::from_state(*s, max_height);
            for t in &transitions {
                assert_eq!(
                    t.from().bits().count_ones(),
                    t.to().bits().count_ones(),
                    "prop count changed: from {:b} to {:b}",
                    t.from().bits(),
                    t.to().bits()
                );
            }
        }
    }

    #[test]
    fn test_to_states_within_bounds() {
        let max_height: u8 = 5;
        let states = State::generate(3, max_height);
        for s in &states {
            let transitions = Transition::from_state(*s, max_height);
            for t in &transitions {
                assert_eq!(
                    t.to().bits() >> max_height,
                    0,
                    "to state {:b} exceeds max_height {}",
                    t.to().bits(),
                    max_height
                );
            }
        }
    }

    #[test]
    fn test_display_format() {
        let s = state(0b111, 3);
        let transitions = Transition::from_state(s, 3);
        let display = format!("{}", transitions[0]);
        assert_eq!(display, "xxx (3)");
    }

    #[test]
    fn test_ground_state_transitions() {
        let s = state(0b00111, 5);
        let transitions = Transition::from_state(s, 5);
        let mut heights: Vec<u8> = transitions.iter().map(|t| t.throw_height()).collect();
        heights.sort();
        assert_eq!(heights, vec![3, 4, 5]);
    }

    #[test]
    fn test_all_states_have_transitions() {
        let max_height = 5;
        let states = State::generate(3, max_height);
        for s in &states {
            let transitions = Transition::from_state(*s, max_height);
            assert!(
                !transitions.is_empty(),
                "state {:b} has no transitions",
                s.bits()
            );
        }
    }
}
