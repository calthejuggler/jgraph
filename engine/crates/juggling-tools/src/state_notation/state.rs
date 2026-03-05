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

/// Convert a numeric value to its siteswap character: 0–9 map to `'0'`–`'9'`,
/// 10–35 map to `'a'`–`'z'`.
const fn siteswap_char(n: u8) -> char {
    match n {
        0..=9 => (b'0' + n) as char,
        10..=35 => (b'a' + n - 10) as char,
        _ => '?',
    }
}

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

    /// Format the state using abbreviated notation, where each digit counts the gap
    /// (number of zeros) before the next set bit, scanning from MSB to LSB.
    ///
    /// The output has exactly `num_props` digits (one per set bit). Gaps of 10 or more
    /// use siteswap letter notation (`a`=10, `b`=11, ..., `z`=35).
    pub fn to_abbreviated_string(self, max_height: u8) -> String {
        let mut result = String::new();
        let mut gap: u8 = 0;
        for pos in (0..max_height).rev() {
            if self.prop_at(pos) {
                result.push(siteswap_char(gap));
                gap = 0;
            } else {
                gap += 1;
            }
        }
        result
    }

    /// Generate all valid states with exactly `num_props` set bits within `max_height` positions.
    ///
    /// States are returned in ascending numeric order. The first state is always the
    /// "ground state" (lowest bits set).
    #[allow(clippy::cast_possible_truncation)]
    pub fn generate(num_props: u8, max_height: u8) -> Vec<Self> {
        let count = crate::util::binom(max_height, num_props) as usize;
        let mut states = Vec::with_capacity(count);

        if count == 0 {
            return states;
        }

        // Ground state: lowest num_props bits set.
        let mut x: Bits = if num_props >= MAX_MAX_HEIGHT {
            Bits::MAX
        } else {
            (1 << num_props) - 1
        };
        states.push(Self(x));

        for _ in 1..count {
            x = next_combination(x);
            states.push(Self(x));
        }

        states
    }

    /// Return the zero-based index of this state among all states with the same
    /// popcount, ordered by ascending numeric value.
    #[allow(clippy::cast_possible_truncation)]
    pub fn combinatorial_rank(&self) -> usize {
        let mut rank: usize = 0;
        let mut bits = self.0;
        let mut i: u8 = 0;
        while bits != 0 {
            let pos = bits.trailing_zeros() as u8;
            i += 1;
            rank += crate::util::binom(pos, i) as usize;
            bits &= bits.wrapping_sub(1);
        }
        rank
    }
}

/// Return the next-larger integer with exactly the same number of set bits (Gosper's hack).
///
/// See <https://programmingforinsomniacs.blogspot.com/2018/03/gospers-hack-explained.html>.
#[allow(clippy::cast_possible_truncation)]
const fn next_combination(x: Bits) -> Bits {
    debug_assert!(x != 0, "next_combination requires x > 0");
    let c = x & x.wrapping_neg();
    let r = x.wrapping_add(c);
    let diff = r ^ x;
    let shift = c.trailing_zeros() + 2;
    let adjusted = if shift >= Bits::BITS {
        0
    } else {
        diff >> shift
    };
    r | adjusted
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

    #[test]
    fn test_abbreviated_all_ones() {
        // 111 (3 props, max_height 3) → "000"
        let s = State::new(0b111, 3).unwrap();
        assert_eq!(s.to_abbreviated_string(3), "000");
    }

    #[test]
    fn test_abbreviated_01101() {
        // 01101 (3 props, max_height 5) → "101"
        let s = State::new(0b01101, 5).unwrap();
        assert_eq!(s.to_abbreviated_string(5), "101");
    }

    #[test]
    fn test_abbreviated_101001() {
        // 101001 (3 props, max_height 6) → "012"
        let s = State::new(0b101001, 6).unwrap();
        assert_eq!(s.to_abbreviated_string(6), "012");
    }

    #[test]
    fn test_abbreviated_ground_state() {
        // Ground state: 3 props / 5 max_height → 00111 → "200"
        let s = State::new(0b00111, 5).unwrap();
        assert_eq!(s.to_abbreviated_string(5), "200");
    }

    #[test]
    fn test_generate_ascending_order() {
        let states = State::generate(3, 5);
        let bits: Vec<Bits> = states.iter().map(|s| s.bits()).collect();
        for window in bits.windows(2) {
            assert!(
                window[0] < window[1],
                "states not in ascending order: {} >= {}",
                window[0],
                window[1]
            );
        }
    }

    #[test]
    fn test_generate_snapshot_3_5() {
        let states = State::generate(3, 5);
        let bits: Vec<Bits> = states.iter().map(|s| s.bits()).collect();
        assert_eq!(
            bits,
            vec![
                0b00111, 0b01011, 0b01101, 0b01110, 0b10011, 0b10101, 0b10110, 0b11001, 0b11010,
                0b11100
            ],
            "exact state ordering for (3,5)"
        );
    }

    #[test]
    fn test_combinatorial_rank_matches_index() {
        for (num_props, max_height) in [(3, 5), (2, 4), (4, 8), (1, 3), (5, 5), (0, 3)] {
            let states = State::generate(num_props, max_height);
            for (expected_idx, state) in states.iter().enumerate() {
                assert_eq!(
                    state.combinatorial_rank(),
                    expected_idx,
                    "rank mismatch for state {:b} (num_props={}, max_height={})",
                    state.bits(),
                    num_props,
                    max_height,
                );
            }
        }
    }

    #[test]
    fn test_generate_single_prop_max_height() {
        let states = State::generate(1, MAX_MAX_HEIGHT);
        assert_eq!(states.len(), MAX_MAX_HEIGHT as usize);
        for (i, s) in states.iter().enumerate() {
            assert_eq!(s.bits(), 1 << i);
        }
    }

    #[test]
    fn test_abbreviated_output_length_equals_num_props() {
        for (num_props, max_height) in [(3, 5), (2, 4), (4, 8), (1, 3), (5, 5)] {
            let states = State::generate(num_props, max_height);
            for s in &states {
                assert_eq!(
                    s.to_abbreviated_string(max_height).len(),
                    num_props as usize,
                    "abbreviated length for state {:b} (num_props={}, max_height={}) should be {}",
                    s.bits(),
                    num_props,
                    max_height,
                    num_props,
                );
            }
        }
    }
}
