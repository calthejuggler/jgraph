/// Compute the binomial coefficient C(n, k) — the number of ways to choose `k` items
/// from `n` items without regard to order.
///
/// Returns 0 when `k > n`. Uses saturating multiplication to avoid overflow on large inputs.
pub fn combinations(n: u64, k: u64) -> u64 {
    if k > n {
        return 0;
    }
    let k = k.min(n - k);
    let mut result: u64 = 1;
    for i in 0..k {
        result = result.saturating_mul(n - i) / (i + 1);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_combinations_basic_values() {
        assert_eq!(combinations(5, 2), 10);
        assert_eq!(combinations(10, 3), 120);
        assert_eq!(combinations(6, 3), 20);
        assert_eq!(combinations(4, 2), 6);
    }

    #[test]
    fn test_combinations_edge_cases() {
        assert_eq!(combinations(5, 0), 1);
        assert_eq!(combinations(5, 5), 1);
        assert_eq!(combinations(3, 5), 0);
    }

    #[test]
    fn test_combinations_symmetry() {
        for n in 0..=10 {
            for k in 0..=n {
                assert_eq!(
                    combinations(n, k),
                    combinations(n, n - k),
                    "C({},{}) != C({},{})",
                    n,
                    k,
                    n,
                    n - k
                );
            }
        }
    }

    #[test]
    fn test_combinations_large_values_no_panic() {
        let _ = combinations(64, 32);
    }
}
