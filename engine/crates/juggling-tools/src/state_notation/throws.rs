use super::state::{MAX_MAX_HEIGHT, State};
use super::transition::Transition;

/// A single possible throw from a juggling state: the throw height and the
/// resulting destination state.
#[derive(Debug, Copy, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Throw {
    height: u8,
    destination: State,
}

impl Throw {
    /// Return the throw height.
    pub const fn height(&self) -> u8 {
        self.height
    }

    /// Return the state that results from making this throw.
    pub const fn destination(&self) -> State {
        self.destination
    }
}

/// Compute all valid throws from the given `state` within `max_height`.
///
/// Returns one [`Throw`] per legal throw: if no prop is landing on the current
/// beat the only option is a zero-throw (time step), otherwise one throw exists
/// for each unoccupied future beat the prop could be sent to.
///
/// # Errors
///
/// Returns an error if `max_height` exceeds [`MAX_MAX_HEIGHT`] or if `state`
/// has bits set above `max_height`.
pub fn compute_throws(state: State, max_height: u8) -> Result<Vec<Throw>, String> {
    if max_height > MAX_MAX_HEIGHT {
        return Err(format!("max_height {max_height} exceeds {MAX_MAX_HEIGHT}"));
    }
    if max_height < MAX_MAX_HEIGHT && state.bits() >> max_height != 0 {
        return Err(format!(
            "state bits {:#b} exceed max_height {max_height}",
            state.bits()
        ));
    }

    let throws = Transition::from_state(state, max_height)
        .into_iter()
        .map(|t| Throw {
            height: t.throw_height(),
            destination: t.to(),
        })
        .collect();

    Ok(throws)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state_notation::state::Bits;

    fn state(bits: Bits, max_height: u8) -> State {
        State::new(bits, max_height).unwrap()
    }

    #[test]
    fn zero_throw_when_no_prop_landing() {
        let s = state(0b110, 3);
        let throws = compute_throws(s, 3).unwrap();
        assert_eq!(throws.len(), 1);
        assert_eq!(throws[0].height(), 0);
        assert_eq!(throws[0].destination().bits(), 0b011);
    }

    #[test]
    fn single_throw_when_all_slots_full() {
        let s = state(0b111, 3);
        let throws = compute_throws(s, 3).unwrap();
        assert_eq!(throws.len(), 1);
        assert_eq!(throws[0].height(), 3);
        assert_eq!(throws[0].destination().bits(), 0b111);
    }

    #[test]
    fn multiple_throws_from_ground_state() {
        let s = state(0b00111, 5);
        let throws = compute_throws(s, 5).unwrap();
        assert_eq!(throws.len(), 3);
        let heights: Vec<u8> = throws.iter().map(|t| t.height()).collect();
        assert_eq!(heights, vec![3, 4, 5]);
    }

    #[test]
    fn skips_occupied_positions() {
        let s = state(0b10101, 5);
        let throws = compute_throws(s, 5).unwrap();
        let heights: Vec<u8> = throws.iter().map(|t| t.height()).collect();
        assert_eq!(heights, vec![1, 3, 5]);
        let destinations: Vec<Bits> = throws.iter().map(|t| t.destination().bits()).collect();
        assert_eq!(destinations, vec![0b01011, 0b01110, 0b11010]);
    }

    #[test]
    fn preserves_prop_count() {
        let max_height = 5;
        let states = State::generate(3, max_height);
        for s in &states {
            let throws = compute_throws(*s, max_height).unwrap();
            for t in &throws {
                assert_eq!(
                    s.bits().count_ones(),
                    t.destination().bits().count_ones(),
                    "prop count changed: from {:b} to {:b}",
                    s.bits(),
                    t.destination().bits()
                );
            }
        }
    }

    #[test]
    fn destinations_within_bounds() {
        let max_height: u8 = 5;
        let states = State::generate(3, max_height);
        for s in &states {
            let throws = compute_throws(*s, max_height).unwrap();
            for t in &throws {
                assert_eq!(
                    t.destination().bits() >> max_height,
                    0,
                    "destination {:b} exceeds max_height {}",
                    t.destination().bits(),
                    max_height
                );
            }
        }
    }

    #[test]
    fn rejects_invalid_max_height() {
        let s = State::from_bits(0);
        assert!(compute_throws(s, MAX_MAX_HEIGHT + 1).is_err());
    }

    #[test]
    fn rejects_state_bits_exceeding_max_height() {
        let s = State::from_bits(0b100000);
        assert!(compute_throws(s, 5).is_err());
    }

    #[test]
    fn matches_transition_from_state() {
        let max_height = 5;
        let states = State::generate(3, max_height);
        for s in &states {
            let transitions = Transition::from_state(*s, max_height);
            let throws = compute_throws(*s, max_height).unwrap();
            assert_eq!(transitions.len(), throws.len());
            for (tr, th) in transitions.iter().zip(throws.iter()) {
                assert_eq!(tr.throw_height(), th.height());
                assert_eq!(tr.to(), th.destination());
            }
        }
    }
}
