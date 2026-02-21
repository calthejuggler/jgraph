type Bits = u64;

#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug)]
pub struct State(Bits);

impl State {
    pub fn new(bits: Bits, max_height: u8) -> Result<Self, String> {
        if max_height > 64 {
            return Err(format!("max_height {} exceeds 64", max_height));
        }
        if max_height < 64 && bits >> max_height != 0 {
            return Err(format!(
                "bits {:#b} has bits set above max_height {}",
                bits, max_height
            ));
        }
        Ok(State(bits))
    }

    pub fn bits(&self) -> Bits {
        self.0
    }

    pub fn ball_at(&self, pos: u8) -> bool {
        (self.0 >> pos) & 1 != 0
    }

    pub fn num_balls(&self) -> u32 {
        self.0.count_ones()
    }

    pub fn display(&self, max_height: u8) -> String {
        (0..max_height)
            .rev()
            .map(|i| if self.ball_at(i) { 'x' } else { '0' })
            .collect()
    }
}

fn backtrack(max_height: u8, pos: u8, balls_left: u8, current: Bits, states: &mut Vec<State>) {
    let remaining = max_height - pos;
    if balls_left > remaining {
        return;
    }
    if pos == max_height {
        if balls_left == 0 {
            states.push(State(current));
        }
        return;
    }

    // Place '0' at this position (bit stays 0)
    backtrack(max_height, pos + 1, balls_left, current, states);

    // Place 'x' at this position (set bit)
    if balls_left > 0 {
        backtrack(
            max_height,
            pos + 1,
            balls_left - 1,
            current | (1 << (max_height - 1 - pos)),
            states,
        );
    }
}

pub fn generate_states(num_balls: u8, max_height: u8) -> Vec<State> {
    let mut states: Vec<State> = vec![];
    backtrack(max_height, 0, num_balls, 0, &mut states);
    states
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generate_states_count() {
        // C(5,3) = 10
        let states = generate_states(3, 5);
        assert_eq!(states.len(), 10);
    }

    #[test]
    fn state_display_roundtrip() {
        // "0x00x" -> bit4=0, bit3=1, bit2=0, bit1=0, bit0=1 -> 0b01001 = 9
        let state = State::new(0b01001, 5).unwrap();
        assert_eq!(state.display(5), "0x00x");
    }

    #[test]
    fn ball_at() {
        let state = State::new(0b01001, 5).unwrap();
        assert!(state.ball_at(0));
        assert!(!state.ball_at(1));
        assert!(!state.ball_at(2));
        assert!(state.ball_at(3));
        assert!(!state.ball_at(4));
    }

    #[test]
    fn num_balls() {
        let state = State::new(0b01001, 5).unwrap();
        assert_eq!(state.num_balls(), 2);
    }

    #[test]
    fn rejects_bits_above_max_height() {
        assert!(State::new(0b100000, 5).is_err());
    }
}
