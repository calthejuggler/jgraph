/// The underlying integer type used to represent juggling state bitmasks.
///
/// Selected at compile time via feature flags: `state-u8`, `state-u16`, `state-u64`,
/// or `state-u128`. Defaults to `u32` when no feature is specified.
#[cfg(feature = "state-u8")]
pub type Bits = u8;
/// The underlying integer type used to represent juggling state bitmasks.
#[cfg(feature = "state-u16")]
pub type Bits = u16;
/// The underlying integer type used to represent juggling state bitmasks.
#[cfg(not(any(
    feature = "state-u8",
    feature = "state-u16",
    feature = "state-u64",
    feature = "state-u128"
)))]
pub type Bits = u32;
/// The underlying integer type used to represent juggling state bitmasks.
#[cfg(feature = "state-u64")]
pub type Bits = u64;
/// The underlying integer type used to represent juggling state bitmasks.
#[cfg(feature = "state-u128")]
pub type Bits = u128;

/// The maximum allowed throw height, equal to the number of bits in [`Bits`].
#[allow(clippy::cast_possible_truncation)]
pub const MAX_MAX_HEIGHT: u8 = Bits::BITS as u8;

/// A juggling state represented as a bitmask where each set bit indicates a prop
/// scheduled to land at that beat offset.
///
/// The least significant bit represents the current beat (position 0), and higher bits
/// represent future beats. A state with `num_props` set bits has exactly that many
/// props in the air.
#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct State(Bits);

impl State {
    /// Create a new state from raw bits, validating that no bits are set above `max_height`.
    ///
    /// # Errors
    ///
    /// Returns an error if `max_height` exceeds [`MAX_MAX_HEIGHT`], or if any bits
    /// above position `max_height - 1` are set.
    pub fn new(bits: Bits, max_height: u8) -> Result<Self, String> {
        if max_height > MAX_MAX_HEIGHT {
            return Err(format!("max_height {max_height} exceeds {MAX_MAX_HEIGHT}"));
        }
        if max_height < MAX_MAX_HEIGHT && bits >> max_height != 0 {
            return Err(format!(
                "bits {bits:#b} has bits set above max_height {max_height}"
            ));
        }
        Ok(Self(bits))
    }

    /// Create a state directly from raw bits without validation.
    ///
    /// # Safety (logical)
    ///
    /// The caller must ensure that no bits above the intended `max_height` are set.
    /// This is intended for internal use where bit arithmetic already guarantees validity.
    pub(crate) const fn from_bits(bits: Bits) -> Self {
        Self(bits)
    }

    /// Return the raw bitmask underlying this state.
    pub const fn bits(&self) -> Bits {
        self.0
    }

    /// Check whether a prop is scheduled to land at beat offset `pos`.
    pub const fn prop_at(&self, pos: u8) -> bool {
        (self.0 >> pos) & 1 != 0
    }

    /// Format the state as a human-readable string using `x` for occupied beats
    /// and `0` for empty beats, most-significant bit first.
    pub fn display(&self, max_height: u8) -> String {
        (0..max_height)
            .rev()
            .map(|i| if self.prop_at(i) { 'x' } else { '0' })
            .collect()
    }

    /// Format the state as a binary string (`1`/`0`), most-significant bit first.
    pub fn to_binary_string(self, max_height: u8) -> String {
        (0..max_height)
            .rev()
            .map(|i| if self.prop_at(i) { '1' } else { '0' })
            .collect()
    }

    /// Generate all valid states with exactly `num_props` set bits within `max_height` positions.
    ///
    /// States are returned in a deterministic order produced by backtracking enumeration.
    /// The first state is always the "ground state" (lowest bits set).
    pub fn generate(num_props: u8, max_height: u8) -> Vec<Self> {
        let mut states: Vec<Self> = vec![];
        Self::backtrack(max_height, 0, num_props, 0, &mut states);
        states
    }

    fn backtrack(max_height: u8, pos: u8, props_left: u8, current: Bits, states: &mut Vec<Self>) {
        let remaining = max_height - pos;
        if props_left > remaining {
            return;
        }
        if pos == max_height {
            if props_left == 0 {
                states.push(Self(current));
            }
            return;
        }

        Self::backtrack(max_height, pos + 1, props_left, current, states);

        if props_left > 0 {
            Self::backtrack(
                max_height,
                pos + 1,
                props_left - 1,
                current | (1 << (max_height - 1 - pos)),
                states,
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_new_valid_state() {
        let s = State::new(0b101, 5).unwrap();
        assert_eq!(s.bits(), 0b101);
    }

    #[test]
    fn test_new_rejects_max_height_above_limit() {
        assert!(State::new(0, MAX_MAX_HEIGHT + 1).is_err());
    }

    #[test]
    fn test_new_rejects_bits_exceeding_max_height() {
        assert!(State::new(0b100000, 5).is_err());
    }

    #[test]
    fn test_new_max_height_allows_all_bits() {
        let s = State::new(Bits::MAX, MAX_MAX_HEIGHT);
        assert!(s.is_ok());
    }

    #[test]
    fn test_prop_at() {
        let s = State::new(0b1010, 4).unwrap();
        assert!(!s.prop_at(0));
        assert!(s.prop_at(1));
        assert!(!s.prop_at(2));
        assert!(s.prop_at(3));
    }

    #[test]
    fn test_display_format() {
        let s = State::new(0b10110, 5).unwrap();
        assert_eq!(s.display(5), "x0xx0");
    }

    #[test]
    fn test_to_binary_string() {
        let s = State::new(0b10110, 5).unwrap();
        assert_eq!(s.to_binary_string(5), "10110");
    }

    #[test]
    fn test_display_vs_binary_string_consistency() {
        let s = State::new(0b10110, 5).unwrap();
        let display = s.display(5);
        let binary = s.to_binary_string(5);
        for (d, b) in display.chars().zip(binary.chars()) {
            match b {
                '1' => assert_eq!(d, 'x'),
                '0' => assert_eq!(d, '0'),
                _ => panic!("unexpected char in binary string"),
            }
        }
    }

    #[test]
    fn test_generate_count_matches_combinations() {
        use crate::util::combinations;
        let cases = [(3, 5), (2, 4), (4, 8), (1, 3), (5, 5)];
        for (n, k) in cases {
            let states = State::generate(n, k);
            let expected = combinations(k as u64, n as u64) as usize;
            assert_eq!(
                states.len(),
                expected,
                "generate({},{}) produced {} states, expected {}",
                n,
                k,
                states.len(),
                expected
            );
        }
    }

    #[test]
    fn test_generate_all_states_have_correct_popcount() {
        let states = State::generate(3, 5);
        for s in &states {
            assert_eq!(
                s.bits().count_ones(),
                3,
                "state {:b} has wrong popcount",
                s.bits()
            );
        }
    }

    #[test]
    fn test_generate_no_duplicates() {
        let states = State::generate(3, 5);
        let set: HashSet<Bits> = states.iter().map(|s| s.bits()).collect();
        assert_eq!(set.len(), states.len());
    }

    #[test]
    fn test_generate_all_bits_within_max_height() {
        let max_height: u8 = 5;
        let states = State::generate(3, max_height);
        for s in &states {
            assert_eq!(
                s.bits() >> max_height,
                0,
                "state {:b} has bits above max_height {}",
                s.bits(),
                max_height
            );
        }
    }

    #[test]
    fn test_generate_known_states() {
        let states = State::generate(3, 5);
        assert_eq!(states.len(), 10);
        let bits: HashSet<Bits> = states.iter().map(|s| s.bits()).collect();
        let expected: HashSet<Bits> = [
            0b00111, 0b01011, 0b01101, 0b01110, 0b10011, 0b10101, 0b10110, 0b11001, 0b11010,
            0b11100,
        ]
        .into_iter()
        .collect();
        assert_eq!(bits, expected);
    }
}
